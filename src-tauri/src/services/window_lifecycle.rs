use tauri::{AppHandle, Manager};

const MAIN_WINDOW_LABEL: &str = "main";
const SPLASHSCREEN_LABEL: &str = "splashscreen";

pub async fn splashscreen_ready(app: AppHandle) -> Result<(), String> {
    show_optional_window(&app, SPLASHSCREEN_LABEL, "splashscreen")
}

pub async fn frontend_ready(app: AppHandle) -> Result<(), String> {
    show_required_window(&app, MAIN_WINDOW_LABEL, "main window")?;
    close_optional_window(&app, SPLASHSCREEN_LABEL);

    Ok(())
}

fn show_required_window(
    app: &AppHandle,
    label: &str,
    display_name: &str,
) -> Result<(), String> {
    let window = app
        .get_webview_window(label)
        .ok_or_else(|| format!("{display_name} not found"))?;

    window
        .show()
        .map_err(|error| format!("failed to show {display_name}: {error}"))?;

    let _ = window.set_focus();

    Ok(())
}

fn show_optional_window(
    app: &AppHandle,
    label: &str,
    display_name: &str,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(label) {
        window
            .show()
            .map_err(|error| format!("failed to show {display_name}: {error}"))?;

        let _ = window.set_focus();
    }

    Ok(())
}

fn close_optional_window(app: &AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.close();
    }
}