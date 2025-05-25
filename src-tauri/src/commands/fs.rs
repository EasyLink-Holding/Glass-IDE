//! File-system related Tauri commands
//! Currently only exposes `read_dir_snapshot`, which returns a flattened tree
//! suitable for virtual rendering on the frontend.

use serde::Serialize;
use std::path::{Path, PathBuf};
use walkdir::{DirEntry, WalkDir};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsNode {
    pub id: String,
    pub name: String,
    pub depth: usize,
    pub kind: String, // "file" | "dir"
}

fn is_hidden(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
}

#[tauri::command]
/// Return a flattened directory snapshot up to the requested depth.
/// depth = 0 => only root path itself
pub async fn read_dir_snapshot(path: String, depth: usize) -> tauri::Result<Vec<FsNode>> {
    let root = PathBuf::from(path);
    if !root.exists() {
        return Ok(vec![]);
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

    Ok(result)
}
