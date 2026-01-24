use tauri::State;
use crate::database::Database;
use crate::models::Message;

#[tauri::command]
pub fn get_messages(db: State<Database>, conversation_id: i64) -> Result<Vec<Message>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;
    
    let messages = stmt
        .query_map([conversation_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(messages)
}

#[tauri::command]
pub fn save_message(
    db: State<Database>,
    conversation_id: i64,
    role: String,
    content: String,
) -> Result<Message, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?1, ?2, ?3)",
        rusqlite::params![conversation_id, role, content],
    )
    .map_err(|e| e.to_string())?;
    
    let id = conn.last_insert_rowid();
    
    conn.execute(
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?1",
        [conversation_id],
    )
    .map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT id, conversation_id, role, content, created_at FROM messages WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    
    let message = stmt
        .query_row([id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    
    Ok(message)
}
