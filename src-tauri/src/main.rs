// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, SubmenuBuilder},
    Emitter, Manager,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg_attr(
                not(any(target_os = "macos", target_os = "windows")),
                allow(unused_variables)
            )]
            let window = app.get_webview_window("main").unwrap();

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

            // Build native menu
            {
                let layout_menu = SubmenuBuilder::new(app, "Layout")
                    .text("reset_layout", "Reset to Default")
                    .build()?;

                // Start with the OS default menu then append our Layout submenu to keep existing items.
                let menu = Menu::default(&app.handle())?;

                // On macOS only Submenu can be appended.
                menu.append(&layout_menu)?;

                app.set_menu(menu)?;

                app.on_menu_event(|app_handle, event| {
                    if event.id().0.as_str() == "reset_layout" {
                        let _ = app_handle.emit("reset-layout", ());
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
