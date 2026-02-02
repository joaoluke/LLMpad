import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { IMessage, IConversation, IAppSettings, IModelFile } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type CounterContextType = {
  conversations: IConversation[];
  showSettings: boolean;
  modelFiles: IModelFile[];
  ollamaModels: string[];
  settings: IAppSettings;
  messages: IMessage[];
  downloadingModel: string | null;
  downloadProgress: string;
  downloadPercent: number | null;
  showModelManager: boolean;
  showModelDownloader: boolean;
  currentConversation: IConversation | null;
  isLoading: boolean;
  input: string;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  createModelInOllama: (mf: IModelFile) => Promise<void>;
  setSettings: (settings: IAppSettings) => void;
  setInput: (input: string) => void;
  setShowSettings: (show: boolean) => void;
  sendMessage: () => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  selectConversation: (conv: IConversation) => Promise<void>;
  newConversation: () => Promise<void>;
  setShowModelManager: (show: boolean) => void;
  setShowModelDownloader: (show: boolean) => void;
  updateConversationTitle: (id: number, title: string) => Promise<void>;
  loadOllamaModels: () => Promise<void>;
  saveSettings: () => Promise<void>;
  loadModelFiles: () => Promise<void>;
  downloadOllamaModel: (name: string) => Promise<void>;
};

const AppContext = createContext<CounterContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<IAppSettings>({
    api_url: "http://localhost:11434/v1",
    api_key: "",
    model: "llama3.2",
  });
  const [modelFiles, setModelFiles] = useState<IModelFile[]>([]);
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
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

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
      const m = line.match(
        /(\d+(?:\.\d+)?)\s*(KB|MB|GB)\s*\/\s*(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i,
      );
      if (!m) return null;
      const downloaded = parseSizeToBytes(parseFloat(m[1]), m[2]);
      const total = parseSizeToBytes(parseFloat(m[3]), m[4]);
      if (!Number.isFinite(downloaded) || !Number.isFinite(total) || total <= 0)
        return null;
      return Math.min(100, Math.max(0, (downloaded / total) * 100));
    };

    (async () => {
      const unsub = await listen<string>("ollama-pull-progress", (event) => {
        if (disposed) return;
        setDownloadProgress(event.payload);
        const p = tryParsePercent(event.payload);
        if (p !== null) setDownloadPercent(p);
      });
      if (disposed) {
        unsub();
        return;
      }
      unlisten = unsub;
    })();

    return () => {
      disposed = true;
      if (unlisten) unlisten();
    };
  }, [downloadingModel]);

  const loadConversations = async () => {
    try {
      setConversations(await invoke<IConversation[]>("get_conversations"));
    } catch (e) {
      console.error("Erro ao carregar conversas:", e);
    }
  };

  const loadSettings = async () => {
    try {
      const s = await invoke<IAppSettings>("get_settings");
      if (s) setSettings(s);
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
    }
  };

  const saveSettings = async () => {
    try {
      await invoke("save_settings", { settings });
      setShowSettings(false);
      loadOllamaModels();
    } catch (e) {
      console.error("Erro ao salvar configurações:", e);
    }
  };

  const loadModelFiles = async () => {
    try {
      setModelFiles(await invoke<IModelFile[]>("get_modelfiles"));
    } catch (e) {
      console.error("Erro ao carregar Modelfiles:", e);
    }
  };

  const loadOllamaModels = async () => {
    try {
      setOllamaModels(
        await invoke<string[]>("list_ollama_models", {
          apiUrl: settings.api_url,
        }),
      );
    } catch (e) {
      console.error("Erro ao carregar modelos:", e);
      setOllamaModels([]);
    }
  };

  const createModelInOllama = async (mf: IModelFile) => {
    try {
      alert(
        await invoke<string>("create_ollama_model", {
          apiUrl: settings.api_url,
          modelName: mf.name,
          modelfileContent: mf.content,
        }),
      );
      loadOllamaModels();
    } catch (e) {
      alert(`Erro ao criar modelo: ${e}`);
    }
  };

  const downloadOllamaModel = async (name: string) => {
    setDownloadingModel(name);
    setDownloadProgress("Iniciando download...");
    setDownloadPercent(null);
    try {
      alert(await invoke<string>("pull_ollama_model", { modelName: name }));
      await loadOllamaModels();
    } catch (e) {
      alert(`Erro ao baixar modelo: ${e}`);
    }
    setDownloadingModel(null);
    setDownloadProgress("");
    setDownloadPercent(null);
  };

  const newConversation = async () => {
    try {
      const conv = await invoke<IConversation>("create_conversation", {
        title: "Nova Conversa",
      });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (e) {
      console.error("Erro ao criar conversa:", e);
    }
  };

  const selectConversation = async (conv: IConversation) => {
    setCurrentConversation(conv);
    try {
      setMessages(
        await invoke<IMessage[]>("get_messages", { conversationId: conv.id }),
      );
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
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
    } catch (e) {
      console.error("Erro ao deletar conversa:", e);
    }
  };

  const updateConversationTitle = async (id: number, title: string) => {
    try {
      await invoke("update_conversation_title", { id, title });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c)),
      );
      setCurrentConversation((prev) =>
        prev && prev.id === id ? { ...prev, title } : prev,
      );
    } catch (e) {
      console.error("Erro ao atualizar título:", e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userInput = input;
    setInput("");
    setIsLoading(true);
    const tempUserMessageId = Date.now();
    const userMessage: IMessage = {
      id: tempUserMessageId,
      conversation_id: currentConversation?.id || 0,
      role: "user",
      content: userInput,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const [conv, userMsg, assistantMsg] = await invoke<
        [IConversation, IMessage, IMessage]
      >("send_message_complete", {
        conversationId: currentConversation?.id || null,
        userInput,
        apiUrl: settings.api_url,
        apiKey: settings.api_key,
        model: settings.model,
      });
      if (!currentConversation) {
        setCurrentConversation(conv);
        setConversations((prev) => [conv, ...prev]);
      }
      setMessages((prev) => {
        const replaced = prev.map((m) =>
          m.id === tempUserMessageId ? userMsg : m,
        );

        const hasTemp = prev.some((m) => m.id === tempUserMessageId);
        return hasTemp
          ? [...replaced, assistantMsg]
          : [...prev, userMsg, assistantMsg];
      });
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          conversation_id: currentConversation?.id || 0,
          role: "assistant",
          content: `Erro: ${e}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        input,
        theme,
        setTheme,
        settings,
        messages,
        isLoading,
        setInput,
        modelFiles,
        setSettings,
        sendMessage,
        showSettings,
        saveSettings,
        ollamaModels,
        conversations,
        loadModelFiles,
        setShowSettings,
        newConversation,
        downloadPercent,
        loadOllamaModels,
        downloadingModel,
        downloadProgress,
        showModelManager,
        selectConversation,
        deleteConversation,
        currentConversation,
        setShowModelManager,
        showModelDownloader,
        downloadOllamaModel,
        createModelInOllama,
        setShowModelDownloader,
        updateConversationTitle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }
  return context;
};
