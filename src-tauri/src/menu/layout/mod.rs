use tauri::{menu::SubmenuBuilder, AppHandle, Result as TauriResult, Runtime};

// build() is the public API called by parent module
pub fn build<R: Runtime>(app: &AppHandle<R>) -> TauriResult<tauri::menu::Submenu<R>> {
    SubmenuBuilder::new(app, "Layout")
        .text("reset_layout", "Reset to Default")
        .build()
}
