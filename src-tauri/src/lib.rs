use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::fs;
use tauri::{Manager, State};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Conversation {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub id: i64,
    pub conversation_id: i64,
    pub role: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub api_url: String,
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatChoice {
    message: ChatMessageResponse,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessageResponse {
    content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelFile {
    pub name: String,
    pub path: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaModel {
    name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaListResponse {
    models: Vec<OllamaModel>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_handle: &tauri::AppHandle) -> SqliteResult<Self> {
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

#[tauri::command]
fn get_conversations(db: State<Database>) -> Result<Vec<Conversation>, String> {
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
fn create_conversation(db: State<Database>, title: String) -> Result<Conversation, String> {
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
fn update_conversation_title(db: State<Database>, id: i64, title: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE conversations SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![title, id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn delete_conversation(db: State<Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM messages WHERE conversation_id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM conversations WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn get_messages(db: State<Database>, conversation_id: i64) -> Result<Vec<Message>, String> {
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
fn save_message(
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

#[tauri::command]
fn get_settings(db: State<Database>) -> Result<AppSettings, String> {
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
fn save_settings(db: State<Database>, settings: AppSettings) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE settings SET api_url = ?1, api_key = ?2, model = ?3 WHERE id = 1",
        rusqlite::params![settings.api_url, settings.api_key, settings.model],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn chat_completion(
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
fn get_modelfiles(app: tauri::AppHandle) -> Result<Vec<ModelFile>, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    // Try to find the project's models directory
    let mut models_dir = app_dir.parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .map(|p| p.join("Documents").join("LLMpad").join("models"))
        .unwrap_or_else(|| app_dir.join("models"));
    
    // Fallback: if the above path doesn't exist, try relative to app data
    if !models_dir.exists() {
        models_dir = app_dir.join("models");
    }
    
    if !models_dir.exists() {
        fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;
        return Ok(vec![]);
    }
    
    let mut modelfiles = Vec::new();
    
    if let Ok(entries) = fs::read_dir(&models_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("Modelfile") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                        modelfiles.push(ModelFile {
                            name: name.to_string(),
                            path: path.to_string_lossy().to_string(),
                            content,
                        });
                    }
                }
            }
        }
    }
    
    Ok(modelfiles)
}

#[tauri::command]
async fn list_ollama_models(api_url: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client::new();
    let base_url = api_url.trim_end_matches("/v1").trim_end_matches('/');
    let url = format!("{}/api/tags", base_url);
    
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com Ollama: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Ollama retornou erro: {}", response.status()));
    }
    
    let ollama_response: OllamaListResponse = response
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear resposta do Ollama: {}", e))?;
    
    Ok(ollama_response.models.into_iter().map(|m| m.name).collect())
}

#[tauri::command]
async fn check_base_model(api_url: String, model_name: String) -> Result<bool, String> {
    let models = list_ollama_models(api_url).await?;
    Ok(models.contains(&model_name))
}

#[tauri::command]
async fn create_ollama_model(
    _api_url: String,
    model_name: String,
    modelfile_content: String,
) -> Result<String, String> {
    use std::process::Command;
    use std::io::Write;
    
    // Log for debugging
    println!("Creating model '{}' using Ollama CLI", model_name);
    println!("Modelfile content:\n{}", modelfile_content);
    
    // Create temporary Modelfile
    let temp_dir = std::env::temp_dir();
    let modelfile_path = temp_dir.join(format!("{}.Modelfile", model_name));
    
    // Write Modelfile to temp location
    let mut file = std::fs::File::create(&modelfile_path)
        .map_err(|e| format!("Erro ao criar arquivo temporário: {}", e))?;
    
    file.write_all(modelfile_content.as_bytes())
        .map_err(|e| format!("Erro ao escrever Modelfile: {}", e))?;
    
    drop(file); // Close file before running command
    
    // Run ollama create command
    let output = Command::new("ollama")
        .arg("create")
        .arg(&model_name)
        .arg("-f")
        .arg(&modelfile_path)
        .output()
        .map_err(|e| format!("Erro ao executar comando ollama: {}. Certifique-se de que o Ollama está instalado.", e))?;
    
    // Clean up temp file
    let _ = std::fs::remove_file(&modelfile_path);
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!("Erro ao criar modelo:\n{}\n{}", stderr, stdout));
    }
    
    Ok(format!("Modelo '{}' criado com sucesso!", model_name))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let db = Database::new(&app.handle()).expect("Failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_conversations,
            create_conversation,
            update_conversation_title,
            delete_conversation,
            get_messages,
            save_message,
            get_settings,
            save_settings,
            chat_completion,
            get_modelfiles,
            list_ollama_models,
            check_base_model,
            create_ollama_model,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
