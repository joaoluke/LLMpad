use tauri::State;
use crate::database::Database;
use crate::models::{ChatMessage, ChatRequest, ChatResponse, Conversation, Message};

#[tauri::command]
pub async fn chat_completion(
    messages: Vec<ChatMessage>,
    api_url: String,
    api_key: String,
    model: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let url = format!("{}/chat/completions", api_url.trim_end_matches('/'));
    
    let request_body = ChatRequest {
        model,
        messages,
        stream: false,
    };
    
    let mut request = client.post(&url).json(&request_body);
    
    if !api_key.is_empty() {
        request = request.header("Authorization", format!("Bearer {}", api_key));
    }
    
    let response = request
        .send()
        .await
        .map_err(|e| format!("Erro na requisição: {}", e))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API retornou erro {}: {}", status, text));
    }
    
    let chat_response: ChatResponse = response
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))?;
    
    let content = chat_response
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_else(|| "Sem resposta".to_string());
    
    Ok(content)
}

#[tauri::command]
pub async fn send_message_complete(
    db: State<'_, Database>,
    conversation_id: Option<i64>,
    user_input: String,
    api_url: String,
    api_key: String,
    model: String,
) -> Result<(Conversation, Message, Message), String> {
    let (conv_id, user_msg_id, messages_for_api) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        
        let conv_id = if let Some(id) = conversation_id {
            id
        } else {
            let title = if user_input.len() > 50 {
                format!("{}...", &user_input[..50])
            } else {
                user_input.clone()
            };
            
            conn.execute(
                "INSERT INTO conversations (title) VALUES (?1)",
                rusqlite::params![title],
            )
            .map_err(|e| e.to_string())?;
            
            conn.last_insert_rowid()
        };
        
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?1, ?2, ?3)",
            rusqlite::params![conv_id, "user", user_input],
        )
        .map_err(|e| e.to_string())?;
        
        let user_msg_id = conn.last_insert_rowid();
        
        let mut stmt = conn
            .prepare("SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at")
            .map_err(|e| e.to_string())?;
        
        let messages_for_api: Vec<ChatMessage> = stmt
            .query_map([conv_id], |row| {
                Ok(ChatMessage {
                    role: row.get(2)?,
                    content: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        
        (conv_id, user_msg_id, messages_for_api)
    };
    
    let response_content = chat_completion(messages_for_api, api_url, api_key, model).await?;
    
    let (conversation, user_message, assistant_message) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?1, ?2, ?3)",
            rusqlite::params![conv_id, "assistant", response_content],
        )
        .map_err(|e| e.to_string())?;
        
        let assistant_msg_id = conn.last_insert_rowid();
        
        let conversation: Conversation = conn
            .query_row(
                "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?1",
                [conv_id],
                |row| {
                    Ok(Conversation {
                        id: row.get(0)?,
                        title: row.get(1)?,
                        created_at: row.get(2)?,
                        updated_at: row.get(3)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;
        
        let user_message: Message = conn
            .query_row(
                "SELECT id, conversation_id, role, content, created_at FROM messages WHERE id = ?1",
                [user_msg_id],
                |row| {
                    Ok(Message {
                        id: row.get(0)?,
                        conversation_id: row.get(1)?,
                        role: row.get(2)?,
                        content: row.get(3)?,
                        created_at: row.get(4)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;
        
        let assistant_message: Message = conn
            .query_row(
                "SELECT id, conversation_id, role, content, created_at FROM messages WHERE id = ?1",
                [assistant_msg_id],
                |row| {
                    Ok(Message {
                        id: row.get(0)?,
                        conversation_id: row.get(1)?,
                        role: row.get(2)?,
                        content: row.get(3)?,
                        created_at: row.get(4)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;
        
        (conversation, user_message, assistant_message)
    };
    
    Ok((conversation, user_message, assistant_message))
}
