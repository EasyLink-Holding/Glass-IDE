// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let _window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::NSVisualEffectMaterial;
                if let Err(err) = window_vibrancy::apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::HudWindow,
                    None,
                    None,
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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
