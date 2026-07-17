import { getServerUrl, setServerUrl as persistServerUrl } from "./storage";

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sessionID: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  created_at: string;
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

function baseUrl(): string {
  return getServerUrl();
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export function setServerUrl(url: string) {
  persistServerUrl(url);
}

export function getServerStatus(): Promise<{ connected: boolean; version?: string }> {
  return request("/status").then(
    () => ({ connected: true, version: "unknown" }),
    () => ({ connected: false })
  );
}

export function getSessions(): Promise<Session[]> {
  return request("/session");
}

export function getSession(id: string): Promise<Session> {
  return request(`/session/${id}`);
}

export function createSession(): Promise<Session> {
  return request("/session", { method: "POST" });
}

export function deleteSession(id: string): Promise<void> {
  return request(`/session/${id}`, { method: "DELETE" });
}

export function getMessages(sessionId: string): Promise<Message[]> {
  return request(`/session/${sessionId}/message`);
}

export async function* streamMessage(
  sessionId: string,
  content: string
): AsyncGenerator<MessagePart> {
  const res = await fetch(`${baseUrl()}/session/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok || !res.body) {
    throw new Error("Stream failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6);
        if (json === "[DONE]") return;
        try {
          const part = JSON.parse(json) as MessagePart;
          yield part;
        } catch {
          // skip malformed
        }
      }
    }
  }
}

export function getFiles(dir: string = "."): Promise<FileEntry[]> {
  return request(`/files?path=${encodeURIComponent(dir)}`);
}

export function getFileContent(path: string): Promise<{ content: string }> {
  return request(`/file?path=${encodeURIComponent(path)}`);
}

export function searchFiles(
  query: string,
  dir: string = "."
): Promise<SearchResult[]> {
  return request(
    `/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(dir)}`
  );
}

export function getTerminalSessions(): Promise<unknown[]> {
  return request("/terminal");
}

export function createTerminalSession(): Promise<{ id: string }> {
  return request("/terminal", { method: "POST" });
}

export function getProjects(): Promise<{ name: string; path: string }[]> {
  return request("/projects");
}
