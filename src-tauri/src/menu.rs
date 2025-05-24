use tauri::{
    menu::{Menu, MenuEvent, SubmenuBuilder},
    App, AppHandle, Emitter, Result as TauriResult, Runtime,
};

/// Build the native application menu.
pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> TauriResult<Menu<R>> {
    let layout_menu = SubmenuBuilder::new(app, "Layout")
        .text("reset_layout", "Reset to Default")
        .build()?;

    // Start with the OS default menu then append our submenu.
    let menu = Menu::default(app)?;
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
            let _ = app_handle.emit("reset-layout", ());
        }
        _ => {}
    }
}
