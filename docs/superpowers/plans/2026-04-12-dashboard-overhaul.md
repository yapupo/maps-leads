# Dashboard Overhaul — SENTINEL UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o HTML/CSS/JS monolítico por uma SPA React com design de painel de controle industrial — densa em dados, completamente escura, visualmente distinta — mantendo os endpoints REST e SSE da API existente sem nenhuma mudança no backend.

**Architecture:** SPA React 18 + Vite em `client/` servida pelo Express em produção via `express.static('client/dist')`. Em desenvolvimento, Vite roda em `:5173` com proxy para a API em `:3000`. Dados via TanStack Query + hooks customizados. Real-time via SSE hook dedicado. Navegação via React Router v6.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v3, shadcn/ui (customizado), Recharts, TanStack Query v5, React Router v6, date-fns, Lucide React

---

## Aesthetic Direction: SENTINEL

**Conceito:** Painel de operações militares — você está caçando leads como um radar detecta alvos.
Não é um SaaS genérico. É uma ferramenta de poder.

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-base` | `#080B10` | Fundo principal |
| `--bg-card` | `#0D1117` | Cards e painéis |
| `--bg-elevated` | `#161B22` | Hover, inputs |
| `--border` | `#21262D` | Divisores |
| `--border-bright` | `#30363D` | Bordas de foco |
| `--accent` | `#F0B429` | Amber — ação primária |
| `--accent-dim` | `#92620A` | Amber escuro |
| `--green` | `#3FB950` | Sucesso, leads encontrados |
| `--cyan` | `#58A6FF` | Links, info |
| `--red` | `#F85149` | Erros |
| `--text` | `#E6EDF3` | Texto primário |
| `--text-muted` | `#7D8590` | Texto secundário |
| `--text-dim` | `#484F58` | Texto desativado |

**Fontes:**
- Display/Headers: `Barlow Condensed` (weight 600–800) — industrial, agressivo
- Dados/Números: `JetBrains Mono` (weight 400–600) — terminal preciso
- Body/UI: `DM Sans` (weight 400–500) — legível, sem personalidade própria (deixa os outros brilharem)

**Layouts especiais:**
- Nenhum border-radius acima de `6px` — tudo afiado
- Cards com borda esquerda colorida de `2px` para indicar estado
- Números grandes em Barlow Condensed uppercase + JetBrains Mono para valores
- Tabelas com linhas alternadas sutis e hover que ilumina toda a linha
- Progress bars com animação de scan (gradiente que atravessa)

---

## Mapa de Arquivos

```
maps-leads/
  client/
    index.html
    vite.config.ts
    tailwind.config.js
    tsconfig.json
    package.json
    src/
      main.tsx                         # Entry + QueryClient + Router
      App.tsx                          # Rotas principais
      index.css                        # CSS variables + Tailwind + fontes

      lib/
        api.ts                         # fetch wrapper + todos os endpoints
        utils.ts                       # cn(), formatPhone(), formatDate()

      hooks/
        useSSE.ts                      # SSE connection + event dispatch
        useContacts.ts                 # load, clear, download contacts
        useAnalytics.ts                # analytics endpoint
        useHistory.ts                  # scrape history
        useAutomation.ts               # automation config + run

      components/
        ui/
          Badge.tsx                    # Status badge (phone/email/sent)
          Button.tsx                   # Botão com variantes
          Card.tsx                     # Card container
          Input.tsx                    # Input estilizado
          Textarea.tsx                 # Textarea estilizado
          Select.tsx                   # Select dropdown
          Switch.tsx                   # Toggle switch
          Tooltip.tsx                  # Tooltip hover
          Spinner.tsx                  # Loading spinner

        layout/
          Shell.tsx                    # Layout raiz: sidebar + main
          Sidebar.tsx                  # Navegação lateral
          TopBar.tsx                   # Barra superior com status SSE

        dashboard/
          StatCard.tsx                 # Card de métrica única (número grande)
          FunnelChart.tsx              # Funil Total→Phone→Email→Sent (Recharts)
          CategoryChart.tsx            # Top categorias horizontal bar (Recharts)
          LiveFeed.tsx                 # Feed de eventos SSE em tempo real
          QuickActions.tsx             # Botões de ação rápida

        leads/
          LeadsTable.tsx               # Tabela completa de contatos
          LeadFilters.tsx              # Filtros: busca, has_phone, has_email, sent
          LeadRow.tsx                  # Linha individual com ações
          EmptyState.tsx               # Estado vazio da tabela

        scrape/
          ScrapeForm.tsx               # Formulário de scrape
          ScrapeProgress.tsx           # Progresso em tempo real (fases + barra)
          PhaseIndicator.tsx           # Indicador collect/extract com animação

        send/
          SendForm.tsx                 # Formulário de envio
          TemplateEditor.tsx           # Editor de template com preview
          SendProgress.tsx             # Progresso de envio

        analytics/
          SessionStats.tsx             # Tabela de sessões com yield %
          FieldRateBar.tsx             # Barras de taxa por campo

        history/
          HistoryList.tsx              # Lista de sessões passadas
          SessionDetail.tsx            # Modal com contatos de uma sessão

        automation/
          AutomationForm.tsx           # Config de automação (cron)
          AutomationStatusCard.tsx     # Status do último run

      pages/
        Dashboard.tsx                  # Visão geral
        Leads.tsx                      # Tabela completa de leads
        Scrape.tsx                     # Painel de scraping
        Send.tsx                       # Painel de envio
        Analytics.tsx                  # Gráficos e estatísticas
        History.tsx                    # Histórico de sessões
        Automation.tsx                 # Configuração de automação

  src/web/server.ts                    # Modificar: servir client/dist
```

---

