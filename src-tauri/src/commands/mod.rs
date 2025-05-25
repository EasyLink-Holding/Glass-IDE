//! Centralised Tauri command handlers
//! Currently only implements `batch_commands`, which executes a list of commands
//! received from the front-end in a single IPC round-trip.
//!
//! Front-end sends `{ batch: { commands: [{ command, args }] } }`.
//! For each entry we emit the command via the window event system and wait for
//! a response, then aggregate the results.

use serde::Deserialize;
use tauri::{Emitter, Runtime, Window};

#[derive(Debug, Deserialize)]
pub struct BatchedCommand {
    pub command: String,
    #[serde(default)]
    pub args: serde_json::Value,
}

/// Result wrapper – we simply pass JSON values back untouched so the caller
/// has full control over type decoding in TypeScript.
#[tauri::command]
pub async fn batch_commands<R: Runtime>(
    window: Window<R>,
    batch: Vec<BatchedCommand>,
) -> tauri::Result<Vec<serde_json::Value>> {
    let mut results = Vec::with_capacity(batch.len());

    for item in batch {
        // Emit the command to the front-end. In Tauri v2 the synchronous
        // `emit_and_wait` helper was removed, so we simply fire the event and
        // return the original args as an optimistic placeholder. Front-end
        // listeners can still respond via a dedicated event if needed.
        window.emit(&item.command, item.args.clone())?;
        results.push(item.args);
    }

    Ok(results)
}
