import { useState, useEffect } from 'react';
import { Play, Save, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAutomation, useSaveAutomation, useRunAutomation } from '../hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { TunnelQR } from '../components/TunnelQR';
import { formatDate, timeAgo } from '../lib/utils';
import type { AutomationConfig } from '../lib/api';

type Channel = AutomationConfig['channel'];

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: 'none',      label: 'Nenhum' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'email',     label: 'Email' },
  { value: 'both',      label: 'Ambos' },
];

const WA_HINTS = ['{nome}', '{telefone}', '{email}', '{endereco}', '{site}'];

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Bahia',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Rio_Branco',
  'UTC',
];

export function Automation() {
  const { data: config, isLoading } = useAutomation();
  const saveMutation   = useSaveAutomation();
  const runMutation    = useRunAutomation();

  const [enabled,           setEnabled]           = useState(false);
  const [query,             setQuery]             = useState('');
  const [location,          setLocation]          = useState('');
  const [maxResults,        setMaxResults]        = useState(20);
  const [channel,           setChannel]           = useState<Channel>('none');
  const [hour,              setHour]              = useState(9);
  const [minute,            setMinute]            = useState(0);
  const [timezone,          setTimezone]          = useState('America/Sao_Paulo');
  const [templateWhatsapp,  setTemplateWhatsapp]  = useState('');
  const [templateEmail,     setTemplateEmail]     = useState('');
  const [saveStatus,        setSaveStatus]        = useState<'idle' | 'saved' | 'error'>('idle');
  const [runStatus,         setRunStatus]         = useState<'idle' | 'running' | 'done' | 'error'>('idle');

  // Populate form when data arrives
  useEffect(() => {
    if (!config) return;
    setEnabled(config.enabled);
    setQuery(config.query);
    setLocation(config.location);
    setMaxResults(config.maxResults);
    setChannel(config.channel);
    setHour(config.hour);
    setMinute(config.minute);
    setTimezone(config.timezone);
    setTemplateWhatsapp(config.templateWhatsapp);
    setTemplateEmail(config.templateEmail);
  }, [config]);

  const handleSave = async () => {
    setSaveStatus('idle');
    try {
      await saveMutation.mutateAsync({
        enabled,
        query,
        location,
        maxResults,
        channel,
        hour,
        minute,
        timezone,
        templateWhatsapp,
        templateEmail,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleRunNow = async () => {
    setRunStatus('running');
    try {
      await runMutation.mutateAsync();
      setRunStatus('done');
      setTimeout(() => setRunStatus('idle'), 4000);
    } catch {
      setRunStatus('error');
      setTimeout(() => setRunStatus('idle'), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  const showWaTemplate  = channel === 'whatsapp' || channel === 'both';
  const showEmailTemplate = channel === 'email' || channel === 'both';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl uppercase tracking-widest text-text">
          Automação
        </h1>
        <p className="text-sm text-muted mt-1">
          Configure raspagem e disparo automáticos em horário agendado.
        </p>
      </div>

      {/* Tunnel QR */}
      <TunnelQR />

      {/* Last run status card */}
      {config && (config.lastRunAt || config.lastRunStatus) && (
        <Card accent={config.lastRunStatus === 'success' ? 'green' : config.lastRunStatus === 'error' ? 'red' : 'none'}>
          <CardHeader>
            <CardTitle>Última Execução</CardTitle>
            {config.lastRunStatus && (
              <Badge variant={config.lastRunStatus === 'success' ? 'green' : 'red'}>
                {config.lastRunStatus === 'success' ? 'Sucesso' : 'Erro'}
              </Badge>
            )}
          </CardHeader>
          <div className="space-y-1 text-xs font-mono text-muted">
            {config.lastRunAt && (
              <p>
                <span className="text-dim">Quando: </span>
                {formatDate(config.lastRunAt)}
                <span className="text-dim ml-2">({timeAgo(config.lastRunAt)})</span>
              </p>
            )}
            {config.lastRunSummary && (
              <p>
                <span className="text-dim">Resumo: </span>
                {config.lastRunSummary}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Enable toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Automação Agendada</p>
            <p className="text-xs text-muted mt-0.5">
              Executa raspagem + disparo automaticamente no horário configurado.
            </p>
          </div>
          <label className="relative cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-elevated border border-border rounded-full
                            peer-checked:bg-accent/20 peer-checked:border-accent/60 transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-dim rounded-full transition-transform
                            peer-checked:translate-x-5 peer-checked:bg-accent" />
          </label>
        </div>
      </Card>

      {/* Scrape config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Raspagem</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Query"
            placeholder="ex: restaurantes, clínicas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Input
            label="Localização"
            placeholder="ex: São Paulo, SP (opcional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text font-mono
                         focus:outline-none focus:border-accent/60 transition-colors w-32"
            />
          </div>
        </div>
      </Card>

      {/* Schedule config */}
      <Card>
        <CardHeader>
          <CardTitle>Horário de Execução</CardTitle>
          <Clock size={14} className="text-muted" />
        </CardHeader>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">Hora</label>
            <input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text font-mono
                         focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">Minuto</label>
            <input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text font-mono
                         focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">Fuso</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text
                         focus:outline-none focus:border-accent/60 transition-colors
                         disabled:opacity-50 appearance-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-dim font-mono mt-3">
          Executa diariamente às{' '}
          <span className="text-accent">
            {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
          </span>{' '}
          ({timezone})
        </p>
      </Card>

      {/* Channel config */}
      <Card>
        <CardHeader>
          <CardTitle>Canal de Disparo</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-1.5 mb-4">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">Canal</span>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setChannel(value)}
                className={`px-4 py-1.5 text-sm rounded border transition-colors cursor-pointer
                  ${
                    channel === value
                      ? 'bg-accent/10 border-accent/50 text-accent'
                      : 'bg-elevated border-border text-muted hover:border-border-bright hover:text-text'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {showWaTemplate && (
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">
              Template WhatsApp
            </label>
            <textarea
              value={templateWhatsapp}
              onChange={(e) => setTemplateWhatsapp(e.target.value)}
              rows={4}
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text
                         placeholder:text-dim focus:outline-none focus:border-accent/60 transition-colors
                         resize-y font-mono"
            />
            <div className="flex flex-wrap gap-1.5">
              {WA_HINTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTemplateWhatsapp((t) => t + v)}
                  className="px-2 py-0.5 text-xs font-mono rounded border border-border bg-elevated
                             text-dim hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {showEmailTemplate && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">
              Template Email
            </label>
            <textarea
              value={templateEmail}
              onChange={(e) => setTemplateEmail(e.target.value)}
              rows={4}
              className="bg-elevated border border-border rounded px-3 py-2 text-sm text-text
                         placeholder:text-dim focus:outline-none focus:border-accent/60 transition-colors
                         resize-y font-mono"
            />
            <div className="flex flex-wrap gap-1.5">
              {WA_HINTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTemplateEmail((t) => t + v)}
                  className="px-2 py-0.5 text-xs font-mono rounded border border-border bg-elevated
                             text-dim hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending || runMutation.isPending}
        >
          <Save size={14} />
          Salvar Configuração
        </Button>

        <Button
          variant="secondary"
          onClick={handleRunNow}
          loading={runMutation.isPending}
          disabled={saveMutation.isPending || runMutation.isPending}
        >
          <Play size={14} />
          Executar Agora
        </Button>

        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-xs text-green font-mono animate-fade-in">
            <CheckCircle size={12} />
            Salvo com sucesso
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-xs text-red font-mono animate-fade-in">
            <AlertCircle size={12} />
            Erro ao salvar
          </span>
        )}

        {runStatus === 'done' && (
          <span className="flex items-center gap-1.5 text-xs text-green font-mono animate-fade-in">
            <CheckCircle size={12} />
            Execução iniciada
          </span>
        )}
        {runStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-xs text-red font-mono animate-fade-in">
            <AlertCircle size={12} />
            Erro ao executar
          </span>
        )}
      </div>
    </div>
  );
}
