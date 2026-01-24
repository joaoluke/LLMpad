mod models;
mod database;
mod commands;

use tauri::Manager;
use database::Database;
use commands::*;

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
            send_message_complete,
            get_modelfiles,
            get_modelfiles_with_status,
            list_ollama_models,
            check_base_model,
            create_ollama_model,
            pull_ollama_model,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
