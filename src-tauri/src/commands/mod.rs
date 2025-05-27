//! Centralised module that re-exports individual Tauri command namespaces.
//!
//! As of 2025-05 the legacy `batch_commands` proxy (with MessagePack/base64) has
//! been removed. The frontend now invokes each command directly via JSON IPC,
//! keeping the backend clear of unnecessary abstraction.

pub mod fs;

// ------------------------------
// New workspace indexer commands
// ------------------------------
pub mod indexer;

// Content search indexer
pub mod content_indexer;
pub mod logger;
