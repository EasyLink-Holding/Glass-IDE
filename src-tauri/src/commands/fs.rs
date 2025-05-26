//! File-system related Tauri commands
//! Currently only exposes `read_dir_snapshot`, which returns a flattened tree
//! suitable for virtual rendering on the frontend.

use anyhow::Error as AnyError;
use dirs_next::cache_dir;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use std::time::{Duration, Instant, SystemTime};
use tauri::{Emitter, Manager, Runtime, Window};
use walkdir::{DirEntry, WalkDir};
use xxhash_rust::xxh3::xxh3_64;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FsNode {
    pub id: String,
    pub name: String,
    pub depth: usize,
    pub kind: String, // "file" | "dir"
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FsChange {
    pub paths: Vec<String>,
    pub kind: String,
}

fn is_hidden(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
}

#[derive(Serialize, Deserialize)]
struct SnapshotCache {
    mtime: u64,
    nodes: Vec<FsNode>,
}

fn cache_file_for_root(root: &Path) -> Option<std::path::PathBuf> {
    let dir = cache_dir()?;
    let hash = xxh3_64(root.to_string_lossy().as_bytes());
    Some(dir.join(format!("glass_fs_cache_{hash:x}.json")))
}

#[tauri::command]
/// Return a flattened directory snapshot up to the requested depth.
/// depth = 0 => only root path itself
pub async fn read_dir_snapshot(path: String, depth: usize) -> tauri::Result<Vec<FsNode>> {
    let root = PathBuf::from(path);
    if !root.exists() {
        return Ok(vec![]);
    }

    // Try fast path via cached snapshot
    if let Ok(meta) = fs::metadata(&root) {
        if let Ok(modified) = meta.modified() {
            if let Ok(sec) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                let mtime = sec.as_secs();
                if let Some(cache_path) = cache_file_for_root(&root) {
                    if let Ok(bytes) = fs::read(&cache_path) {
                        if let Ok(cache) = serde_json::from_slice::<SnapshotCache>(&bytes) {
                            if cache.mtime == mtime {
                                return Ok(cache.nodes);
                            }
                        }
                    }
                }
            }
        }
    }

    let mut result = Vec::new();

    for entry in WalkDir::new(&root)
        .max_depth(depth + 1) // WalkDir depth is 1-based
        .into_iter()
        .filter_entry(|e| !is_hidden(e))
        .filter_map(Result::ok)
    {
        let rel_path = entry
            .path()
            .strip_prefix(&root)
            .unwrap_or_else(|_| Path::new(""));
        let depth = rel_path.components().count();
        let name = entry.file_name().to_string_lossy().into_owned();
        if depth == 0 {
            // Skip the root entry itself
            continue;
        }
        result.push(FsNode {
            id: entry.path().to_string_lossy().into_owned(),
            name,
            depth: depth - 1, // depth 1 => child of root => depth 0 in UI
            kind: if entry.file_type().is_dir() {
                "dir".into()
            } else {
                "file".into()
            },
        });
    }

    // Persist to cache for next launch
    if let Ok(meta) = fs::metadata(&root) {
        if let Ok(modified) = meta.modified() {
            if let Ok(sec) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                let mtime = sec.as_secs();
                if let Some(cache_path) = cache_file_for_root(&root) {
                    // Attempt to write but ignore errors
                    let _ =
                        fs::create_dir_all(cache_path.parent().unwrap_or_else(|| Path::new("/")));
                    let cache = SnapshotCache {
                        mtime,
                        nodes: result.clone(),
                    };
                    if let Ok(bytes) = serde_json::to_vec(&cache) {
                        let _ = fs::write(cache_path, bytes);
                    }
                }
            }
        }
    }

    Ok(result)
}

#[tauri::command]
/// Return immediate children of a directory (depth = 0 relative to the dir)
#[allow(dead_code)]
pub async fn read_dir_children(path: String) -> tauri::Result<Vec<FsNode>> {
    use anyhow::Error as AnyError;
    use std::fs as stdfs;

    let root = PathBuf::from(path);
    if !root.exists() {
        return Ok(vec![]);
    }

    let mut nodes = Vec::new();

    for entry in stdfs::read_dir(&root).map_err(AnyError::from)? {
        let entry = entry.map_err(AnyError::from)?;
        let file_name_os = entry.file_name();
        // Skip hidden dot-files / folders
        if file_name_os.to_string_lossy().starts_with('.') {
            continue;
        }
        let path = entry.path();
        let name = file_name_os.to_string_lossy().into_owned();
        nodes.push(FsNode {
            id: path.to_string_lossy().into_owned(),
            name,
            depth: 0,
            kind: if path.is_dir() {
                "dir".into()
            } else {
                "file".into()
            },
        });
    }

    Ok(nodes)
}

