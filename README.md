# LLMpad

A lightweight desktop app for chatting with local LLMs, built with Tauri + React.

## Features

- 🪶 **Lightweight** - Uses Tauri (Rust) instead of Electron
- 💾 **Persistence** - Conversations saved in local SQLite
- 🔌 **Compatible** - Works with any OpenAI-compatible API (Ollama, LM Studio, etc.)
- 🖥️ **Cross-platform** - Mac, Linux and Windows

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Ollama](https://ollama.ai/) or another local LLM (optional)

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
2. Click on "Settings"
3. Configure the API URL:
   - **Ollama**: `http://localhost:11434/v1`
   - **LM Studio**: `http://localhost:1234/v1`
   - **OpenAI**: `https://api.openai.com/v1`
4. Set the model (ex: `llama3.2`, `gpt-4`, etc.)
5. API Key is optional for local APIs

## Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Rust + Tauri 2.0
- **Database**: SQLite (via rusqlite)
- **Icons**: Lucide React

## License

MIT
