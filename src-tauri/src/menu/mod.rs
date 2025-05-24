use tauri::{
    menu::{Menu, MenuEvent},
    App, AppHandle, Emitter, Result as TauriResult, Runtime,
};

// Sub-modules (layout, tray, etc.)
pub mod layout;

/// Build the native application menu.
pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> TauriResult<Menu<R>> {
    let menu = Menu::default(app)?;

    // Append Layout submenu (platform-aware implementation lives in menu/layout)
    let layout_menu = layout::build(app)?;
    menu.append(&layout_menu)?;
    Ok(menu)
}

/// Attach the menu to the application and wire menu events.
pub fn attach<R: Runtime>(app: &App<R>) -> TauriResult<()> {
    let menu = build_menu(&app.handle())?;
    app.set_menu(menu)?;

    app.on_menu_event(|app_handle, event| handle_event(app_handle, event));
    Ok(())
}

/// Centralised router for menu events.
pub fn handle_event<R: Runtime>(app_handle: &AppHandle<R>, event: MenuEvent) {
    match event.id().0.as_str() {
        "reset_layout" => {
            if let Err(err) = app_handle.emit("reset-layout", ()) {
                eprintln!("Failed to emit reset-layout: {err}");
            }
        }
        _ => {}
    }
}