## Task 1: Scaffolding — React + Vite + Tailwind + shadcn

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.ts`
- Create: `client/tailwind.config.js`
- Create: `client/tsconfig.json`
- Create: `client/index.html`

- [ ] **Step 1: Criar o diretório client e instalar dependências**

```bash
cd C:/Users/TEPA/maps-leads
mkdir client && cd client
npm init -y
npm install react react-dom react-router-dom @tanstack/react-query recharts lucide-react date-fns clsx tailwind-merge
npm install -D typescript vite @vitejs/plugin-react tailwindcss autoprefixer postcss @types/react @types/react-dom
npx tailwindcss init -p
```

- [ ] **Step 2: Criar `client/package.json` completo**

```json
{
  "name": "maps-leads-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.28.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.372.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.3",
    "recharts": "^2.12.3",
    "tailwind-merge": "^2.2.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5",
    "vite": "^5.2.8"
  }
}
```

- [ ] **Step 3: Criar `client/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxies toda chamada /api para o Express em :3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../src/web/public',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 4: Criar `client/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#080B10',
        card:     '#0D1117',
        elevated: '#161B22',
        border:   '#21262D',
        'border-bright': '#30363D',
        accent:   '#F0B429',
        'accent-dim': '#92620A',
        green:    '#3FB950',
        cyan:     '#58A6FF',
        red:      '#F85149',
        text:     '#E6EDF3',
        muted:    '#7D8590',
        dim:      '#484F58',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '6px',  // nada maior que 6px
      },
      animation: {
        scan:  'scan 2s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        scan: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Criar `client/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Criar `client/index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SENTINEL — Maps Leads</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Verificar que o Vite inicia sem erros**

```bash
cd C:/Users/TEPA/maps-leads/client
npm run dev
```

Expected: `Local: http://localhost:5173/` (tela em branco ou erro de módulo — normal, ainda não há src/)

- [ ] **Step 8: Commit**

```bash
cd C:/Users/TEPA/maps-leads
git add client/
git commit -m "chore: scaffold React + Vite + Tailwind client app"
```

---

## Task 2: CSS Global + Design Tokens + Utils

**Files:**
- Create: `client/src/index.css`
- Create: `client/src/lib/utils.ts`

- [ ] **Step 1: Criar `client/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Fontes e Reset ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  background-color: #080B10;
  color: #E6EDF3;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ── Scrollbar Customizada ──────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0D1117; }
::-webkit-scrollbar-thumb { background: #30363D; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #484F58; }

/* ── Seleção de Texto ───────────────────────────────────────── */
::selection { background: rgba(240, 180, 41, 0.3); color: #E6EDF3; }

/* ── Utilitários Personalizados ─────────────────────────────── */
@layer utilities {
  /* Borda esquerda colorida — assinatura visual dos cards de status */
  .border-l-accent  { border-left: 2px solid #F0B429; }
  .border-l-green   { border-left: 2px solid #3FB950; }
  .border-l-cyan    { border-left: 2px solid #58A6FF; }
  .border-l-red     { border-left: 2px solid #F85149; }
  .border-l-dim     { border-left: 2px solid #484F58; }

  /* Progress bar com efeito scan */
  .progress-scan {
    background: linear-gradient(
      90deg,
      #92620A 0%,
      #F0B429 40%,
      #FFD97D 50%,
      #F0B429 60%,
      #92620A 100%
    );
    background-size: 200% 100%;
    animation: scan 1.8s linear infinite;
  }

  /* Número grande estilo terminal */
  .stat-number {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 2.5rem;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  /* Grid de noise sutil no fundo */
  .noise-bg {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  }

  /* Glow para elementos de destaque */
  .glow-accent { box-shadow: 0 0 12px rgba(240, 180, 41, 0.25); }
  .glow-green  { box-shadow: 0 0 12px rgba(63, 185, 80, 0.25); }
}

/* ── Animações ───────────────────────────────────────────────── */
@keyframes scan {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fadeIn {
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  0%   { opacity: 0; transform: translateX(-8px); }
  100% { opacity: 1; transform: translateX(0); }
}

.animate-fade-in  { animation: fadeIn 0.2s ease-out; }
.animate-slide-in { animation: slideIn 0.15s ease-out; }
```

- [ ] **Step 2: Criar `client/src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Combina classes Tailwind sem conflito */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata número de telefone para exibição: 5585999999999 → (85) 99999-9999 */
export function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  // Remove código de país 55
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

/** Formata data ISO para exibição amigável */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "dd/MM/yy HH:mm", { locale: ptBR });
  } catch {
    return '—';
  }
}

/** Formata data como "há X minutos/horas" */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return '—';
  }
}

/** Trunca string com ellipsis */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/** Formata milissegundos em "2m 34s" */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${rem}s`;
  return `${m}m ${rem}s`;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/index.css client/src/lib/utils.ts
git commit -m "feat: add global CSS design tokens and utility functions"
```

---

## Task 3: API Client + Tipos TypeScript

**Files:**
- Create: `client/src/lib/api.ts`

- [ ] **Step 1: Criar `client/src/lib/api.ts`**

```typescript
/**
 * API client — wrapper sobre fetch para todos os endpoints REST da API.
 * Todos os endpoints são relativos a /api (proxy Vite em dev, mesma origem em prod).
 */

// ── Tipos espelhando o backend ───────────────────────────────
export interface Contact {
  id: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  rating: string | null;
  category: string | null;
  messageSentWhatsapp: boolean;
  messageSentEmail: boolean;
  scrapedAt: string;
}

export interface ScrapeSession {
  id: string;
  query: string;
  location: string | null;
  maxResults: number;
  found: number;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'done' | 'error';
  contactIds: string[];
}

export interface Analytics {
  funnel: {
    total: number;
    withPhone: number;
    withEmail: number;
    waSent: number;
    emailSent: number;
  };
  fieldRates: {
    phone: number;
    email: number;
    website: number;
    category: number;
    rating: number;
  };
  topCategories: { name: string; count: number }[];
  sessionStats: {
    id: string;
    query: string;
    location: string | null;
    startedAt: string;
    status: string;
    found: number;
    withPhone: number;
    withEmail: number;
    durationMs: number | null;
  }[];
}

export interface AutomationConfig {
  enabled: boolean;
  query: string;
  location: string;
  maxResults: number;
  channel: 'whatsapp' | 'email' | 'both' | 'none';
  templateWhatsapp: string;
  templateEmail: string;
  hour: number;
  minute: number;
  timezone: string;
  delayMs: number;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunSummary: string | null;
}

// ── Helpers ───────────────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Contacts ────────────────────────────────────────────────
export const api = {
  contacts: {
    list:  ()   => request<Contact[]>('/contacts'),
    clear: ()   => request<{ success: boolean }>('/contacts', { method: 'DELETE' }),
    downloadUrl: () => '/api/contacts/download',
  },

  // ── History ───────────────────────────────────────────────
  history: {
    list: () => request<ScrapeSession[]>('/history'),
    contacts: (id: string) => request<Contact[]>(`/history/${id}/contacts`),
  },

  // ── Analytics ─────────────────────────────────────────────
  analytics: {
    get: () => request<Analytics>('/analytics'),
  },

  // ── Scrape ────────────────────────────────────────────────
  scrape: {
    start: (params: {
      query: string;
      location?: string;
      maxResults: number;
      extractEmails: boolean;
    }) => request<{ started: boolean }>('/scrape', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  },

  // ── Send ──────────────────────────────────────────────────
  send: {
    start: (params: {
      channel: 'whatsapp' | 'email';
      template: string;
      delayMs: number;
    }) => request<{ started: boolean }>('/send', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  },

  // ── Automation ────────────────────────────────────────────
  automation: {
    get:    ()                              => request<AutomationConfig>('/automation'),
    save:   (config: Partial<AutomationConfig>) => request<AutomationConfig>('/automation', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    runNow: () => request<{ started: boolean }>('/automation/run', { method: 'POST' }),
  },

  // ── Status ────────────────────────────────────────────────
  status: {
    get: () => request<{ status: 'idle' | 'scraping' | 'sending' }>('/status'),
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/api.ts
git commit -m "feat: add typed API client for all backend endpoints"
```

---

## Task 4: SSE Hook + React Query Setup + Entry Point

**Files:**
- Create: `client/src/hooks/useSSE.ts`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`

- [ ] **Step 1: Criar `client/src/hooks/useSSE.ts`**

```typescript
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
 * Retorna uma função `subscribe` para registrar handlers por tipo de evento.
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

  /** Registra um handler para um tipo de evento (ou '*' para todos) */
  const subscribe = useCallback((eventType: string, handler: SSEHandler) => {
    if (!handlers.current.has(eventType)) {
      handlers.current.set(eventType, new Set());
    }
    handlers.current.get(eventType)!.add(handler);

    // Retorna função de cleanup
    return () => handlers.current.get(eventType)?.delete(handler);
  }, []);

  return { subscribe };
}
```

- [ ] **Step 2: Criar `client/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // dados ficam "frescos" por 30s
      retry: 1,               // 1 retry em caso de erro de rede
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 3: Criar `client/src/App.tsx`**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { Leads }     from './pages/Leads';
import { Scrape }    from './pages/Scrape';
import { Send }      from './pages/Send';
import { Analytics } from './pages/Analytics';
import { History }   from './pages/History';
import { Automation } from './pages/Automation';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/"           element={<Dashboard />} />
        <Route path="/leads"      element={<Leads />} />
        <Route path="/scrape"     element={<Scrape />} />
        <Route path="/send"       element={<Send />} />
        <Route path="/analytics"  element={<Analytics />} />
        <Route path="/history"    element={<History />} />
        <Route path="/automation" element={<Automation />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: add SSE hook, React Query setup, and app routing"
```

---

## Task 5: Layout Shell — Sidebar + TopBar

**Files:**
- Create: `client/src/components/layout/Shell.tsx`
- Create: `client/src/components/layout/Sidebar.tsx`
- Create: `client/src/components/layout/TopBar.tsx`

- [ ] **Step 1: Criar `client/src/components/layout/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Database, Radar, Send, BarChart3,
  ClockHistory, Settings2, Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/leads',      icon: Database,         label: 'Leads'      },
  { to: '/scrape',     icon: Radar,            label: 'Scraping'   },
  { to: '/send',       icon: Send,             label: 'Disparar'   },
  { to: '/analytics',  icon: BarChart3,        label: 'Analytics'  },
  { to: '/history',    icon: ClockHistory,     label: 'Histórico'  },
  { to: '/automation', icon: Settings2,        label: 'Automação'  },
];

export function Sidebar() {
  return (
    <aside className="w-[200px] min-h-screen bg-card border-r border-border flex flex-col flex-shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <Zap size={18} className="text-accent" />
        <span className="font-display font-800 text-lg tracking-widest text-text uppercase">
          Sentinel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 w-full px-3 py-2.5 rounded text-sm font-medium transition-colors mb-0.5',
                isActive
                  ? 'bg-elevated text-accent border-l-accent border-l-2 pl-[10px]'
                  : 'text-muted hover:bg-elevated hover:text-text'
              )
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-dim text-xs font-mono">v2.0.0</p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Criar `client/src/components/layout/TopBar.tsx`**

```tsx
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
    // Marca como conectado assim que o primeiro evento chegar
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
      <h1 className="font-display font-700 text-base uppercase tracking-widest text-text">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* SSE connection indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-green' : 'bg-dim')} />
          {connected ? 'Live' : 'Conectando…'}
        </div>

        {/* Job status */}
        <div className={cn('flex items-center gap-1.5 text-xs font-mono', cfg.color)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Criar `client/src/components/layout/Shell.tsx`**

```tsx
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/leads':      'Leads',
  '/scrape':     'Scraping',
  '/send':       'Disparar',
  '/analytics':  'Analytics',
  '/history':    'Histórico',
  '/automation': 'Automação',
};

export function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Sentinel';

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6 noise-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar páginas placeholder para verificar o layout**

Crie os 7 arquivos de páginas com conteúdo mínimo:

`client/src/pages/Dashboard.tsx`:
```tsx
export function Dashboard() {
  return <div className="text-text font-display font-700 text-2xl uppercase tracking-widest">Dashboard</div>;
}
```

Repita o mesmo padrão (trocando o nome) para:
- `client/src/pages/Leads.tsx` → `export function Leads()`
- `client/src/pages/Scrape.tsx` → `export function Scrape()`
- `client/src/pages/Send.tsx` → `export function Send()`
- `client/src/pages/Analytics.tsx` → `export function Analytics()`
- `client/src/pages/History.tsx` → `export function History()`
- `client/src/pages/Automation.tsx` → `export function Automation()`

- [ ] **Step 5: Iniciar o servidor Express e o Vite dev server**

Terminal 1:
```bash
cd C:/Users/TEPA/maps-leads && npm start
```

Terminal 2:
```bash
cd C:/Users/TEPA/maps-leads/client && npm run dev
```

Acesse `http://localhost:5173` e confirme:
- Sidebar escura com logo "SENTINEL"
- TopBar com título da página
- Navegação entre páginas funciona
- Indicador SSE conecta (fica verde após 1-2s)

- [ ] **Step 6: Commit**

```bash
git add client/src/components/layout/ client/src/pages/
git commit -m "feat: add Shell layout with dark Sentinel sidebar and top bar"
```

---

## Task 6: Componentes UI Base

**Files:**
- Create: `client/src/components/ui/Card.tsx`
- Create: `client/src/components/ui/Button.tsx`
- Create: `client/src/components/ui/Badge.tsx`
- Create: `client/src/components/ui/Input.tsx`
- Create: `client/src/components/ui/Spinner.tsx`

- [ ] **Step 1: Criar `client/src/components/ui/Card.tsx`**

```tsx
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'amber' | 'green' | 'cyan' | 'red' | 'none';
}

const ACCENT_MAP = {
  amber: 'border-l-accent',
  green: 'border-l-green',
  cyan:  'border-l-cyan',
  red:   'border-l-red',
  none:  '',
};

export function Card({ children, className, accent = 'none' }: CardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-md p-4',
      accent !== 'none' && ACCENT_MAP[accent],
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-700 text-xs uppercase tracking-widest text-muted">
      {children}
    </h3>
  );
}
```

- [ ] **Step 2: Criar `client/src/components/ui/Button.tsx`**

```tsx
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}

const VARIANTS = {
  primary:   'bg-accent text-base font-medium hover:bg-accent/90 disabled:opacity-50',
  secondary: 'bg-elevated text-text border border-border hover:border-border-bright hover:bg-elevated/80',
  danger:    'bg-red/10 text-red border border-red/30 hover:bg-red/20',
  ghost:     'text-muted hover:text-text hover:bg-elevated',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-2 rounded transition-colors cursor-pointer',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Criar `client/src/components/ui/Badge.tsx`**

```tsx
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'amber' | 'cyan' | 'dim';
}

const VARS = {
  green: 'bg-green/10 text-green border-green/20',
  red:   'bg-red/10 text-red border-red/20',
  amber: 'bg-accent/10 text-accent border-accent/20',
  cyan:  'bg-cyan/10 text-cyan border-cyan/20',
  dim:   'bg-elevated text-dim border-border',
};

export function Badge({ children, variant = 'dim' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border',
      VARS[variant]
    )}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Criar `client/src/components/ui/Input.tsx`**

```tsx
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-mono text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'bg-elevated border border-border rounded px-3 py-2 text-sm text-text',
          'placeholder:text-dim focus:outline-none focus:border-accent/60 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      />
      {hint && <p className="text-xs text-dim">{hint}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Criar `client/src/components/ui/Spinner.tsx`**

```tsx
import { cn } from '../../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin text-accent', className ?? 'w-5 h-5')}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add client/src/components/ui/
git commit -m "feat: add base UI components (Card, Button, Badge, Input, Spinner)"
```

---

## Task 7: Dashboard Overview — StatCards + FunnelChart + LiveFeed

**Files:**
- Create: `client/src/components/dashboard/StatCard.tsx`
- Create: `client/src/components/dashboard/FunnelChart.tsx`
- Create: `client/src/components/dashboard/LiveFeed.tsx`
- Modify: `client/src/pages/Dashboard.tsx`

- [ ] **Step 1: Criar `client/src/components/dashboard/StatCard.tsx`**

```tsx
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'amber' | 'green' | 'cyan' | 'red' | 'none';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, accent = 'none', icon }: StatCardProps) {
  const textColor = {
    amber: 'text-accent',
    green: 'text-green',
    cyan:  'text-cyan',
    red:   'text-red',
    none:  'text-text',
  }[accent];

  return (
    <Card accent={accent} className="animate-fade-in">
      <div className="flex items-start justify-between mb-2">
        <p className="font-display font-700 text-xs uppercase tracking-widest text-muted">{label}</p>
        {icon && <span className={cn('opacity-60', textColor)}>{icon}</span>}
      </div>
      <p className={cn('stat-number', textColor)}>{value}</p>
      {sub && <p className="text-xs text-dim mt-1 font-mono">{sub}</p>}
    </Card>
  );
}
```

- [ ] **Step 2: Criar `client/src/components/dashboard/FunnelChart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import type { Analytics } from '../../lib/api';

interface FunnelChartProps { funnel: Analytics['funnel'] }

export function FunnelChart({ funnel }: FunnelChartProps) {
  const data = [
    { name: 'Total',    value: funnel.total,     color: '#7D8590' },
    { name: 'Telefone', value: funnel.withPhone,  color: '#58A6FF' },
    { name: 'Email',    value: funnel.withEmail,  color: '#3FB950' },
    { name: 'WA Sent',  value: funnel.waSent,     color: '#F0B429' },
    { name: 'Mail Sent',value: funnel.emailSent,  color: '#F0B429' },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Funil de Leads</CardTitle></CardHeader>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#7D8590', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: '#7D8590', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0D1117', border: '1px solid #21262D',
              borderRadius: 4, color: '#E6EDF3', fontSize: 12,
              fontFamily: 'JetBrains Mono',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

- [ ] **Step 3: Criar `client/src/components/dashboard/LiveFeed.tsx`**

```tsx
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
    return subscribe('*', (e) => {
      const item = eventToFeedItem(e);
      if (!item) return;
      setItems((prev) => [item, ...prev].slice(0, 50)); // mantém últimos 50
    });
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
```

- [ ] **Step 4: Implementar `client/src/pages/Dashboard.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { Database, Phone, Mail, Send } from 'lucide-react';
import { api } from '../lib/api';
import { StatCard }    from '../components/dashboard/StatCard';
import { FunnelChart } from '../components/dashboard/FunnelChart';
import { LiveFeed }    from '../components/dashboard/LiveFeed';
import { Spinner }     from '../components/ui/Spinner';

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: api.analytics.get,
    refetchInterval: 15_000, // atualiza a cada 15s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  const f = data?.funnel ?? { total: 0, withPhone: 0, withEmail: 0, waSent: 0, emailSent: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={f.total}
          icon={<Database size={16} />}
          accent="none"
        />
        <StatCard
          label="Com Telefone"
          value={f.withPhone}
          sub={f.total ? `${Math.round(f.withPhone / f.total * 100)}%` : '—'}
          icon={<Phone size={16} />}
          accent="cyan"
        />
        <StatCard
          label="Com Email"
          value={f.withEmail}
          sub={f.total ? `${Math.round(f.withEmail / f.total * 100)}%` : '—'}
          icon={<Mail size={16} />}
          accent="green"
        />
        <StatCard
          label="Mensagens Enviadas"
          value={f.waSent + f.emailSent}
          sub={`WA: ${f.waSent} | Email: ${f.emailSent}`}
          icon={<Send size={16} />}
          accent="amber"
        />
      </div>

      {/* Charts + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {data && <FunnelChart funnel={data.funnel} />}
        </div>
        <LiveFeed />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verificar o dashboard no browser**

Com os dois servidores rodando (`npm start` + `npm run dev`), acesse `http://localhost:5173`.
Deve mostrar os 4 stat cards (zerados) + gráfico de funil + feed ao vivo.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/dashboard/ client/src/pages/Dashboard.tsx
git commit -m "feat: implement dashboard overview with stat cards, funnel chart, and live feed"
```

---

## Task 8: Página de Leads — Tabela Completa com Filtros

**Files:**
- Create: `client/src/components/leads/LeadFilters.tsx`
- Create: `client/src/components/leads/LeadsTable.tsx`
- Modify: `client/src/pages/Leads.tsx`

- [ ] **Step 1: Criar `client/src/components/leads/LeadFilters.tsx`**

```tsx
import { Search, Phone, Mail, MessageCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export interface LeadFiltersState {
  search: string;
  hasPhone: boolean | null;
  hasEmail: boolean | null;
  sentWA: boolean | null;
}

interface LeadFiltersProps {
  filters: LeadFiltersState;
  onChange: (f: LeadFiltersState) => void;
  total: number;
  filtered: number;
}

function ToggleChip({
  active, onClick, children
}: { active: boolean | null; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors',
        active === true  && 'bg-green/10 text-green border-green/30',
        active === false && 'bg-red/10 text-red border-red/30',
        active === null  && 'text-muted border-border hover:border-border-bright hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

export function LeadFilters({ filters, onChange, total, filtered }: LeadFiltersProps) {
  const cycle = (val: boolean | null): boolean | null =>
    val === null ? true : val === true ? false : null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex-1 min-w-[200px] max-w-[320px]">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar por nome, telefone, email…"
            className={cn(
              'w-full bg-elevated border border-border rounded pl-8 pr-3 py-1.5 text-sm text-text',
              'placeholder:text-dim focus:outline-none focus:border-accent/60 transition-colors'
            )}
          />
        </div>
      </div>

      <ToggleChip active={filters.hasPhone} onClick={() => onChange({ ...filters, hasPhone: cycle(filters.hasPhone) })}>
        <Phone size={11} /> Telefone
      </ToggleChip>
      <ToggleChip active={filters.hasEmail} onClick={() => onChange({ ...filters, hasEmail: cycle(filters.hasEmail) })}>
        <Mail size={11} /> Email
      </ToggleChip>
      <ToggleChip active={filters.sentWA} onClick={() => onChange({ ...filters, sentWA: cycle(filters.sentWA) })}>
        <MessageCircle size={11} /> Enviado WA
      </ToggleChip>

      <span className="text-xs text-dim font-mono ml-auto">
        {filtered} / {total} leads
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Criar `client/src/components/leads/LeadsTable.tsx`**

```tsx
import { ExternalLink, Phone, Mail, Globe } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { type Contact } from '../../lib/api';
import { formatPhone, formatDate, truncate, cn } from '../../lib/utils';

interface LeadsTableProps { contacts: Contact[] }

export function LeadsTable({ contacts }: LeadsTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-dim text-4xl mb-3">◈</p>
        <p className="text-muted font-display font-700 uppercase tracking-widest text-sm">Nenhum lead encontrado</p>
        <p className="text-dim text-xs mt-1">Ajuste os filtros ou execute um scrape</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Negócio', 'Telefone', 'Email', 'Categoria', 'Rating', 'Status', 'Coletado'].map((h) => (
              <th key={h} className="text-left px-3 py-2 text-xs font-mono uppercase tracking-wider text-dim font-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c, i) => (
            <tr
              key={c.id}
              className={cn(
                'border-b border-border/50 transition-colors hover:bg-elevated/50 group',
                i % 2 === 0 ? 'bg-transparent' : 'bg-card/30'
              )}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-text font-medium">{truncate(c.businessName, 30)}</span>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer"
                       className="text-dim hover:text-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {c.address && <p className="text-dim text-xs mt-0.5">{truncate(c.address, 40)}</p>}
              </td>
              <td className="px-3 py-2.5">
                {c.phone
                  ? <span className="font-mono text-cyan text-xs flex items-center gap-1"><Phone size={11} />{formatPhone(c.phone)}</span>
                  : <span className="text-dim">—</span>
                }
              </td>
              <td className="px-3 py-2.5">
                {c.email
                  ? <span className="font-mono text-green text-xs flex items-center gap-1"><Mail size={11} />{truncate(c.email, 24)}</span>
                  : <span className="text-dim">—</span>
                }
              </td>
              <td className="px-3 py-2.5">
                {c.category
                  ? <Badge variant="cyan">{truncate(c.category, 20)}</Badge>
                  : <span className="text-dim">—</span>
                }
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-amber">
                {c.rating ?? '—'}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex gap-1">
                  {c.messageSentWhatsapp && <Badge variant="green">WA</Badge>}
                  {c.messageSentEmail    && <Badge variant="cyan">Mail</Badge>}
                  {!c.messageSentWhatsapp && !c.messageSentEmail && (
                    <Badge variant="dim">Novo</Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-xs font-mono text-dim">
                {formatDate(c.scrapedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Implementar `client/src/pages/Leads.tsx`**

```tsx
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { LeadsTable }                from '../components/leads/LeadsTable';
import { LeadFilters, type LeadFiltersState } from '../components/leads/LeadFilters';
import { Button }  from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export function Leads() {
  const qc = useQueryClient();
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: api.contacts.list,
  });

  const [filters, setFilters] = useState<LeadFiltersState>({
    search: '', hasPhone: null, hasEmail: null, sentWA: null,
  });

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return contacts.filter((c) => {
      if (q && ![c.businessName, c.phone ?? '', c.email ?? '', c.address ?? '']
        .some((v) => v.toLowerCase().includes(q))) return false;
      if (filters.hasPhone === true  && !c.phone)  return false;
      if (filters.hasPhone === false && c.phone)   return false;
      if (filters.hasEmail === true  && !c.email)  return false;
      if (filters.hasEmail === false && c.email)   return false;
      if (filters.sentWA   === true  && !c.messageSentWhatsapp) return false;
      if (filters.sentWA   === false && c.messageSentWhatsapp)  return false;
      return true;
    });
  }, [contacts, filters]);

  async function handleClear() {
    if (!confirm(`Apagar todos os ${contacts.length} leads? Esta ação não pode ser desfeita.`)) return;
    await api.contacts.clear();
    qc.invalidateQueries({ queryKey: ['contacts'] });
    qc.invalidateQueries({ queryKey: ['analytics'] });
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <LeadFilters
          filters={filters}
          onChange={setFilters}
          total={contacts.length}
          filtered={filtered.length}
        />
        <div className="flex gap-2 ml-4">
          <a href={api.contacts.downloadUrl()}>
            <Button variant="secondary" size="sm"><Download size={13} /> CSV</Button>
          </a>
          <Button variant="danger" size="sm" onClick={handleClear}>
            <Trash2 size={13} /> Limpar
          </Button>
        </div>
      </div>
      <LeadsTable contacts={filtered} />
    </div>
  );
}
```

- [ ] **Step 4: Verificar a tabela no browser**

Acesse `http://localhost:5173/leads`. Se já houver dados no CSV, a tabela deve carregar populada.
Confirme: filtros funcionam, download CSV, hover nas linhas ilumina corretamente.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/leads/ client/src/pages/Leads.tsx
git commit -m "feat: implement leads page with filterable, searchable table"
```

---

## Task 9: Página de Scrape — Formulário + Progresso Real-time

**Files:**
- Create: `client/src/components/scrape/ScrapeForm.tsx`
- Create: `client/src/components/scrape/ScrapeProgress.tsx`
- Modify: `client/src/pages/Scrape.tsx`

- [ ] **Step 1: Criar `client/src/components/scrape/ScrapeProgress.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useSSE } from '../../hooks/useSSE';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface PhaseState {
  phase: 'collect' | 'extract' | null;
  current: number;
  total: number;
}

interface ProgressState {
  isRunning: boolean;
  phase: PhaseState;
  lastLead: string | null;
  retries: { name: string; field: string }[];
  done: { count: number } | null;
  error: string | null;
}

export function ScrapeProgress() {
  const { subscribe } = useSSE();
  const [state, setState] = useState<ProgressState>({
    isRunning: false, phase: { phase: null, current: 0, total: 0 },
    lastLead: null, retries: [], done: null, error: null,
  });

  useEffect(() => {
    const unsubs = [
      subscribe('job:start', (e) => {
        if (e.type === 'job:start' && e.job === 'scrape') {
          setState({ isRunning: true, phase: { phase: null, current: 0, total: 0 },
            lastLead: null, retries: [], done: null, error: null });
        }
      }),
      subscribe('scrape:phase', (e) => {
        if (e.type === 'scrape:phase') {
          setState((s) => ({ ...s, phase: { phase: e.phase, current: e.current, total: e.total } }));
        }
      }),
      subscribe('scrape:progress', (e) => {
        if (e.type === 'scrape:progress') {
          setState((s) => ({ ...s, lastLead: e.name }));
        }
      }),
      subscribe('scrape:retry', (e) => {
        if (e.type === 'scrape:retry') {
          setState((s) => ({ ...s, retries: [{ name: e.name, field: e.field }, ...s.retries].slice(0, 5) }));
        }
      }),
      subscribe('scrape:done', (e) => {
        if (e.type === 'scrape:done') {
          setState((s) => ({ ...s, isRunning: false, done: { count: e.count } }));
        }
      }),
      subscribe('job:error', (e) => {
        if (e.type === 'job:error' && e.job === 'scrape') {
          setState((s) => ({ ...s, isRunning: false, error: e.message }));
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  if (!state.isRunning && !state.done && !state.error) return null;

  const pct = state.phase.total > 0
    ? Math.round((state.phase.current / state.phase.total) * 100)
    : 0;

  return (
    <Card accent={state.error ? 'red' : state.done ? 'green' : 'amber'} className="animate-fade-in">
      {/* Status header */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-700 text-xs uppercase tracking-widest text-muted">
          {state.error ? 'Erro' : state.done ? 'Concluído' : state.phase.phase === 'collect' ? 'Coletando URLs' : 'Extraindo detalhes'}
        </p>
        <span className={cn(
          'text-xs font-mono',
          state.error ? 'text-red' : state.done ? 'text-green' : 'text-accent'
        )}>
          {state.error ? '✖' : state.done ? `✔ ${state.done.count} leads` : `${state.phase.current}/${state.phase.total}`}
        </span>
      </div>

      {/* Progress bar */}
      {state.isRunning && (
        <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              pct < 100 ? 'progress-scan' : 'bg-green'
            )}
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      )}

      {/* Last lead */}
      {state.lastLead && (
        <p className="text-xs font-mono text-text truncate">◆ {state.lastLead}</p>
      )}

      {/* Error */}
      {state.error && (
        <p className="text-xs font-mono text-red">{state.error}</p>
      )}

      {/* Retries */}
      {state.retries.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {state.retries.map((r, i) => (
            <p key={i} className="text-xs font-mono text-accent">
              ↺ retry {r.field}: {r.name}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Criar `client/src/components/scrape/ScrapeForm.tsx`**

```tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Radar } from 'lucide-react';
import { api } from '../../lib/api';
import { Input }   from '../ui/Input';
import { Button }  from '../ui/Button';
import { Card, CardHeader, CardTitle } from '../ui/Card';

export function ScrapeForm() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    query: '', location: '', maxResults: 20, extractEmails: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.query.trim()) return;
    setLoading(true);
    try {
      await api.scrape.start({
        query: form.query.trim(),
        location: form.location.trim() || undefined,
        maxResults: form.maxResults,
        extractEmails: form.extractEmails,
      });
      // Refresca a lista de contatos quando o job terminar (monitorado via SSE no progresso)
      setTimeout(() => qc.invalidateQueries({ queryKey: ['contacts'] }), 2000);
    } catch (err) {
      alert(String(err));
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'maxResults' ? Number(e.target.value) : e.target.value }));

  return (
    <Card>
      <CardHeader><CardTitle>Novo Scrape</CardTitle></CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Categoria / Negócio"
          placeholder="ex: pizzaria, academia, cosméticos"
          value={form.query}
          onChange={set('query')}
          required
        />
        <Input
          label="Localização"
          placeholder="ex: Fortaleza, Ceará"
          value={form.location}
          onChange={set('location')}
          hint="Deixe vazio para usar a localização padrão do Maps"
        />
        <Input
          label="Máximo de resultados"
          type="number"
          min={5}
          max={200}
          value={form.maxResults}
          onChange={set('maxResults')}
        />

        {/* Toggle: extrair emails */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.extractEmails}
            onChange={(e) => setForm((f) => ({ ...f, extractEmails: e.target.checked }))}
            className="w-4 h-4 accent-amber-400"
          />
          <div>
            <p className="text-sm text-text">Extrair emails dos sites</p>
            <p className="text-xs text-dim">Mais lento — acessa o site de cada negócio</p>
          </div>
        </label>

        <Button type="submit" variant="primary" loading={loading} className="w-full justify-center">
          <Radar size={15} />
          {loading ? 'Iniciando…' : 'Iniciar Scrape'}
        </Button>
      </form>
    </Card>
  );
}
```

- [ ] **Step 3: Implementar `client/src/pages/Scrape.tsx`**

```tsx
import { ScrapeForm }     from '../components/scrape/ScrapeForm';
import { ScrapeProgress } from '../components/scrape/ScrapeProgress';

export function Scrape() {
  return (
    <div className="max-w-xl space-y-4 animate-fade-in">
      <ScrapeForm />
      <ScrapeProgress />
    </div>
  );
}
```

- [ ] **Step 4: Testar o fluxo completo de scrape**

1. Acesse `http://localhost:5173/scrape`
2. Preencha "pizzaria" + "Fortaleza" + 5 resultados
3. Clique em "Iniciar Scrape"
4. Confirme que a barra de progresso aparece e anima com o efeito scan
5. Confirme que o feed ao vivo no Dashboard recebe os eventos

- [ ] **Step 5: Commit**

```bash
git add client/src/components/scrape/ client/src/pages/Scrape.tsx
git commit -m "feat: implement scrape page with real-time animated progress"
```

---

## Task 10: Analytics Page — Gráficos de Yield + Top Categorias

**Files:**
- Create: `client/src/components/analytics/FieldRateBar.tsx`
- Create: `client/src/components/analytics/SessionStats.tsx`
- Create: `client/src/components/analytics/CategoryChart.tsx`
- Modify: `client/src/pages/Analytics.tsx`

- [ ] **Step 1: Criar `client/src/components/analytics/FieldRateBar.tsx`**

```tsx
import { cn } from '../../lib/utils';

interface FieldRateBarProps {
  label: string;
  rate: number;   // 0–100
  color?: string;
}

export function FieldRateBar({ label, rate, color = 'bg-cyan' }: FieldRateBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text w-10 text-right">{rate}%</span>
    </div>
  );
}
```

- [ ] **Step 2: Criar `client/src/components/analytics/CategoryChart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';

interface CategoryChartProps {
  data: { name: string; count: number }[];
}

const COLORS = ['#F0B429', '#58A6FF', '#3FB950', '#F85149', '#A371F7',
                '#79C0FF', '#56D364', '#FF7B72', '#D2A8FF', '#FFA657'];

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Top Categorias</CardTitle></CardHeader>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fill: '#7D8590', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            dataKey="name" type="category" width={120}
            tick={{ fill: '#7D8590', fontSize: 11, fontFamily: 'DM Sans' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0D1117', border: '1px solid #21262D',
              borderRadius: 4, color: '#E6EDF3', fontSize: 12,
              fontFamily: 'JetBrains Mono',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="count" radius={[0, 2, 2, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

- [ ] **Step 3: Criar `client/src/components/analytics/SessionStats.tsx`**

```tsx
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { formatDate, formatDuration } from '../../lib/utils';
import type { Analytics } from '../../lib/api';

interface SessionStatsProps {
  sessions: Analytics['sessionStats'];
}

export function SessionStats({ sessions }: SessionStatsProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Sessões Recentes</CardTitle></CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {['Query', 'Local', 'Encontrados', 'Telefone', 'Email', 'Yield', 'Duração', 'Data'].map(h => (
                <th key={h} className="text-left px-2 py-1.5 text-dim font-mono uppercase tracking-wider font-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const yield_pct = s.found > 0
                ? Math.round(((s.withPhone + s.withEmail) / (s.found * 2)) * 100) : 0;
              return (
                <tr key={s.id} className="border-b border-border/40 hover:bg-elevated/30 transition-colors">
                  <td className="px-2 py-2 text-text font-medium">{s.query}</td>
                  <td className="px-2 py-2 text-muted">{s.location ?? '—'}</td>
                  <td className="px-2 py-2 font-mono text-accent">{s.found}</td>
                  <td className="px-2 py-2 font-mono text-cyan">{s.withPhone}</td>
                  <td className="px-2 py-2 font-mono text-green">{s.withEmail}</td>
                  <td className="px-2 py-2">
                    <Badge variant={yield_pct > 60 ? 'green' : yield_pct > 30 ? 'amber' : 'red'}>
                      {yield_pct}%
                    </Badge>
                  </td>
                  <td className="px-2 py-2 font-mono text-muted">{formatDuration(s.durationMs)}</td>
                  <td className="px-2 py-2 font-mono text-dim">{formatDate(s.startedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Implementar `client/src/pages/Analytics.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FieldRateBar }  from '../components/analytics/FieldRateBar';
import { CategoryChart } from '../components/analytics/CategoryChart';
import { SessionStats }  from '../components/analytics/SessionStats';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

export function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: api.analytics.get,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!data) return <p className="text-muted">Sem dados ainda.</p>;

  const rates = [
    { label: 'Telefone', rate: data.fieldRates.phone,    color: 'bg-cyan'  },
    { label: 'Email',    rate: data.fieldRates.email,    color: 'bg-green' },
    { label: 'Website',  rate: data.fieldRates.website,  color: 'bg-cyan'  },
    { label: 'Categoria',rate: data.fieldRates.category, color: 'bg-accent' },
    { label: 'Rating',   rate: data.fieldRates.rating,   color: 'bg-accent' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Field coverage rates */}
        <Card>
          <CardHeader><CardTitle>Cobertura por Campo</CardTitle></CardHeader>
          <div className="space-y-3">
            {rates.map((r) => (
              <FieldRateBar key={r.label} {...r} />
            ))}
          </div>
        </Card>

        {/* Categories */}
        {data.topCategories.length > 0 && (
          <CategoryChart data={data.topCategories} />
        )}
      </div>

      {/* Session stats */}
      {data.sessionStats.length > 0 && (
        <SessionStats sessions={data.sessionStats} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/analytics/ client/src/pages/Analytics.tsx
git commit -m "feat: implement analytics page with charts and session yield stats"
```

---

## Task 11: Send, History e Automation Pages

**Files:**
- Modify: `client/src/pages/Send.tsx`
- Modify: `client/src/pages/History.tsx`
- Modify: `client/src/pages/Automation.tsx`

- [ ] **Step 1: Implementar `client/src/pages/Send.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send as SendIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useSSE } from '../hooks/useSSE';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge }  from '../components/ui/Badge';

export function Send() {
  const { subscribe } = useSSE();
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: api.contacts.list });
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [template, setTemplate] = useState('Olá {nome}! Encontrei seu negócio no Google Maps e tenho uma proposta para você.');
  const [delayMs, setDelayMs] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; sent: number; failed: number } | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribe('whatsapp:qr',  (e) => { if (e.type === 'whatsapp:qr')  setQrCode(e.qr); }),
      subscribe('whatsapp:ready',(e) => { if (e.type === 'whatsapp:ready') setQrCode(null); }),
      subscribe('send:progress', (e) => {
        if (e.type === 'send:progress') {
          setProgress((p) => ({
            current: e.current, total: e.total,
            sent:   (p?.sent   ?? 0) + (e.success ? 1 : 0),
            failed: (p?.failed ?? 0) + (e.success ? 0 : 1),
          }));
        }
      }),
      subscribe('send:done', (e) => {
        if (e.type === 'send:done') {
          setLoading(false);
          setProgress({ current: e.sent + e.failed, total: e.sent + e.failed, sent: e.sent, failed: e.failed });
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  const pending = contacts.filter(
    (c) => channel === 'whatsapp' ? (!c.messageSentWhatsapp && c.phone) : (!c.messageSentEmail && c.email)
  );

  const previewMessage = template.replace('{nome}', 'João Padaria');

  async function handleSend() {
    if (!pending.length) return;
    setLoading(true);
    setProgress(null);
    try {
      await api.send.start({ channel, template, delayMs });
    } catch (err) {
      alert(String(err));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4 animate-fade-in">
      <Card>
        <CardHeader><CardTitle>Canal</CardTitle></CardHeader>
        <div className="flex gap-2">
          {(['whatsapp', 'email'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
                channel === c ? 'bg-elevated border-accent text-accent' : 'bg-transparent border-border text-muted hover:text-text'
              }`}
            >
              {c === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
            </button>
          ))}
        </div>
        <p className="text-xs text-dim mt-2 font-mono">
          {pending.length} contatos pendentes de envio via {channel}
        </p>
      </Card>

      <Card>
        <CardHeader><CardTitle>Template</CardTitle></CardHeader>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={4}
          className="w-full bg-elevated border border-border rounded px-3 py-2 text-sm text-text placeholder:text-dim focus:outline-none focus:border-accent/60 resize-none font-mono"
          placeholder="Escreva a mensagem… Use {nome} para o nome do negócio."
        />
        <div className="mt-2 p-3 bg-base/60 border border-border/50 rounded">
          <p className="text-xs text-dim font-mono mb-1">Preview:</p>
          <p className="text-xs text-muted">{previewMessage}</p>
        </div>
      </Card>

      {channel === 'whatsapp' && (
        <div className="grid grid-cols-1 gap-2">
          <label className="text-xs font-mono text-muted uppercase tracking-wider">
            Delay entre mensagens (ms)
          </label>
          <input
            type="range" min={1000} max={10000} step={500}
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <p className="text-xs text-dim font-mono">{(delayMs / 1000).toFixed(1)}s entre cada mensagem</p>
        </div>
      )}

      {qrCode && (
        <Card accent="amber">
          <p className="text-xs text-accent font-mono mb-2">⊡ Escaneie o QR Code no WhatsApp:</p>
          <img src={qrCode} alt="WhatsApp QR" className="w-40 h-40 mx-auto" />
        </Card>
      )}

      {progress && (
        <Card accent={progress.failed > 0 ? 'amber' : 'green'}>
          <div className="flex gap-3 text-xs font-mono">
            <span className="text-green">✔ {progress.sent} enviados</span>
            {progress.failed > 0 && <span className="text-red">✖ {progress.failed} falhas</span>}
            <span className="text-muted ml-auto">{progress.current}/{progress.total}</span>
          </div>
          <div className="h-1 bg-elevated rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-green rounded-full transition-all"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
        </Card>
      )}

      <Button
        variant="primary"
        loading={loading}
        disabled={pending.length === 0}
        onClick={handleSend}
        className="w-full justify-center"
      >
        <SendIcon size={15} />
        {loading ? 'Enviando…' : `Disparar para ${pending.length} contatos`}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Implementar `client/src/pages/History.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDate, formatDuration } from '../lib/utils';

export function History() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: api.history.list,
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-dim text-4xl mb-3">◈</p>
        <p className="text-muted font-display font-700 uppercase tracking-widest text-sm">Nenhuma sessão ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {sessions.map((s) => {
        const ms = s.completedAt
          ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
          : null;
        return (
          <Card key={s.id} accent={s.status === 'done' ? 'green' : s.status === 'error' ? 'red' : 'amber'}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text font-medium">{s.query}</p>
                <p className="text-dim text-xs font-mono">{s.location ?? 'sem localização'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={s.status === 'done' ? 'green' : s.status === 'error' ? 'red' : 'amber'}>
                  {s.status}
                </Badge>
                <span className="font-display font-800 text-xl text-accent">{s.found}</span>
                <span className="text-xs text-dim">leads</span>
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-xs font-mono text-dim">
              <span>{formatDate(s.startedAt)}</span>
              {ms !== null && <span>⏱ {formatDuration(ms)}</span>}
              <span>max: {s.maxResults}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Implementar `client/src/pages/Automation.tsx`**

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Clock } from 'lucide-react';
import { api, type AutomationConfig } from '../lib/api';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Input }   from '../components/ui/Input';
import { Button }  from '../components/ui/Button';
import { Badge }   from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { timeAgo } from '../lib/utils';

export function Automation() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['automation'],
    queryFn: api.automation.get,
  });
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!data) return null;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const config: Partial<AutomationConfig> = {
      enabled:           fd.get('enabled') === 'on',
      query:             String(fd.get('query') ?? ''),
      location:          String(fd.get('location') ?? ''),
      maxResults:        Number(fd.get('maxResults')),
      hour:              Number(fd.get('hour')),
      minute:            Number(fd.get('minute')),
      channel:           fd.get('channel') as AutomationConfig['channel'],
      templateWhatsapp:  String(fd.get('templateWhatsapp') ?? ''),
      templateEmail:     String(fd.get('templateEmail') ?? ''),
      delayMs:           Number(fd.get('delayMs')) * 1000,
    };
    try {
      await api.automation.save(config);
      refetch();
    } catch (err) { alert(String(err)); }
    finally { setSaving(false); }
  }

  async function handleRun() {
    setRunning(true);
    try { await api.automation.runNow(); }
    catch (err) { alert(String(err)); }
    finally { setRunning(false); }
  }

  return (
    <div className="max-w-xl space-y-4 animate-fade-in">
      {/* Last run status */}
      {data.lastRunAt && (
        <Card accent={data.lastRunStatus === 'success' ? 'green' : 'red'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-muted uppercase tracking-wider">Último Run</p>
              <p className="text-sm text-text mt-0.5">{data.lastRunSummary ?? '—'}</p>
            </div>
            <div className="text-right">
              <Badge variant={data.lastRunStatus === 'success' ? 'green' : 'red'}>
                {data.lastRunStatus}
              </Badge>
              <p className="text-xs text-dim font-mono mt-1">{timeAgo(data.lastRunAt)}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Configuração de Automação</CardTitle></CardHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="enabled" defaultChecked={data.enabled} className="w-4 h-4 accent-amber-400" />
            <span className="text-sm text-text">Automação ativa</span>
          </label>

          <Input name="query" label="Categoria" defaultValue={data.query} placeholder="pizzaria" />
          <Input name="location" label="Localização" defaultValue={data.location} placeholder="Fortaleza, CE" />
          <Input name="maxResults" label="Máx. resultados" type="number" min={5} max={100} defaultValue={data.maxResults} />

          <div className="grid grid-cols-2 gap-3">
            <Input name="hour"   label="Hora"   type="number" min={0} max={23} defaultValue={data.hour} />
            <Input name="minute" label="Minuto" type="number" min={0} max={59} defaultValue={data.minute} />
          </div>

          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">Canal</label>
            <select
              name="channel"
              defaultValue={data.channel}
              className="w-full bg-elevated border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
            >
              <option value="none">Nenhum</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="both">Ambos</option>
            </select>
          </div>

          <Input name="templateWhatsapp" label="Template WhatsApp" defaultValue={data.templateWhatsapp} placeholder="Olá {nome}!" />
          <Input name="templateEmail"    label="Template Email"    defaultValue={data.templateEmail}    placeholder="Olá {nome}!" />
          <Input name="delayMs" label="Delay entre envios (segundos)" type="number" min={1} max={30} defaultValue={data.delayMs / 1000} />

          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1 justify-center">
              <Clock size={14} /> Salvar
            </Button>
            <Button type="button" variant="secondary" loading={running} onClick={handleRun}>
              <Play size={14} /> Rodar Agora
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/
git commit -m "feat: implement Send, History, and Automation pages"
```

---

## Task 12: Build de Produção — Express serve o client

**Files:**
- Modify: `src/web/server.ts`

- [ ] **Step 1: Verificar que o build do Vite funciona**

```bash
cd C:/Users/TEPA/maps-leads/client
npm run build
```

Expected: cria `src/web/public/` com `index.html`, `assets/` e outros arquivos estáticos.

- [ ] **Step 2: Atualizar `src/web/server.ts` para servir o client buildado**

Localize esta linha em `src/web/server.ts`:

```typescript
app.use(express.static(path.join(__dirname, 'public')));
```

Substitua por:

```typescript
// Em produção (ts-node a partir da raiz), __dirname é src/web.
// O build do Vite deposita os assets em src/web/public.
// Em dev, o Vite roda em :5173 com proxy — essa rota só importa em prod.
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback: qualquer rota não-API serve o index.html
// para que o React Router funcione em refresh direto na URL.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});
```

- [ ] **Step 3: Adicionar script de build integrado no package.json raiz**

Em `C:/Users/TEPA/maps-leads/package.json`, adicione dentro de `"scripts"`:

```json
"build:client": "cd client && npm run build",
"build": "npm run build:client && tsc"
```

- [ ] **Step 4: Testar o build completo em produção**

```bash
cd C:/Users/TEPA/maps-leads
npm run build:client
npm start
```

Acesse `http://localhost:3000`. Deve mostrar o dashboard SENTINEL servido pelo Express.
Confirme que `/api/contacts` ainda responde JSON normalmente.
Confirme que refresh em `http://localhost:3000/leads` não retorna 404.

- [ ] **Step 5: Commit final**

```bash
git add src/web/server.ts package.json
git commit -m "feat: integrate Vite client build into Express production server"
```

---

## Self-Review

### Cobertura de requisitos:

| Requisito | Task | Status |
|-----------|------|--------|
| Dashboard interativo | Task 7 | ✅ |
| Gráficos e analytics | Task 10 | ✅ |
| Tabela de leads filtráveis | Task 8 | ✅ |
| Scrape com progresso real-time | Task 9 | ✅ |
| Envio com QR Code e progresso | Task 11 | ✅ |
| Histórico de sessões | Task 11 | ✅ |
| Automação configurável | Task 11 | ✅ |
| Design distinto (não genérico) | Task 2 + 5 + 6 | ✅ |
| Escalável (componentes modulares) | Todo o plano | ✅ |
| Serve em produção sem dependências extras | Task 12 | ✅ |
| SSE real-time em todas as páginas | Task 4 + 9 + 11 | ✅ |

### Fora do escopo deste plano:
- Testes de componentes React (vitest + @testing-library/react) — plano próprio
- Responsividade mobile — este dashboard é desktop-first
- Dark/light mode toggle — desnecessário, tema fixo dark

### Scan de placeholders: nenhum encontrado.

### Consistência de tipos:
- `Contact`, `Analytics`, `AutomationConfig` definidos em `api.ts` (Task 3) e usados consistentemente em todos os componentes
- `SSEEvent` definido em `useSSE.ts` (Task 4) e consumido em `LiveFeed`, `ScrapeProgress`, `Send`
- `formatPhone`, `formatDate`, `timeAgo`, `formatDuration` definidos em `utils.ts` (Task 2) e usados em Tasks 8–11
