//! Language-server bridge for Glass-IDE (MVP)
//!
//! Spawns / reuses one language-server process per workspace root.
//! Currently supports TypeScript (`typescript-language-server`) and Rust (`rust-analyzer`).
//! It exposes a single Tauri command `invoke_lsp` that forwards a JSON-RPC request
//! to the appropriate language-server and awaits the matching response.
//!
//! Limitations (to be improved incrementally):
//! • Only handles **request → response** flow (no server-initiated notifications yet).
//! • No restart / crash recovery.
//! • Very naive Content-Length framing.

use anyhow::{anyhow, Context, Result};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::process::Stdio;
use tauri::Emitter;
use tauri::{command, AppHandle};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::{ChildStdin, ChildStdout, Command};
use tokio::sync::Mutex;
use tokio::time::{timeout, Duration};

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LspInvokeRequest {
    /// Absolute workspace root – used to map to server instance
    root: String,
    /// Raw JSON-RPC request (object)
    request: Value,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LspInvokeResponse {
    response: Value,
}

// ----------------------------------------------------------------------------
// Server management
// ----------------------------------------------------------------------------

struct LspProcess {
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}

static SERVERS: Lazy<Mutex<HashMap<String, LspProcess>>> = Lazy::new(|| Mutex::new(HashMap::new()));

/// Return mutable reference to LspProcess for `root`, spawning if needed.
async fn ensure_server(root: &str) -> Result<()> {
    let mut map = SERVERS.lock().await;
    if map.contains_key(root) {
        return Ok(());
    }

    let root_path = root;
    if !std::path::Path::new(root_path).exists() {
        return Err(anyhow!("Workspace root does not exist"));
    }

    // Pick language server binary heuristically: look for Cargo.toml vs. tsconfig.json
    let is_rust = std::path::Path::new(root_path).join("Cargo.toml").exists();
    let (cmd, args): (&str, &[&str]) = if is_rust {
        ("rust-analyzer", &[])
    } else {
        // default to TypeScript server
        ("typescript-language-server", &["--stdio"])
    };

    let mut child = Command::new(cmd)
        .args(args)
        .current_dir(root_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .with_context(|| format!("Failed to spawn language server `{cmd}`"))?;

    let stdin = child
        .stdin
        .take()
        .ok_or_else(|| anyhow!("Failed to open stdin for language server"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| anyhow!("Failed to open stdout for language server"))?;

    let root_owned = root.to_string();
    map.insert(
        root_owned.clone(),
        LspProcess {
            stdin,
            stdout: BufReader::new(stdout),
        },
    );
    tokio::spawn(async move {
        // Wait for child to finish – then drop from map.
        let _ = child.wait().await;
        let mut map = SERVERS.lock().await;
        map.remove(&root_owned);
    });
    Ok(())
}

// ----------------------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------------------

/// Write JSON-RPC frame with proper Content-Length header.
async fn write_rpc(stdin: &mut ChildStdin, msg: &Value) -> Result<()> {
    let payload = serde_json::to_vec(msg)?;
    let header = format!("Content-Length: {}\r\n\r\n", payload.len());
    stdin.write_all(header.as_bytes()).await?;
    stdin.write_all(&payload).await?;
    stdin.flush().await?;
    Ok(())
}

/// Read next JSON-RPC object from stdout (blocking until one arrives).
async fn read_rpc(stdout: &mut BufReader<ChildStdout>) -> Result<Value> {
    // Read headers until blank line
    let mut content_length: Option<usize> = None;
    loop {
        let mut header = String::new();
        let n = stdout.read_line(&mut header).await?;
        if n == 0 {
            return Err(anyhow!("LSP stdout closed"));
        }
        let h = header.trim();
        if h.is_empty() {
            break; // end of headers
        }
        if let Some(rem) = h.strip_prefix("Content-Length:") {
            content_length = Some(rem.trim().parse::<usize>()?);
        }
    }
    let len = content_length.ok_or_else(|| anyhow!("Missing Content-Length"))?;
    let mut buf = vec![0u8; len];
    stdout.read_exact(&mut buf).await?;
    let val: Value = serde_json::from_slice(&buf)?;
    Ok(val)
}

// ----------------------------------------------------------------------------
// Tauri command – JSON-RPC request / response
// ----------------------------------------------------------------------------

#[command]
pub async fn invoke_lsp(
    app: AppHandle,
    payload: LspInvokeRequest,
) -> tauri::Result<LspInvokeResponse> {
    let root = payload.root.clone();
    ensure_server(&root).await.map_err(tauri::Error::Anyhow)?;

    // Acquire map again to get mutable refs
    let mut map = SERVERS.lock().await;
    let proc = map
        .get_mut(&root)
        .ok_or_else(|| tauri::Error::Anyhow(anyhow!("Server disappeared")))?;

    // Send request
    write_rpc(&mut proc.stdin, &payload.request)
        .await
        .map_err(tauri::Error::Anyhow)?;

    let request_id = payload.request.get("id").cloned();

    // Read messages until we find matching response; forward diagnostics events on the fly.
    let resp = loop {
        let msg = timeout(Duration::from_secs(5), read_rpc(&mut proc.stdout))
            .await
            .map_err(|_| tauri::Error::Anyhow(anyhow!("LSP timeout")))?
            .map_err(tauri::Error::Anyhow)?;

        // Publish diagnostics notification
        if msg.get("method") == Some(&Value::String("textDocument/publishDiagnostics".into())) {
            if let Some(params) = msg.get("params") {
                let _ = app.emit("lsp_diagnostics", params.clone());
            }
            continue; // keep waiting
        }

        // Response with id?
        if let Some(id_val) = &request_id {
            if msg.get("id") == Some(id_val) {
                break msg;
            }
        } else {
            // If original request lacked id, return first non-diag message
            break msg;
        }
    };

    Ok(LspInvokeResponse { response: resp })
}