// Directories we don’t care about high-frequency events for – they generate a lot
// of noise (.git, node_modules…) and rarely matter for IDE operations.
const IGNORED_DIRS: &[&str] = &["node_modules", ".git", "target"];

/// Fast check whether a path lives inside an ignored directory.
fn should_ignore(path: &Path) -> bool {
    for comp in path.components() {
        if let Component::Normal(os) = comp {
            if let Some(s) = os.to_str() {
                if IGNORED_DIRS.contains(&s) {
                    return true;
                }
            }
        }
    }
    false
}

// -----------------------------
// File-system watcher
// -----------------------------

static WATCHERS: Lazy<Mutex<Vec<RecommendedWatcher>>> = Lazy::new(|| Mutex::new(Vec::new()));
// Accumulate events across short window to avoid flooding the frontend.
static EVENT_ACCUM: Lazy<Mutex<(HashSet<String>, Instant)>> =
    Lazy::new(|| Mutex::new((HashSet::new(), Instant::now())));

/// Flush accumulated fs paths if the debounce window has elapsed.
fn flush_changes<R: Runtime>(app: &tauri::AppHandle<R>) {
    const DEBOUNCE_MS: u128 = 120;
    let mut guard = EVENT_ACCUM.lock().unwrap();
    let elapsed = guard.1.elapsed().as_millis();
    if elapsed < DEBOUNCE_MS {
        return;
    }
    if guard.0.is_empty() {
        return;
    }
    let paths: Vec<String> = guard.0.drain().collect();
    guard.1 = Instant::now();
    drop(guard);
    let payload = FsChange {
        paths,
        kind: "Batch".into(),
    };
    let _ = app.emit("fs:change", payload);
}

#[tauri::command]
pub async fn start_fs_watch<R: Runtime>(window: Window<R>, path: String) -> tauri::Result<()> {
    let root = PathBuf::from(&path);
    if !root.exists() {
        return Ok(());
    }

    // Clone app handle once – clone again per closure to satisfy ownership
    let app_handle_main = window.app_handle().clone();

    // build watcher – prefer native platform watcher; fall back to poll watcher w/ low frequency
    let app_handle_cb = app_handle_main.clone();
    let callback = move |res: Result<notify::Event, notify::Error>| {
        if let Ok(event) = res {
            // Filter out ignored directories to cut down chatter
            let filtered: Vec<String> = event
                .paths
                .into_iter()
                .filter(|p| !should_ignore(p))
                .map(|p| p.to_string_lossy().into_owned())
                .collect();

            if filtered.is_empty() {
                return;
            }

            // Add unique paths to accumulator
            {
                let mut guard = EVENT_ACCUM.lock().unwrap();
                for p in &filtered {
                    guard.0.insert(p.clone());
                }
            }

            flush_changes(&app_handle_cb);
        }
    };

    // Attempt native watcher first
    let watcher_res = RecommendedWatcher::new(callback, Config::default());
    let mut watcher: RecommendedWatcher = match watcher_res {
        Ok(w) => w,
        Err(e) => {
            eprintln!("Native watcher unavailable, falling back to polling: {e}");
            let app_handle_poll = app_handle_main.clone();
            let poll_cb = move |res: Result<notify::Event, notify::Error>| {
                if let Ok(event) = res {
                    let filtered: Vec<String> = event
                        .paths
                        .into_iter()
                        .filter(|p| !should_ignore(p))
                        .map(|p| p.to_string_lossy().into_owned())
                        .collect();

                    if filtered.is_empty() {
                        return;
                    }

                    {
                        let mut guard = EVENT_ACCUM.lock().unwrap();
                        for p in &filtered {
                            guard.0.insert(p.clone());
                        }
                    }

                    flush_changes(&app_handle_poll);
                }
            };
            RecommendedWatcher::new(
                poll_cb,
                Config::default().with_poll_interval(Duration::from_secs(2)),
            )
            .map_err(AnyError::from)?
        }
    };

    watcher
        .watch(&root, RecursiveMode::Recursive)
        .map_err(AnyError::from)?;

    WATCHERS.lock().unwrap().push(watcher);

    Ok(())
}
