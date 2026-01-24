import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  MessageSquare,
  Plus,
  Send,
  Settings,
  Trash2,
  Bot,
  User,
  Loader2,
  FileCode,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AppSettings {
  api_url: string;
  api_key: string;
  model: string;
}

interface ModelFile {
  name: string;
  path: string;
  content: string;
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    api_url: "http://localhost:11434/v1",
    api_key: "",
    model: "llama3.2",
  });
  const [modelFiles, setModelFiles] = useState<ModelFile[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [showModelManager, setShowModelManager] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadSettings();
    loadModelFiles();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await invoke<Conversation[]>("get_conversations");
      setConversations(convs);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await invoke<AppSettings>("get_settings");
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const saveSettings = async () => {
    try {
      await invoke("save_settings", { settings });
      setShowSettings(false);
      loadOllamaModels();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const loadModelFiles = async () => {
    try {
      const files = await invoke<ModelFile[]>("get_modelfiles");
      setModelFiles(files);
    } catch (error) {
      console.error("Erro ao carregar Modelfiles:", error);
    }
  };

  const loadOllamaModels = async () => {
    try {
      const models = await invoke<string[]>("list_ollama_models", {
        apiUrl: settings.api_url,
      });
      setOllamaModels(models);
    } catch (error) {
      console.error("Erro ao carregar modelos do Ollama:", error);
      setOllamaModels([]);
    }
  };

  const createModelInOllama = async (modelFile: ModelFile) => {
    console.log("=== Iniciando criação de modelo ===");
    console.log("ModelFile:", modelFile);
    
    try {
      // Extract base model from Modelfile
      const fromMatch = modelFile.content.match(/FROM\s+(.+)/i);
      console.log("FROM match:", fromMatch);
      
      if (!fromMatch) {
        alert("Erro: Modelfile não contém linha FROM");
        return;
      }
      
      const baseModel = fromMatch[1].trim();
      console.log("Base model:", baseModel);
      
      // Check if base model exists
      console.log("Verificando se modelo base existe...");
      const baseModelExists = await invoke<boolean>("check_base_model", {
        apiUrl: settings.api_url,
        modelName: baseModel,
      });
      
      console.log("Base model exists:", baseModelExists);
      
      if (!baseModelExists) {
        const message = `Modelo base '${baseModel}' não encontrado no Ollama.\n\nVerifique se você já baixou este modelo com:\nollama pull ${baseModel}`;
        console.error(message);
        alert(message);
        return;
      }
      
      console.log("Criando modelo customizado...");
      const result = await invoke<string>("create_ollama_model", {
        apiUrl: settings.api_url,
        modelName: modelFile.name,
        modelfileContent: modelFile.content,
      });
      
      console.log("Resultado:", result);
      alert(result);
      loadOllamaModels();
    } catch (error) {
      console.error("Erro completo:", error);
      alert(`Erro ao criar modelo: ${error}`);
    }
  };

  const createConversation = async () => {
    try {
      const conv = await invoke<Conversation>("create_conversation", {
        title: "Nova Conversa",
      });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setCurrentConversation(conv);
    try {
      const msgs = await invoke<Message[]>("get_messages", {
        conversationId: conv.id,
      });
      setMessages(msgs);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  };

  const deleteConversation = async (id: number) => {
    try {
      await invoke("delete_conversation", { id });
      setConversations(conversations.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Erro ao deletar conversa:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let conv = currentConversation;
    if (!conv) {
      conv = await invoke<Conversation>("create_conversation", {
        title: input.slice(0, 50),
      });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
    }

    const userMessage: Message = {
      id: Date.now(),
      conversation_id: conv.id,
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await invoke("save_message", {
        conversationId: conv.id,
        role: "user",
        content: input,
      });

      const messagesForApi = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await invoke<string>("chat_completion", {
        messages: messagesForApi,
        apiUrl: settings.api_url,
        apiKey: settings.api_key,
        model: settings.model,
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        conversation_id: conv.id,
        role: "assistant",
        content: response,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      await invoke("save_message", {
        conversationId: conv.id,
        role: "assistant",
        content: response,
      });

      if (messages.length === 0) {
        await invoke("update_conversation_title", {
          id: conv.id,
          title: input.slice(0, 50),
        });
        loadConversations();
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        conversation_id: conv.id,
        role: "assistant",
        content: `Erro: ${error}. Verifique as configurações da API.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4">
          <button
            onClick={createConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Nova Conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                currentConversation?.id === conv.id ? "bg-gray-700" : ""
              }`}
              onClick={() => selectConversation(conv)}
            >
              <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings size={18} />
            Configurações
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Bot size={48} className="mb-4" />
              <h2 className="text-xl font-medium mb-2">LLMpad</h2>
              <p className="text-sm">Inicie uma conversa com sua LLM local</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={18} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-100"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={18} />
                  </div>
                  <div className="bg-gray-800 rounded-2xl px-4 py-3">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Configurações</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  URL da API (OpenAI-compatible)
                </label>
                <input
                  type="text"
                  value={settings.api_url}
                  onChange={(e) =>
                    setSettings({ ...settings, api_url: e.target.value })
                  }
                  placeholder="http://localhost:11434/v1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ollama: http://localhost:11434/v1 | LM Studio: http://localhost:1234/v1
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  API Key (opcional para local)
                </label>
                <input
                  type="password"
                  value={settings.api_key}
                  onChange={(e) =>
                    setSettings({ ...settings, api_key: e.target.value })
                  }
                  placeholder="sk-..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1 flex items-center justify-between">
                  <span>Modelo</span>
                  <button
                    onClick={loadOllamaModels}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    Atualizar
                  </button>
                </label>
                {ollamaModels.length > 0 ? (
                  <select
                    value={settings.model}
                    onChange={(e) =>
                      setSettings({ ...settings, model: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    {ollamaModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) =>
                      setSettings({ ...settings, model: e.target.value })
                    }
                    placeholder="llama3.2"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                )}
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowModelManager(true);
                  }}
                  className="mt-2 w-full text-xs text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1 py-1"
                >
                  <FileCode size={14} />
                  Gerenciar Modelos Customizados ({modelFiles.length})
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Manager Modal */}
      {showModelManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Modelos Customizados</h2>
            
            <p className="text-sm text-gray-400 mb-4">
              Modelfiles encontrados na pasta <code className="bg-gray-700 px-1 rounded">models/</code>
            </p>

            {modelFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileCode size={48} className="mx-auto mb-3 opacity-50" />
                <p>Nenhum Modelfile encontrado</p>
                <p className="text-xs mt-2">
                  Crie arquivos .Modelfile na pasta models/ do projeto
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {modelFiles.map((modelFile) => (
                  <div
                    key={modelFile.name}
                    className="bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{modelFile.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {modelFile.path}
                        </p>
                      </div>
                      <button
                        onClick={() => createModelInOllama(modelFile)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                      >
                        Criar no Ollama
                      </button>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                        Ver Modelfile
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-900 p-3 rounded overflow-x-auto">
                        {modelFile.content}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModelManager(false);
                  setShowSettings(true);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  loadModelFiles();
                  loadOllamaModels();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
