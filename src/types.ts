export interface IMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface IConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface IAppSettings {
  api_url: string;
  api_key: string;
  model: string;
}

export interface IModelFile {
  name: string;
  path: string;
  content: string;
}
