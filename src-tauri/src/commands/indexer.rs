// Workspace indexing and search commands for Glass-IDE
// ----------------------------------------------------
// A minimal path-based indexer to power “Go to file…” search.
// It walks the project root once, stores relative file paths in
// memory and serialises them to the OS cache directory. Subsequent
// launches restore instantly if the workspace mtime hasn’t changed.
//
// The search is a case-insensitive substring filter limited to the
// first 1000 matches ordered by path length → lexicographic.
//
// Further iterations can extend this with trigram indexes, content
// search and incremental updates.

use anyhow::Error as AnyError;
use dirs_next::cache_dir;
use once_cell::sync::Lazy;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};
use std::time::SystemTime;
use tauri::command;
use walkdir::{DirEntry, WalkDir};
use xxhash_rust::xxh3::xxh3_64;

const MAX_RESULTS: usize = 1000;

#[derive(Serialize, Deserialize)]
struct IndexSnapshot {
    mtime: u64,
    paths: Vec<String>,
}

/// In-memory index entry
struct Index {
    root: PathBuf,
    mtime: u64,
    paths: Vec<String>,
}

/// Global cache of loaded indices (multi-root ready)
static INDICES: Lazy<Mutex<Vec<Index>>> = Lazy::new(|| Mutex::new(Vec::new()));

fn cache_file_for_root(root: &Path) -> Option<PathBuf> {
    let dir = cache_dir()?;
    let h = xxh3_64(root.to_string_lossy().as_bytes());
    Some(dir.join(format!("glass_index_{h:x}.json")))
}

fn is_hidden(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
}

/// Ensure index exists and is fresh, returning a mutable reference.
fn ensure_index<'a>(
    indices: &'a mut MutexGuard<'_, Vec<Index>>,
    root: &Path,
) -> Result<&'a mut Index, AnyError> {
    // Obtain workspace mtime
    let meta = fs::metadata(root)?;
    let modified = meta.modified()?;
    let mtime = modified.duration_since(SystemTime::UNIX_EPOCH)?.as_secs();

    // Quick path: return existing fresh index, if any.
    if let Some(pos) = {
        // Immutable borrow limited to this block.
        indices
            .iter()
            .position(|idx| idx.root == root && idx.mtime == mtime)
    } {
        // Safe to take a mutable reference now – previous immutable borrow ended.
        return Ok(indices.get_mut(pos).unwrap());
    }

    // Remove any stale copies for this root before (re)building.
    indices.retain(|idx| idx.root == root && idx.mtime == mtime);

    // Attempt to load snapshot from cache
    if let Some(cache_path) = cache_file_for_root(root) {
        if let Ok(bytes) = fs::read(&cache_path) {
            if let Ok(snapshot) = serde_json::from_slice::<IndexSnapshot>(&bytes) {
                if snapshot.mtime == mtime {
                    let idx = Index {
                        root: root.to_path_buf(),
                        mtime,
                        paths: snapshot.paths,
                    };
                    indices.push(idx);
                    let last = indices.last_mut().unwrap();
                    return Ok(last);
                }
            }
        }
    }

    // Slow path: build new index – collect all file paths in parallel
    let paths: Vec<String> = WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| !is_hidden(e))
        .par_bridge()
        .filter_map(Result::ok)
        .filter_map(|entry| {
            if entry.file_type().is_file() {
                entry
                    .path()
                    .strip_prefix(root)
                    .ok()
                    .map(|rel| rel.to_string_lossy().to_string())
            } else {
                None
            }
        })
        .collect();

    // Snapshot to disk (ignore errors)
    if let Some(cache_path) = cache_file_for_root(root) {
        let _ = fs::create_dir_all(cache_path.parent().unwrap_or_else(|| Path::new("/")));
        let snap = IndexSnapshot {
            mtime,
            paths: paths.clone(),
        };
        if let Ok(bytes) = serde_json::to_vec(&snap) {
            let _ = fs::write(&cache_path, bytes);
        }
    }

    indices.push(Index {
        root: root.to_path_buf(),
        mtime,
        paths,
    });
    Ok(indices.last_mut().unwrap())
}

#[command]
/// Build (or rebuild) the index for `path`. Returns number of files indexed.
pub async fn build_index(path: String) -> tauri::Result<usize> {
    let root = PathBuf::from(path);
    if !root.exists() {
        return Ok(0);
    }
    let mut indices = INDICES.lock().unwrap();
    let idx = ensure_index(&mut indices, &root)?;
    Ok(idx.paths.len())
}

#[command]
/// Query the index of `path` with provided `query` (case-insensitive substring).
/// Returns up to MAX_RESULTS relative paths.
pub async fn query_index(path: String, query: String) -> tauri::Result<Vec<String>> {
    let root = PathBuf::from(path);
    if !root.exists() {
        return Ok(Vec::new());
    }
    let mut indices = INDICES.lock().unwrap();
    let idx = ensure_index(&mut indices, &root)?;

    let q_lower = query.to_lowercase();
    let mut results: Vec<&String> = idx
        .paths
        .iter()
        .filter(|p| p.to_lowercase().contains(&q_lower))
        .collect();

    results.sort_by(|a, b| a.len().cmp(&b.len()).then_with(|| a.cmp(b)));
    let sliced: Vec<String> = results.into_iter().take(MAX_RESULTS).cloned().collect();
    Ok(sliced)
}
