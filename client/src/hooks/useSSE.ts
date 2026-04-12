import { useEffect, useRef, useCallback } from 'react';

/** Tipos de eventos SSE emitidos pelo backend */
export type SSEEvent =
  | { type: 'job:start';       job: string; sessionId?: string }
  | { type: 'job:idle' }
  | { type: 'job:error';       job: string; message: string }
  | { type: 'scrape:phase';    phase: 'collect' | 'extract'; current: number; total: number }
  | { type: 'scrape:progress'; current: number; max: number; name: string }
  | { type: 'scrape:retry';    name: string; field: string }
  | { type: 'scrape:done';     count: number; sessionId: string }
  | { type: 'send:progress';   current: number; total: number; success: boolean; error: string | null }
  | { type: 'send:done';       sent: number; failed: number }
  | { type: 'whatsapp:qr';     qr: string }
  | { type: 'whatsapp:ready' }
  | { type: 'automation:start'; at: string }
  | { type: 'automation:done'; status: 'success' | 'error'; message?: string };

type SSEHandler = (event: SSEEvent) => void;

/**
 * Hook que abre e mantém uma conexão SSE com o backend.
 * Reconecta automaticamente após 3s em caso de erro.
 */
export function useSSE() {
  const handlers = useRef<Map<string, Set<SSEHandler>>>(new Map());
  const es = useRef<EventSource | null>(null);

  const dispatch = useCallback((event: SSEEvent) => {
    const all = handlers.current.get('*');
    all?.forEach((h) => h(event));
    const typed = handlers.current.get(event.type);
    typed?.forEach((h) => h(event));
  }, []);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const source = new EventSource('/api/events');
      es.current = source;

      source.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data) as SSEEvent;
          dispatch(parsed);
        } catch { /* ignora mensagens malformadas */ }
      };

      source.onerror = () => {
        source.close();
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      es.current?.close();
    };
  }, [dispatch]);

  const subscribe = useCallback((eventType: string, handler: SSEHandler) => {
    if (!handlers.current.has(eventType)) {
      handlers.current.set(eventType, new Set());
    }
    handlers.current.get(eventType)!.add(handler);
    return () => handlers.current.get(eventType)?.delete(handler);
  }, []);

  return { subscribe };
}
