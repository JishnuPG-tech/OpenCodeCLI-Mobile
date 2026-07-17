export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessagePart {
  type: "text" | "tool-invocation" | "tool-result";
  text?: string;
  toolInvocation?: {
    toolName: string;
    args: Record<string, unknown>;
    state: "call" | "result";
    result?: string;
  };
}

export interface Message {
  id: string;
  sessionID: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  created_at: string;
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
}

export interface ServerStatus {
  connected: boolean;
  version?: string;
}

export type ThemeName = "tokyo" | "dracula" | "nord" | "gruvbox" | "onedark" | "catppuccin";

export interface Theme {
  name: ThemeName;
  label: string;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    secondary: string;
    danger: string;
    success: string;
    warning: string;
    accent: string;
  };
}
