import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../lib/api";

export function useServerStatus() {
  return useQuery({
    queryKey: ["serverStatus"],
    queryFn: api.getServerStatus,
    refetchInterval: 10000,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: api.getSessions,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => api.getSession(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useMessages(sessionId: string) {
  return useQuery({
    queryKey: ["messages", sessionId],
    queryFn: () => api.getMessages(sessionId),
    enabled: !!sessionId,
  });
}

export function useFiles(dir: string = ".") {
  return useQuery({
    queryKey: ["files", dir],
    queryFn: () => api.getFiles(dir),
    enabled: true,
  });
}

export function useFileContent(path: string) {
  return useQuery({
    queryKey: ["fileContent", path],
    queryFn: () => api.getFileContent(path),
    enabled: !!path,
  });
}

export function useSearch(query: string, dir: string = ".") {
  return useQuery({
    queryKey: ["search", query, dir],
    queryFn: () => api.searchFiles(query, dir),
    enabled: query.length > 0,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });
}

export function useTerminalSessions() {
  return useQuery({
    queryKey: ["terminalSessions"],
    queryFn: api.getTerminalSessions,
  });
}

export function useCreateTerminalSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTerminalSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["terminalSessions"] }),
  });
}
