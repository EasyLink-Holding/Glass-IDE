// Content-based trigram indexer for Glass-IDE
// -------------------------------------------
// Provides fast content search over workspace files.
// Design notes:
//  • Builds an in-memory trigram index per workspace root.
//  • Skips binary / large files (>1 MB) and hidden paths.
//  • Uses Rayon for parallel indexing and query scoring.
//  • Persists only in-memory for now; disk snapshot can be added later.

use anyhow::Error as AnyError;
use once_cell::sync::Lazy;
use rayon::prelude::*;
use serde::Deserialize;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};
use std::time::SystemTime;
use tauri::command;
use walkdir::{DirEntry, WalkDir};

const MAX_FILE_SIZE: u64 = 1 * 1024 * 1024; // 1 MB per file guard
const DEFAULT_PAGE_SIZE: usize = 150;

#[derive(Clone)]
struct FileEntry {
    path: String,       // relative to workspace root
    trigrams: Vec<u32>, // sorted unique trigrams
}

struct ContentIndex {
    root: PathBuf,
    mtime: u64,
    files: Vec<FileEntry>,
}

static CONTENT_INDICES: Lazy<Mutex<Vec<ContentIndex>>> = Lazy::new(|| Mutex::new(Vec::new()));

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
fn is_hidden(entry: &DirEntry) -> bool {
    entry
        .path()
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
}

fn extract_trigrams(text: &str) -> Vec<u32> {
    let bytes = text.as_bytes();
    let mut set: HashSet<u32> = HashSet::new();
    for wnd in bytes.windows(3) {
        // Combine 3 bytes → u32 (big-endian) for compactness
        let val = ((wnd[0] as u32) << 16) | ((wnd[1] as u32) << 8) | wnd[2] as u32;
        set.insert(val);
    }
    let mut v: Vec<u32> = set.into_iter().collect();
    v.sort_unstable();
    v
}

/// Return mutable reference to fresh or cached index for `root`.
fn ensure_index<'a>(
    indices: &'a mut MutexGuard<'_, Vec<ContentIndex>>,
    root: &Path,
) -> Result<&'a mut ContentIndex, AnyError> {
    let meta = fs::metadata(root)?;
    let modified = meta.modified()?;
    let mtime = modified.duration_since(SystemTime::UNIX_EPOCH)?.as_secs();

    // Reuse fresh index if available
    if let Some(pos) = indices
        .iter()
        .position(|idx| idx.root == root && idx.mtime == mtime)
    {
        return Ok(indices.get_mut(pos).unwrap());
    }

    // Otherwise rebuild index ---------------------------
    let files: Vec<FileEntry> = WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| !is_hidden(e))
        .par_bridge()
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let path = entry.path();
            if !entry.file_type().is_file() {
                return None;
            }
            if let Ok(meta) = entry.metadata() {
                if meta.len() > MAX_FILE_SIZE {
                    return None; // Skip big files for now
                }
            }
            let bytes = fs::read(path).ok()?;
            // Quick binary check – allow ASCII or valid UTF-8
            if !bytes.is_ascii() && std::str::from_utf8(&bytes).is_err() {
                return None;
            }
            let text = String::from_utf8_lossy(&bytes);
            let trigrams = extract_trigrams(&text);
            if trigrams.is_empty() {
                return None;
            }
            Some(FileEntry {
                path: path
                    .strip_prefix(root)
                    .unwrap_or(path)
                    .to_string_lossy()
                    .into_owned(),
                trigrams,
            })
        })
        .collect();

    // Replace old index for this root
    indices.retain(|idx| idx.root != root);
    indices.push(ContentIndex {
        root: root.to_path_buf(),
        mtime,
        files,
    });
    Ok(indices.last_mut().unwrap())
}

// Intersection size between 2 sorted trigram vecs
fn intersection_size(a: &[u32], b: &[u32]) -> usize {
    let mut i = 0;
    let mut j = 0;
    let mut count = 0;
    while i < a.len() && j < b.len() {
        if a[i] == b[j] {
            count += 1;
            i += 1;
            j += 1;
        } else if a[i] < b[j] {
            i += 1;
        } else {
            j += 1;
        }
    }
    count
}

// ---------------------------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------------------------

#[command]
/// Build (or rebuild) the content index. Returns number of indexed files.
pub async fn build_content_index(path: String) -> tauri::Result<usize> {
    let root = PathBuf::from(path);
    if !root.exists() {
        return Ok(0);
    }
    let mut indices = CONTENT_INDICES.lock().unwrap();
    let idx = ensure_index(&mut indices, &root)?;
    Ok(idx.files.len())
}

#[derive(Deserialize)]
pub struct ContentQuery {
    path: String,
    query: String,
    offset: Option<usize>,
    limit: Option<usize>,
}

#[command]
/// Query content index using trigram filter; returns file paths that likely contain the query.
pub async fn query_content_index(params: ContentQuery) -> tauri::Result<Vec<String>> {
    let ContentQuery {
        path,
        query,
        offset,
        limit,
    } = params;

    let root = PathBuf::from(path);
    if !root.exists() || query.len() < 3 {
        return Ok(Vec::new());
    }

    let mut indices = CONTENT_INDICES.lock().unwrap();
    let idx = ensure_index(&mut indices, &root)?;

    // Prepare query trigrams
    let query_trigrams = extract_trigrams(&query);
    if query_trigrams.is_empty() {
        return Ok(Vec::new());
    }

    // Score in parallel -------------------------------------------------------
    let mut scored: Vec<(&String, usize)> = idx
        .files
        .par_iter()
        .filter_map(|file| {
            let s = intersection_size(&query_trigrams, &file.trigrams);
            if s == 0 {
                None
            } else {
                Some((&file.path, s))
            }
        })
        .collect();

    // Higher intersection first, shorter path tie-break, then lexicographic
    scored.sort_by(|a, b| {
        b.1.cmp(&a.1)
            .then_with(|| a.0.len().cmp(&b.0.len()))
            .then_with(|| a.0.cmp(b.0))
    });

    let off = offset.unwrap_or(0);
    let lim = limit.unwrap_or(DEFAULT_PAGE_SIZE);

    let sliced: Vec<String> = scored
        .into_iter()
        .skip(off)
        .take(lim)
        .map(|(p, _)| p.clone())
        .collect();
    Ok(sliced)
}
