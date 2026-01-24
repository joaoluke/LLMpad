use tauri::State;
use crate::database::Database;
use crate::models::Conversation;

#[tauri::command]
pub fn get_conversations(db: State<Database>) -> Result<Vec<Conversation>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    
    let conversations = stmt
        .query_map([], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(conversations)
}

#[tauri::command]
pub fn create_conversation(db: State<Database>, title: String) -> Result<Conversation, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO conversations (title) VALUES (?1)",
        [&title],
    )
    .map_err(|e| e.to_string())?;
    
    let id = conn.last_insert_rowid();
    
    let mut stmt = conn
        .prepare("SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    
    let conversation = stmt
        .query_row([id], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    
    Ok(conversation)
}

#[tauri::command]
pub fn update_conversation_title(db: State<Database>, id: i64, title: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE conversations SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![title, id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn delete_conversation(db: State<Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM messages WHERE conversation_id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM conversations WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
