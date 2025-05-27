// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod lsp;
mod menu;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // Register individual command handlers
        .invoke_handler(tauri::generate_handler![
            commands::fs::read_dir_snapshot,
            commands::fs::read_dir_children,
            commands::fs::start_fs_watch,
            commands::fs::read_file_text,
            // Indexer
            commands::indexer::build_index,
            commands::indexer::query_index,
            // Content indexer
            commands::content_indexer::build_content_index,
            commands::content_indexer::query_content_index,
            // ---------------- LSP ----------------
            lsp::invoke_lsp,
        ])
        .setup(|app| {
            #[cfg_attr(
                not(any(target_os = "macos", target_os = "windows")),
                allow(unused_variables)
            )]
            let window = match app.get_webview_window("main") {
                Some(win) => win,
                None => {
                    eprintln!(
                        "Error: Could not get main window. Visual effects will not be applied."
                    );
                    // Exit setup gracefully, allowing the app to continue running without these effects.
                    return Ok(());
                }
            };

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{NSVisualEffectMaterial, NSVisualEffectState};
                if let Err(err) = window_vibrancy::apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::FullScreenUI,
                    Some(NSVisualEffectState::Active),
                    Some(8.0),
                ) {
                    eprintln!("Couldn't apply vibrancy effect: {}", err);
                }
            }

            #[cfg(target_os = "windows")]
            {
                if let Err(err) = window_vibrancy::apply_blur(&window, Some((18, 18, 18, 125))) {
                    eprintln!("Couldn't apply blur effect: {}", err);
                }
            }

            // Build native menu via helper module
            menu::attach(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
