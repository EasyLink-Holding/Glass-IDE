// Simple logging command to log frontend messages to the terminal
use log::{debug, error, info, warn};
use tauri::command;

#[command]
pub fn frontend_log(level: String, message: String) {
    match level.as_str() {
        "debug" => debug!("[FRONTEND] {}", message),
        "info" => info!("[FRONTEND] {}", message),
        "warn" => warn!("[FRONTEND] {}", message),
        "error" => error!("[FRONTEND] {}", message),
        _ => info!("[FRONTEND] {}", message),
    }
}
