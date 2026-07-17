import { useState, useCallback, useRef } from "react";
import { MessagePart, streamMessage } from "../lib/api";

export function useSSE() {
  const [streaming, setStreaming] = useState(false);
  const [parts, setParts] = useState<MessagePart[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (sessionId: string, content: string) => {
    setStreaming(true);
    setParts([]);
    setError(null);
    abortRef.current = new AbortController();

    try {
      for await (const part of streamMessage(sessionId, content)) {
        setParts((prev) => [...prev, part]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { send, cancel, streaming, parts, error };
}
