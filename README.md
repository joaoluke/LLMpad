# LLMpad

[Português do Brasil](README.pt-BR.md) | [English](README.md)

A lightweight desktop app for chatting with local LLMs, built with Tauri + React.

## Features

- 🪶 **Lightweight** - Uses Tauri (Rust) instead of Electron
- 💾 **Persistence** - Conversations saved in local SQLite
- 🔌 **Compatible** - Works with any OpenAI-compatible API (Ollama, LM Studio, etc.)
- 🖥️ **Cross-platform** - Mac, Linux and Windows
- 🤖 **Model Manager** - Create and manage custom Ollama models

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Ollama](https://ollama.ai/) (recommended for local execution)

## Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Configuration

1. Open the app
2. Click on "Settings" (⚙️)
3. Configure the API URL:
   - **Ollama**: `http://localhost:11434/v1`
   - **LM Studio**: `http://localhost:1234/v1`
   - **OpenAI**: `https://api.openai.com/v1`
4. Select the model from the dropdown
5. API Key is optional for local APIs

## Managing Custom Models

### Creating a new model

1. Create a `.Modelfile` in the `models/` directory
2. Example (`models/my-model.Modelfile`):
   ```modelfile
   FROM llama3.2
   
   PARAMETER temperature 0.7
   PARAMETER num_ctx 2048
   
   SYSTEM """
   You are a helpful AI assistant.
   """
   ```
3. In the app, go to Settings > Manage Models
4. Click "Create in Ollama" next to your model

### Recommended Base Models

- `llama3.2` - Good balance of speed and quality
- `phi3` - Fast and efficient model
- `mistral` - Great for non-English languages

## Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Rust + Tauri 2.0
- **Database**: SQLite (via rusqlite)
- **Icons**: Lucide React

## License

MIT
