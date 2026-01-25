export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  api_url: string;
  api_key: string;
  model: string;
}

export interface ModelFile {
  name: string;
  path: string;
  content: string;
}
