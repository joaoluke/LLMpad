use std::fs;
use tauri::Emitter;
use crate::models::{ModelFile, ModelFileInfo, OllamaListResponse};

#[tauri::command]
pub fn get_modelfiles(app: tauri::AppHandle) -> Result<Vec<ModelFile>, String> {
    use tauri::Manager;
    
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let mut models_dir = app_dir.parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .map(|p| p.join("Documents").join("LLMpad").join("models"))
        .unwrap_or_else(|| app_dir.join("models"));
    
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
            if path.is_file() && path.extension().map_or(false, |ext| ext == "Modelfile") {
                let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or_default().to_string();
                let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
                modelfiles.push(ModelFile {
                    name,
                    path: path.to_string_lossy().into_owned(),
                    content,
                });
            }
        }
    }
    
    Ok(modelfiles)
}

#[tauri::command]
pub async fn get_modelfiles_with_status(app: tauri::AppHandle, api_url: String) -> Result<Vec<ModelFileInfo>, String> {
    let modelfiles = get_modelfiles(app)?;
    let ollama_models = list_ollama_models(api_url).await.unwrap_or_default();
    
    let mut result = Vec::new();
    for mf in modelfiles {
        let base_model = mf.content
            .lines()
            .find(|line| line.trim().to_uppercase().starts_with("FROM "))
            .and_then(|line| line.split_whitespace().nth(1))
            .map(|s| s.to_string());
        
        let is_base_available = base_model
            .as_ref()
            .map(|bm| ollama_models.contains(bm))
            .unwrap_or(false);
        
        result.push(ModelFileInfo {
            name: mf.name,
            path: mf.path,
            content: mf.content,
            base_model,
            is_base_available,
        });
    }
    
    Ok(result)
}

#[tauri::command]
pub async fn list_ollama_models(api_url: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client::new();
    let base_url = api_url.trim_end_matches("/v1").trim_end_matches('/');
    let url = format!("{}/api/tags", base_url);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com Ollama: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama retornou erro {}: {}", status, text));
    }

    let ollama_response: OllamaListResponse = response
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear resposta do Ollama: {}", e))?;
    
    Ok(ollama_response.models.into_iter().map(|m| m.name).collect())
}

#[tauri::command]
pub async fn check_base_model(api_url: String, model_name: String) -> Result<bool, String> {
    let models = list_ollama_models(api_url).await?;
    Ok(models.contains(&model_name))
}

#[tauri::command]
pub async fn create_ollama_model(
    _api_url: String,
    model_name: String,
    modelfile_content: String,
) -> Result<String, String> {
    use std::process::Command;
    use std::io::Write;
    
    let temp_dir = std::env::temp_dir();
    let modelfile_path = temp_dir.join(format!("{}.Modelfile", model_name));
    
    let mut file = std::fs::File::create(&modelfile_path)
        .map_err(|e| format!("Erro ao criar arquivo temporário: {}", e))?;
    
    file.write_all(modelfile_content.as_bytes())
        .map_err(|e| format!("Erro ao escrever Modelfile: {}", e))?;
    
    drop(file);
    
    let output = Command::new("ollama")
        .arg("create")
        .arg(&model_name)
        .arg("-f")
        .arg(&modelfile_path)
        .output()
        .map_err(|e| format!("Erro ao executar comando ollama: {}. Certifique-se de que o Ollama está instalado.", e))?;
    
    let _ = std::fs::remove_file(&modelfile_path);
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!("Erro ao criar modelo:\n{}\n{}", stderr, stdout));
    }
    
    Ok(format!("Modelo '{}' criado com sucesso!", model_name))
}

#[tauri::command]
pub async fn pull_ollama_model(model_name: String, window: tauri::Window) -> Result<String, String> {
    use std::io::Read;
    use std::process::{Command, Stdio};
    use std::sync::mpsc;
    
    let mut child = Command::new("ollama")
        .arg("pull")
        .arg(&model_name)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Erro ao executar comando ollama: {}. Certifique-se de que o Ollama está instalado.", e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let (tx, rx) = mpsc::channel::<String>();

    let tx_stdout = tx.clone();
    let stdout_handle = std::thread::spawn(move || {
        if let Some(mut stdout) = stdout {
            let mut buffer = [0u8; 1024];
            let mut line_buffer = String::new();
            
            while let Ok(n) = stdout.read(&mut buffer) {
                if n == 0 { break; }
                
                let chunk = String::from_utf8_lossy(&buffer[..n]);
                line_buffer.push_str(&chunk);
                
                while let Some(pos) = line_buffer.find(|c| c == '\n' || c == '\r') {
                    let line = line_buffer[..pos].to_string();
                    if !line.is_empty() {
                        let _ = tx_stdout.send(line);
                    }
                    line_buffer = line_buffer[pos + 1..].to_string();
                }
            }
            
            if !line_buffer.is_empty() {
                let _ = tx_stdout.send(line_buffer);
            }
        }
    });

    let tx_stderr = tx;
    let stderr_handle = std::thread::spawn(move || {
        if let Some(mut stderr) = stderr {
            let mut buffer = [0u8; 1024];
            let mut line_buffer = String::new();
            
            while let Ok(n) = stderr.read(&mut buffer) {
                if n == 0 { break; }
                
                let chunk = String::from_utf8_lossy(&buffer[..n]);
                line_buffer.push_str(&chunk);
                
                while let Some(pos) = line_buffer.find(|c| c == '\n' || c == '\r') {
                    let line = line_buffer[..pos].to_string();
                    if !line.is_empty() {
                        let _ = tx_stderr.send(line);
                    }
                    line_buffer = line_buffer[pos + 1..].to_string();
                }
            }
            
            if !line_buffer.is_empty() {
                let _ = tx_stderr.send(line_buffer);
            }
        }
    });

    while let Ok(line) = rx.recv() {
        let _ = window.emit("ollama-pull-progress", &line);
    }

    let _ = stdout_handle.join();
    let _ = stderr_handle.join();

    let status = child.wait()
        .map_err(|e| format!("Erro ao aguardar processo: {}", e))?;

    if !status.success() {
        return Err(format!("Erro ao baixar modelo '{}'", model_name));
    }
    
    Ok(format!("Modelo '{}' baixado com sucesso!", model_name))
}
