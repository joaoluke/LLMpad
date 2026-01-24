# LLMpad

Um aplicativo de desktop leve para conversar com LLMs locais, construído com Tauri + React.

## Funcionalidades

- 🪶 **Leve** - Usa Tauri (Rust) em vez de Electron
- 💾 **Persistência** - Conversas salvas em SQLite local
- 🔌 **Compatível** - Funciona com qualquer API compatível com OpenAI (Ollama, LM Studio, etc.)
- 🖥️ **Multiplataforma** - Mac, Linux e Windows
- 🤖 **Gerenciador de Modelos** - Crie e gerencie modelos personalizados do Ollama

## Requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Ollama](https://ollama.ai/) (recomendado para execução local)

## Instalação

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run tauri dev

# Construir para produção
npm run tauri build
```

## Configuração

1. Abra o aplicativo
2. Clique em "Configurações" (⚙️)
3. Configure a URL da API:
   - **Ollama**: `http://localhost:11434/v1`
   - **LM Studio**: `http://localhost:1234/v1`
   - **OpenAI**: `https://api.openai.com/v1`
4. Selecione o modelo na lista suspensa
5. Chave de API é opcional para APIs locais

## Gerenciando Modelos Personalizados

### Criando um novo modelo

1. Crie um arquivo `.Modelfile` na pasta `models/`
2. Exemplo (`models/meu-modelo.Modelfile`):
   ```
   FROM phi3:latest
   
   PARAMETER temperature 0.7
   PARAMETER num_ctx 2048
   
   SYSTEM """
   Você é um assistente útil e prestativo.
   """
   ```
3. No aplicativo, vá para Configurações > Gerenciar Modelos
4. Clique em "Criar no Ollama" ao lado do seu modelo

### Modelos base recomendados

- `llama3.2` - Boa combinação de velocidade e qualidade
- `phi3` - Modelo rápido e eficiente
- `mistral` - Excelente para tarefas em português

## Stack Técnica

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Rust + Tauri 2.0
- **Banco de Dados**: SQLite (via rusqlite)
- **Ícones**: Lucide React

## Licença

MIT
