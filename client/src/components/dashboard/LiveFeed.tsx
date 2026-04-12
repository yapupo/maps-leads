import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { useSSE, type SSEEvent } from '../../hooks/useSSE';
import { cn } from '../../lib/utils';

interface FeedItem {
  id: number;
  text: string;
  color: string;
  ts: string;
}

let counter = 0;

function eventToFeedItem(e: SSEEvent): FeedItem | null {
  const ts = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const id = ++counter;

  switch (e.type) {
    case 'job:start':
      return { id, ts, color: 'text-cyan', text: `▶ Job iniciado: ${e.job}` };
    case 'job:idle':
      return { id, ts, color: 'text-muted', text: '■ Ocioso' };
    case 'job:error':
      return { id, ts, color: 'text-red', text: `✖ Erro: ${e.message}` };
    case 'scrape:progress':
      return { id, ts, color: 'text-text', text: `◆ ${e.current}/${e.max} — ${e.name}` };
    case 'scrape:done':
      return { id, ts, color: 'text-green', text: `✔ Scrape concluído: ${e.count} leads` };
    case 'scrape:retry':
      return { id, ts, color: 'text-accent', text: `↺ Retry ${e.field}: ${e.name}` };
    case 'send:progress':
      return { id, ts, color: e.success ? 'text-green' : 'text-red', text: `${e.success ? '✔' : '✖'} Mensagem ${e.current}/${e.total}` };
    case 'send:done':
      return { id, ts, color: 'text-green', text: `✔ Envio concluído: ${e.sent} ok, ${e.failed} falhas` };
    case 'whatsapp:qr':
      return { id, ts, color: 'text-accent', text: '⊡ QR Code gerado — escaneie no WhatsApp' };
    case 'whatsapp:ready':
      return { id, ts, color: 'text-green', text: '✔ WhatsApp conectado' };
    default:
      return null;
  }
}

export function LiveFeed() {
  const { subscribe } = useSSE();
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('*', (e) => {
      const item = eventToFeedItem(e);
      if (!item) return;
      setItems((prev) => [item, ...prev].slice(0, 50));
    });
    return () => { unsubscribe(); };
  }, [subscribe]);

  return (
    <Card className="h-full">
      <CardHeader><CardTitle>Feed ao vivo</CardTitle></CardHeader>
      <div className="space-y-1 font-mono text-xs max-h-[240px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-dim py-4 text-center">Aguardando eventos…</p>
        )}
        {items.map((item) => (
          <div key={item.id} className={cn('flex gap-2 animate-fade-in', item.color)}>
            <span className="text-dim shrink-0">{item.ts}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
