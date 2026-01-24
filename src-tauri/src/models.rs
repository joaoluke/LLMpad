use serde::{Deserialize, Serialize};

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub choices: Vec<ChatChoice>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatChoice {
    pub message: ChatMessageResponse,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessageResponse {
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelFile {
    pub name: String,
    pub path: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelFileInfo {
    pub name: String,
    pub path: String,
    pub content: String,
    pub base_model: Option<String>,
    pub is_base_available: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModel {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaListResponse {
    pub models: Vec<OllamaModel>,
}
