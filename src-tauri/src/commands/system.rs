//! Lightweight system metrics exposed to the frontend for profiling.
//! Currently only returns memory RSS and CPU percentage.

use serde::Serialize;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tauri::command;

#[derive(Serialize)]
pub struct MemoryStats {
    total: u64,
    free: u64,
    used: u64,
    app_rss: u64,
}

static mut SYS: Option<System> = None;

fn ensure_sys() -> &'static mut System {
    unsafe {
        if SYS.is_none() {
            let kind = RefreshKind::new()
                .with_memory(MemoryRefreshKind::new().with_ram())
                .with_cpu(CpuRefreshKind::new().with_cpu_usage());
            SYS = Some(System::new_with_specifics(kind));
        }
        SYS.as_mut().unwrap()
    }
}

#[command]
/// Get memory statistics (in bytes) for basic profiling.
pub async fn memory_stats() -> tauri::Result<MemoryStats> {
    let sys = ensure_sys();
    sys.refresh_memory();
    let total = sys.total_memory();
    let free = sys.free_memory();
    let used = total - free;
    let pid = sysinfo::get_current_pid().ok();
    let app_rss = pid
        .and_then(|p| sys.process(p))
        .map(|proc_| proc_.memory())
        .unwrap_or(0);

    Ok(MemoryStats {
        total,
        free,
        used,
        app_rss,
    })
}
