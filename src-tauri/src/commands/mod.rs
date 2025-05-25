//! Centralised Tauri command handlers
//! Currently only implements `batch_commands`, which executes a list of commands
//! received from the front-end in a single IPC round-trip.
//!
//! Front-end sends `{ batch: { commands: [{ command, args }] } }`.
//! For each entry we emit the command via the window event system and wait for
//! a response, then aggregate the results.

use anyhow::Error as AnyError;
use base64::{engine::general_purpose, Engine as _};
use rmp_serde::{decode::from_slice as msgpack_decode, encode::to_vec as msgpack_encode};
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
        // Detect binary path – front-end sends { _bin: "base64" }
        let payload_json = &item.args;
        let maybe_bin = payload_json.get("_bin").and_then(|v| v.as_str());

        if let Some(b64) = maybe_bin {
            // Decode
            let bytes = general_purpose::STANDARD
                .decode(b64)
                .map_err(AnyError::from)?;
            let decoded: serde_json::Value = msgpack_decode(&bytes).map_err(AnyError::from)?;
            window.emit(&item.command, decoded.clone())?;

            // Echo back the same encoded base64 so frontend can round-trip
            let result_bytes = msgpack_encode(&decoded).map_err(AnyError::from)?;
            let result_b64 = general_purpose::STANDARD.encode(result_bytes);
            results.push(serde_json::json!(result_b64));
        } else {
            // Regular JSON path as before
            window.emit(&item.command, item.args.clone())?;
            results.push(item.args.clone());
        }
    }

    Ok(results)
}
