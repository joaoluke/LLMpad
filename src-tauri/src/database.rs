use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_handle: &tauri::AppHandle) -> SqliteResult<Self> {
        use tauri::Manager;
        
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");
        
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
        
        let db_path = app_dir.join("llmpad.db");
        let conn = Connection::open(db_path)?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                api_url TEXT NOT NULL DEFAULT 'http://localhost:11434/v1',
                api_key TEXT NOT NULL DEFAULT '',
                model TEXT NOT NULL DEFAULT 'llama3.2'
            )",
            [],
        )?;
        
        conn.execute(
            "INSERT OR IGNORE INTO settings (id, api_url, api_key, model) VALUES (1, 'http://localhost:11434/v1', '', 'llama3.2')",
            [],
        )?;
        
        Ok(Database {
            conn: Mutex::new(conn),
        })
    }
}
