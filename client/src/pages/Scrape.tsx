import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Hash, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useSSE } from '../hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

type Phase = 'collect' | 'extract' | null;

interface PhaseState {
  phase: Phase;
  current: number;
  total: number;
}

interface DoneState {
  count: number;
  sessionId: string;
}

type JobState = 'idle' | 'running' | 'done' | 'error';

export function Scrape() {
  const { subscribe } = useSSE();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [extractEmails, setExtractEmails] = useState(false);

  const [jobState, setJobState] = useState<JobState>('idle');
  const [phaseState, setPhaseState] = useState<PhaseState>({ phase: null, current: 0, total: 0 });
  const [progress, setProgress] = useState<{ current: number; max: number; name: string } | null>(null);
  const [done, setDone] = useState<DoneState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribe('job:start', (e) => {
        if (e.type === 'job:start' && e.job === 'scrape') {
          setJobState('running');
          setDone(null);
          setError(null);
          setPhaseState({ phase: null, current: 0, total: 0 });
          setProgress(null);
        }
      }),
      subscribe('job:idle', () => {
        // only transition if we haven't gotten a done/error yet
        setJobState((prev) => (prev === 'running' ? 'idle' : prev));
      }),
      subscribe('job:error', (e) => {
        if (e.type === 'job:error' && e.job === 'scrape') {
          setJobState('error');
          setError(e.message);
        }
      }),
      subscribe('scrape:phase', (e) => {
        if (e.type === 'scrape:phase') {
          setPhaseState({ phase: e.phase, current: e.current, total: e.total });
        }
      }),
      subscribe('scrape:progress', (e) => {
        if (e.type === 'scrape:progress') {
          setProgress({ current: e.current, max: e.max, name: e.name });
          setPhaseState((prev) => ({ ...prev, current: e.current, total: e.max }));
        }
      }),
      subscribe('scrape:done', (e) => {
        if (e.type === 'scrape:done') {
          setJobState('done');
          setDone({ count: e.count, sessionId: e.sessionId });
        }
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      setJobState('running');
      setDone(null);
      setError(null);
      setPhaseState({ phase: null, current: 0, total: 0 });
      setProgress(null);
      try {
        await api.scrape.start({
          query: query.trim(),
          location: location.trim() || undefined,
          maxResults,
          extractEmails,
        });
      } catch (err) {
        setJobState('error');
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    },
    [query, location, maxResults, extractEmails]
  );

  const isRunning = jobState === 'running';

  const phaseLabel =
    phaseState.phase === 'collect'
      ? 'Coletando URLs'
      : phaseState.phase === 'extract'
      ? 'Extraindo detalhes'
      : 'Iniciando…';

  const phasePct =
    phaseState.total > 0
      ? Math.min(100, Math.round((phaseState.current / phaseState.total) * 100))
      : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl uppercase tracking-widest text-text">
          Raspar Leads
        </h1>
        <p className="text-sm text-muted mt-1">
          Busca negócios no Google Maps e extrai informações de contato.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de Busca</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Query"
            placeholder="ex: restaurantes, clínicas odontológicas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            disabled={isRunning}
          />

          <Input
            label="Localização"
            placeholder="ex: São Paulo, SP (opcional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isRunning}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">
              Máx. Resultados
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              disabled={isRunning}
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text
                         placeholder:text-dim focus:outline-none focus:border-accent/60
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-32 font-mono"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={extractEmails}
                onChange={(e) => setExtractEmails(e.target.checked)}
                disabled={isRunning}
              />
              <div className="w-9 h-5 bg-elevated border border-border rounded-full peer-checked:bg-accent/20
                              peer-checked:border-accent/60 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-dim rounded-full transition-transform
                              peer-checked:translate-x-4 peer-checked:bg-accent" />
            </div>
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Extrair Emails
            </span>
            <span className="text-xs text-dim">(acessa site de cada negócio)</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isRunning}
              disabled={isRunning || !query.trim()}
              className="gap-2"
            >
              <Search size={14} />
              {isRunning ? 'Raspando…' : 'Raspar'}
            </Button>

            {jobState !== 'idle' && !isRunning && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setJobState('idle');
                  setDone(null);
                  setError(null);
                  setPhaseState({ phase: null, current: 0, total: 0 });
                  setProgress(null);
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card accent="amber" className="animate-fade-in">
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
            <span className="text-xs font-mono text-accent">{phaseLabel}</span>
          </CardHeader>

          <div className="space-y-3">
            {/* Phase tabs */}
            <div className="flex gap-2">
              {(['collect', 'extract'] as const).map((p) => (
                <div
                  key={p}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                    phaseState.phase === p
                      ? 'bg-accent/10 border-accent/40 text-accent'
                      : 'bg-elevated border-border text-dim'
                  }`}
                >
                  {p === 'collect' ? <MapPin size={11} /> : <Hash size={11} />}
                  {p === 'collect' ? 'Coletando URLs' : 'Extraindo detalhes'}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs font-mono text-muted mb-1.5">
                <span>{phaseState.current} / {phaseState.total || '?'}</span>
                <span>{phasePct}%</span>
              </div>
              <div className="h-1.5 bg-elevated border border-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300 rounded-full"
                  style={{ width: `${phasePct}%` }}
                />
              </div>
            </div>

            {/* Current item */}
            {progress?.name && (
              <p className="text-xs text-muted font-mono truncate">
                <span className="text-dim">Atual: </span>
                {progress.name}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Done */}
      {jobState === 'done' && done && (
        <Card accent="green" className="animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">Raspagem concluída!</p>
              <p className="text-xs text-muted mt-1 font-mono">
                <span className="text-green font-bold">{done.count}</span> contatos encontrados
                {' · '}
                <span className="text-dim">sessão {done.sessionId.slice(0, 8)}</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {jobState === 'error' && error && (
        <Card accent="red" className="animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">Erro na raspagem</p>
              <p className="text-xs text-muted mt-1 font-mono">{error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
