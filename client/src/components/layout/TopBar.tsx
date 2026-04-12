import { useEffect, useState } from 'react';
import { useSSE } from '../../hooks/useSSE';
import { cn } from '../../lib/utils';

type JobStatus = 'idle' | 'scraping' | 'sending';

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; dot: string }> = {
  idle:     { label: 'Ocioso',    color: 'text-muted',  dot: 'bg-dim'   },
  scraping: { label: 'Scrapando', color: 'text-accent', dot: 'bg-accent animate-pulse' },
  sending:  { label: 'Enviando',  color: 'text-cyan',   dot: 'bg-cyan animate-pulse'  },
};

interface TopBarProps { title: string }

export function TopBar({ title }: TopBarProps) {
  const { subscribe } = useSSE();
  const [status, setStatus] = useState<JobStatus>('idle');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsubAll = subscribe('*', () => setConnected(true));
    const unsubStart = subscribe('job:start', (e) => {
      if (e.type === 'job:start') {
        setStatus(e.job === 'scrape' ? 'scraping' : 'sending');
      }
    });
    const unsubIdle = subscribe('job:idle', () => setStatus('idle'));
    return () => { unsubAll(); unsubStart(); unsubIdle(); };
  }, [subscribe]);

  const cfg = STATUS_CONFIG[status];

  return (
    <header className="h-12 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="font-display font-extrabold text-base uppercase tracking-widest text-text">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-green' : 'bg-dim')} />
          {connected ? 'Live' : 'Conectando…'}
        </div>

        <div className={cn('flex items-center gap-1.5 text-xs font-mono', cfg.color)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </div>
      </div>
    </header>
  );
}
