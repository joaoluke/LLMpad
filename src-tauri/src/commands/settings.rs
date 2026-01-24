use tauri::State;
use crate::database::Database;
use crate::models::AppSettings;

#[tauri::command]
pub fn get_settings(db: State<Database>) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT api_url, api_key, model FROM settings WHERE id = 1")
        .map_err(|e| e.to_string())?;
    
    let settings = stmt
        .query_row([], |row| {
            Ok(AppSettings {
                api_url: row.get(0)?,
                api_key: row.get(1)?,
                model: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

#[tauri::command]
pub fn save_settings(db: State<Database>, settings: AppSettings) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE settings SET api_url = ?1, api_key = ?2, model = ?3 WHERE id = 1",
        rusqlite::params![settings.api_url, settings.api_key, settings.model],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}
