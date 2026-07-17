import { MMKV } from "react-native-mmkv";
import { ThemeName } from "../constants/types";

const storage = new MMKV();

export const storageKeys = {
  serverUrl: "opencode_server_url",
  authType: "opencode_auth_type",
  authValue: "opencode_auth_value",
  theme: "opencode_theme",
  lastSessionId: "opencode_last_session_id",
} as const;

export type AuthType = "none" | "basic" | "bearer" | "apikey";

// ── Server URL ──

export function getServerUrl(): string {
  return storage.getString(storageKeys.serverUrl) || "http://127.0.0.1:4096";
}

export function setServerUrl(url: string): void {
  storage.set(storageKeys.serverUrl, url);
}

// ── Auth ──

export function getAuthType(): AuthType {
  return (storage.getString(storageKeys.authType) as AuthType) || "none";
}

export function setAuthType(type: AuthType): void {
  storage.set(storageKeys.authType, type);
}

/** Get stored auth value (password for basic, token for bearer/apikey) */
export function getAuthValue(): string {
  return storage.getString(storageKeys.authValue) || "";
}

export function setAuthValue(value: string): void {
  storage.set(storageKeys.authValue, value);
}

/** Get credentials for basic auth (username:password) */
export function getCredentials(): { username: string; password: string } {
  const val = getAuthValue();
  if (getAuthType() === "basic" && val.includes(":")) {
    const [username, ...rest] = val.split(":");
    return { username, password: rest.join(":") };
  }
  return { username: "", password: "" };
}

/** Set basic auth credentials */
export function setCredentials(username: string, password: string): void {
  setAuthType("basic");
  setAuthValue(`${username}:${password}`);
}

export function clearAuth(): void {
  storage.delete(storageKeys.authType);
  storage.delete(storageKeys.authValue);
}

/** Build Authorization header value */
export function getAuthHeader(): Record<string, string> {
  const type = getAuthType();
  const value = getAuthValue();

  if (!value) return {};

  switch (type) {
    case "basic": {
      const creds = getCredentials();
      if (creds.username) {
        return { Authorization: `Basic ${btoa(`${creds.username}:${creds.password}`)}` };
      }
      return {};
    }
    case "bearer":
      return { Authorization: `Bearer ${value}` };
    case "apikey":
      return { "X-API-Key": value };
    default:
      return {};
  }
}

// ── Theme ──

export function getTheme(): ThemeName {
  return (storage.getString(storageKeys.theme) as ThemeName) || "tokyo";
}

export function setTheme(theme: ThemeName): void {
  storage.set(storageKeys.theme, theme);
}

// ── Last session ──

export function getLastSessionId(): string | undefined {
  return storage.getString(storageKeys.lastSessionId);
}

export function setLastSessionId(id: string): void {
  storage.set(storageKeys.lastSessionId, id);
}
