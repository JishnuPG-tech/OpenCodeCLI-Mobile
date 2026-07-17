import { MMKV } from "react-native-mmkv";
import { ThemeName } from "../constants/types";

const storage = new MMKV();

export const storageKeys = {
  serverUrl: "opencode_server_url",
  theme: "opencode_theme",
  lastSessionId: "opencode_last_session_id",
} as const;

export function getServerUrl(): string {
  return storage.getString(storageKeys.serverUrl) || "http://localhost:4096";
}

export function setServerUrl(url: string): void {
  storage.set(storageKeys.serverUrl, url);
}

export function getTheme(): ThemeName {
  return (storage.getString(storageKeys.theme) as ThemeName) || "tokyo";
}

export function setTheme(theme: ThemeName): void {
  storage.set(storageKeys.theme, theme);
}

export function getLastSessionId(): string | undefined {
  return storage.getString(storageKeys.lastSessionId);
}

export function setLastSessionId(id: string): void {
  storage.set(storageKeys.lastSessionId, id);
}
