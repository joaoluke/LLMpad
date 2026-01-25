import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message, Conversation, AppSettings, ModelFile } from "./types";

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
  const [showModelDownloader, setShowModelDownloader] = useState(false);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string>("");
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadSettings();
    loadModelFiles();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!downloadingModel) return;

    let disposed = false;
    let unlisten: null | (() => void) = null;

    const parseSizeToBytes = (value: number, unit: string) => {
      const u = unit.toUpperCase();
      if (u === "KB") return value * 1024;
      if (u === "MB") return value * 1024 * 1024;
      if (u === "GB") return value * 1024 * 1024 * 1024;
      return value;
    };

    const tryParsePercent = (line: string) => {
      const m = line.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)\s*\/\s*(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
      if (!m) return null;
      const downloaded = parseSizeToBytes(parseFloat(m[1]), m[2]);
      const total = parseSizeToBytes(parseFloat(m[3]), m[4]);
      if (!Number.isFinite(downloaded) || !Number.isFinite(total) || total <= 0) return null;
      return Math.min(100, Math.max(0, (downloaded / total) * 100));
    };

    (async () => {
      const unsub = await listen<string>("ollama-pull-progress", (event) => {
        if (disposed) return;
        setDownloadProgress(event.payload);
        const p = tryParsePercent(event.payload);
        if (p !== null) setDownloadPercent(p);
      });
      if (disposed) { unsub(); return; }
      unlisten = unsub;
    })();

    return () => { disposed = true; if (unlisten) unlisten(); };
  }, [downloadingModel]);

  const loadConversations = async () => {
    try {
      setConversations(await invoke<Conversation[]>("get_conversations"));
    } catch (e) { console.error("Erro ao carregar conversas:", e); }
  };

  const loadSettings = async () => {
    try {
      const s = await invoke<AppSettings>("get_settings");
      if (s) setSettings(s);
    } catch (e) { console.error("Erro ao carregar configurações:", e); }
  };

  const saveSettings = async () => {
    try {
      await invoke("save_settings", { settings });
      setShowSettings(false);
      loadOllamaModels();
    } catch (e) { console.error("Erro ao salvar configurações:", e); }
  };

  const loadModelFiles = async () => {
    try {
      setModelFiles(await invoke<ModelFile[]>("get_modelfiles"));
    } catch (e) { console.error("Erro ao carregar Modelfiles:", e); }
  };

  const loadOllamaModels = async () => {
    try {
      setOllamaModels(await invoke<string[]>("list_ollama_models", { apiUrl: settings.api_url }));
    } catch (e) { console.error("Erro ao carregar modelos:", e); setOllamaModels([]); }
  };

  const createModelInOllama = async (mf: ModelFile) => {
    try {
      alert(await invoke<string>("create_ollama_model", { apiUrl: settings.api_url, modelName: mf.name, modelfileContent: mf.content }));
      loadOllamaModels();
    } catch (e) { alert(`Erro ao criar modelo: ${e}`); }
  };

  const downloadOllamaModel = async (name: string) => {
    setDownloadingModel(name);
    setDownloadProgress("Iniciando download...");
    setDownloadPercent(null);
    try {
      alert(await invoke<string>("pull_ollama_model", { modelName: name }));
      await loadOllamaModels();
    } catch (e) { alert(`Erro ao baixar modelo: ${e}`); }
    setDownloadingModel(null);
    setDownloadProgress("");
    setDownloadPercent(null);
  };

  const newConversation = async () => {
    try {
      const conv = await invoke<Conversation>("create_conversation", { title: "Nova Conversa" });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (e) { console.error("Erro ao criar conversa:", e); }
  };

  const selectConversation = async (conv: Conversation) => {
    setCurrentConversation(conv);
    try {
      setMessages(await invoke<Message[]>("get_messages", { conversationId: conv.id }));
    } catch (e) { console.error("Erro ao carregar mensagens:", e); }
  };

  const deleteConversation = async (id: number) => {
    try {
      await invoke("delete_conversation", { id });
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) { setCurrentConversation(null); setMessages([]); }
    } catch (e) { console.error("Erro ao deletar conversa:", e); }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userInput = input;
    setInput("");
    setIsLoading(true);
    try {
      const [conv, userMsg, assistantMsg] = await invoke<[Conversation, Message, Message]>("send_message_complete", {
        conversationId: currentConversation?.id || null,
        userInput,
        apiUrl: settings.api_url,
        apiKey: settings.api_key,
        model: settings.model,
      });
      if (!currentConversation) { setCurrentConversation(conv); setConversations([conv, ...conversations]); }
      setMessages(prev => [...prev, userMsg, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), conversation_id: currentConversation?.id || 0, role: "assistant", content: `Erro: ${e}`, created_at: new Date().toISOString() }]);
    }
    setIsLoading(false);
  };

  const MODELS = [
    { name: "llama3.2", size: "2GB", desc: "Modelo equilibrado" },
    { name: "llama3.2:1b", size: "1.3GB", desc: "Versão compacta" },
    { name: "phi3", size: "2.3GB", desc: "Microsoft Phi-3" },
    { name: "mistral", size: "4.1GB", desc: "Excelente qualidade" },
    { name: "gemma2:2b", size: "1.6GB", desc: "Google Gemma 2" },
    { name: "qwen2.5:3b", size: "2GB", desc: "Alibaba Qwen" },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4">
          <button onClick={newConversation} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Plus size={18} /> Nova Conversa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => selectConversation(conv)} className={`group flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors ${currentConversation?.id === conv.id ? "bg-gray-700" : ""}`}>
              <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{conv.title}</span>
              <button onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings size={18} /> Configurações
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Bot size={48} className="mb-4" />
              <h2 className="text-xl font-medium mb-2">LLMpad</h2>
              <p className="text-sm">Inicie uma conversa com sua LLM local</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><Bot size={18} /></div>}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800"}`}>
                    {msg.role === "assistant" ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                  {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><User size={18} /></div>}
                </div>
              ))}
              {isLoading && <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"><Bot size={18} /></div><div className="bg-gray-800 rounded-2xl px-4 py-3"><Loader2 className="animate-spin" size={20} /></div></div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} placeholder="Digite sua mensagem..." className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-blue-500" rows={1} />
            <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors"><Send size={20} /></button>
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
                <label className="block text-sm text-gray-400 mb-1">URL da API</label>
                <input type="text" value={settings.api_url} onChange={e => setSettings({ ...settings, api_url: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key (opcional)</label>
                <input type="password" value={settings.api_key} onChange={e => setSettings({ ...settings, api_key: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1 flex items-center justify-between">
                  <span>Modelo</span>
                  <button onClick={loadOllamaModels} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><RefreshCw size={12} /> Atualizar</button>
                </label>
                {ollamaModels.length > 0 ? (
                  <select value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2">{ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}</select>
                ) : (
                  <input type="text" value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" />
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setShowSettings(false); setShowModelDownloader(true); }} className="flex-1 text-xs text-green-400 hover:text-green-300 flex items-center justify-center gap-1 py-1"><Download size={14} /> Baixar</button>
                  <button onClick={() => { setShowSettings(false); setShowModelManager(true); }} className="flex-1 text-xs text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1 py-1"><FileCode size={14} /> Customizados ({modelFiles.length})</button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSettings(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancelar</button>
              <button onClick={saveSettings} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Model Manager */}
      {showModelManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Modelos Customizados</h2>
            {modelFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500"><FileCode size={48} className="mx-auto mb-3 opacity-50" /><p>Nenhum Modelfile encontrado</p></div>
            ) : (
              <div className="space-y-3">{modelFiles.map(mf => (
                <div key={mf.name} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div><h3 className="font-medium">{mf.name}</h3><p className="text-xs text-gray-400">{mf.path}</p></div>
                    <button onClick={() => createModelInOllama(mf)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">Criar no Ollama</button>
                  </div>
                  <details><summary className="text-xs text-gray-400 cursor-pointer">Ver Modelfile</summary><pre className="mt-2 text-xs bg-gray-900 p-3 rounded">{mf.content}</pre></details>
                </div>
              ))}</div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModelManager(false); setShowSettings(true); }} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Voltar</button>
              <button onClick={() => { loadModelFiles(); loadOllamaModels(); }} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2"><RefreshCw size={16} /> Atualizar</button>
            </div>
          </div>
        </div>
      )}

      {/* Model Downloader */}
      {showModelDownloader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Baixar Modelos</h2>
            <div className="space-y-3">
              {MODELS.map(m => (
                <div key={m.name} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div><h3 className="font-medium">{m.name}</h3><p className="text-xs text-gray-400">{m.desc} • {m.size}</p></div>
                  <button onClick={() => downloadOllamaModel(m.name)} disabled={!!downloadingModel} className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${downloadingModel === m.name ? "bg-gray-600" : ollamaModels.includes(m.name) ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                    {downloadingModel === m.name ? <><Loader2 size={16} className="animate-spin" /> Baixando...</> : ollamaModels.includes(m.name) ? "✓ Instalado" : <><Download size={16} /> Baixar</>}
                  </button>
                </div>
              ))}
            </div>
            {downloadingModel && downloadProgress && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-300">{downloadProgress}</p>
                {downloadPercent !== null && <div className="mt-2"><div className="w-full h-2 bg-gray-800 rounded"><div className="h-2 bg-blue-500 rounded" style={{ width: `${downloadPercent}%` }} /></div></div>}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModelDownloader(false); setShowSettings(true); }} disabled={!!downloadingModel} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50">Voltar</button>
              <button onClick={loadOllamaModels} disabled={!!downloadingModel} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"><RefreshCw size={16} /> Atualizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
