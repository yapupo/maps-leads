import { useState, useEffect, useCallback } from 'react';
import { Send as SendIcon, CheckCircle, AlertCircle, Smartphone, Mail, QrCode } from 'lucide-react';
import { api } from '../lib/api';
import { useSSE } from '../hooks';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

type Channel = 'whatsapp' | 'email';
type JobState = 'idle' | 'running' | 'done' | 'error';

const VARIABLE_HINTS = ['{nome}', '{telefone}', '{email}', '{endereco}', '{site}'];

const DEFAULT_WA_TEMPLATE =
  'Olá, {nome}! Vi que você tem um negócio incrível. Gostaria de conversar sobre como podemos ajudá-lo a crescer ainda mais. 😊';

const DEFAULT_EMAIL_TEMPLATE =
  'Olá, {nome}!\n\nEntramos em contato pois acreditamos que podemos agregar valor ao seu negócio.\n\nAtenciosamente.';

export function Send() {
  const { subscribe } = useSSE();

  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [template, setTemplate] = useState(DEFAULT_WA_TEMPLATE);
  const [delayMs, setDelayMs] = useState(2000);

  const [jobState, setJobState] = useState<JobState>('idle');
  const [sendProgress, setSendProgress] = useState<{
    current: number;
    total: number;
    success: number;
    fail: number;
  } | null>(null);
  const [done, setDone] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [waReady, setWaReady] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribe('job:start', (e) => {
        if (e.type === 'job:start' && e.job === 'send') {
          setJobState('running');
          setDone(null);
          setError(null);
          setSendProgress(null);
        }
      }),
      subscribe('job:error', (e) => {
        if (e.type === 'job:error' && e.job === 'send') {
          setJobState('error');
          setError(e.message);
        }
      }),
      subscribe('send:progress', (e) => {
        if (e.type === 'send:progress') {
          setSendProgress((prev) => ({
            current: e.current,
            total: e.total,
            success: (prev?.success ?? 0) + (e.success ? 1 : 0),
            fail:    (prev?.fail    ?? 0) + (!e.success ? 1 : 0),
          }));
        }
      }),
      subscribe('send:done', (e) => {
        if (e.type === 'send:done') {
          setJobState('done');
          setDone({ sent: e.sent, failed: e.failed });
        }
      }),
      subscribe('whatsapp:qr', (e) => {
        if (e.type === 'whatsapp:qr') {
          setQrData(e.qr);
          setWaReady(false);
        }
      }),
      subscribe('whatsapp:ready', () => {
        setWaReady(true);
        setQrData(null);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  const handleChannelChange = (ch: Channel) => {
    setChannel(ch);
    setTemplate(ch === 'whatsapp' ? DEFAULT_WA_TEMPLATE : DEFAULT_EMAIL_TEMPLATE);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!template.trim()) return;
      setJobState('running');
      setDone(null);
      setError(null);
      setSendProgress(null);
      try {
        await api.send.start({ channel, template: template.trim(), delayMs });
      } catch (err) {
        setJobState('error');
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    },
    [channel, template, delayMs]
  );

  const isRunning = jobState === 'running';
  const pct =
    sendProgress && sendProgress.total > 0
      ? Math.min(100, Math.round((sendProgress.current / sendProgress.total) * 100))
      : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl uppercase tracking-widest text-text">
          Disparar Mensagens
        </h1>
        <p className="text-sm text-muted mt-1">
          Envie mensagens personalizadas para os contatos coletados.
        </p>
      </div>

      {/* WhatsApp QR */}
      {channel === 'whatsapp' && qrData && !waReady && (
        <Card accent="amber" className="animate-fade-in">
          <CardHeader>
            <CardTitle>Autenticação WhatsApp</CardTitle>
            <QrCode size={14} className="text-accent" />
          </CardHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <img
              src={qrData}
              alt="WhatsApp QR Code"
              className="w-48 h-48 rounded border border-border bg-white p-2"
            />
            <p className="text-xs text-muted text-center">
              Escaneie com o WhatsApp para autenticar a sessão.
            </p>
          </div>
        </Card>
      )}

      {channel === 'whatsapp' && waReady && (
        <Card accent="green" className="animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green" />
            <span className="text-xs font-mono text-green uppercase tracking-wider">
              WhatsApp conectado
            </span>
          </div>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Disparo</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Channel selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">Canal</span>
            <div className="flex gap-2">
              {(['whatsapp', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleChannelChange(ch)}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded border transition-colors cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      channel === ch
                        ? 'bg-accent/10 border-accent/50 text-accent'
                        : 'bg-elevated border-border text-muted hover:border-border-bright hover:text-text'
                    }`}
                >
                  {ch === 'whatsapp' ? <Smartphone size={14} /> : <Mail size={14} />}
                  {ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">
              Template da Mensagem
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              disabled={isRunning}
              rows={5}
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text
                         placeholder:text-dim focus:outline-none focus:border-accent/60 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed resize-y font-mono"
            />
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_HINTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTemplate((t) => t + v)}
                  className="px-2 py-0.5 text-xs font-mono rounded border border-border bg-elevated
                             text-dim hover:text-accent hover:border-accent/40 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Delay */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">
              Intervalo entre envios:{' '}
              <span className="text-accent">{(delayMs / 1000).toFixed(1)}s</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={500}
                max={10000}
                step={500}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                disabled={isRunning}
                className="flex-1 accent-[#F0B429] disabled:opacity-50"
              />
              <input
                type="number"
                min={500}
                max={10000}
                step={500}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                disabled={isRunning}
                className="w-24 bg-elevated border border-border rounded px-3 py-1.5 text-sm text-text
                           font-mono focus:outline-none focus:border-accent/60 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed text-right"
              />
              <span className="text-xs text-dim">ms</span>
            </div>
            <p className="text-xs text-dim">Mínimo 500ms · Máximo 10000ms</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              loading={isRunning}
              disabled={isRunning || !template.trim()}
            >
              <SendIcon size={14} />
              {isRunning ? 'Enviando…' : 'Disparar'}
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
                  setSendProgress(null);
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Send progress */}
      {isRunning && sendProgress && (
        <Card accent="cyan" className="animate-fade-in">
          <CardHeader>
            <CardTitle>Progresso do Disparo</CardTitle>
            <span className="text-xs font-mono text-cyan">
              {sendProgress.current} / {sendProgress.total}
            </span>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-muted mb-1.5">
                <span>{pct}%</span>
                <span className="flex gap-3">
                  <span className="text-green">{sendProgress.success} ok</span>
                  <span className="text-red">{sendProgress.fail} falhas</span>
                </span>
              </div>
              <div className="h-1.5 bg-elevated border border-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan transition-all duration-300 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Done */}
      {jobState === 'done' && done && (
        <Card accent="green" className="animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">Disparo concluído!</p>
              <p className="text-xs text-muted mt-1 font-mono">
                <span className="text-green">{done.sent}</span> enviados
                {' · '}
                <span className="text-red">{done.failed}</span> falhas
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
              <p className="text-sm font-medium text-text">Erro no disparo</p>
              <p className="text-xs text-muted mt-1 font-mono">{error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
