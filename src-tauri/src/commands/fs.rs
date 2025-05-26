//! File-system related Tauri commands
//! Currently only exposes `read_dir_snapshot`, which returns a flattened tree
//! suitable for virtual rendering on the frontend.

use anyhow::Error as AnyError;
use dirs_next::cache_dir;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::SystemTime;
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

// -----------------------------
// File-system watcher
// -----------------------------

static WATCHERS: Lazy<Mutex<Vec<RecommendedWatcher>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[tauri::command]
pub async fn start_fs_watch<R: Runtime>(window: Window<R>, path: String) -> tauri::Result<()> {
    let root = PathBuf::from(&path);
    if !root.exists() {
        return Ok(());
    }

    // Closure to emit events
    let app_handle = window.app_handle().clone();
    let emit_change = move |paths: Vec<PathBuf>, kind: String| {
        let payload = FsChange {
            paths: paths
                .into_iter()
                .map(|p| p.to_string_lossy().into_owned())
                .collect(),
            kind,
        };
        let _ = app_handle.emit("fs:change", payload);
    };

    // build watcher
    let mut watcher: RecommendedWatcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                let kind_str = format!("{:?}", event.kind);
                emit_change(event.paths, kind_str);
            }
        },
        Config::default().with_poll_interval(std::time::Duration::from_millis(100)),
    )
    .map_err(AnyError::from)?;

    watcher
        .watch(&root, RecursiveMode::Recursive)
        .map_err(AnyError::from)?;

    WATCHERS.lock().unwrap().push(watcher);

    Ok(())
}
