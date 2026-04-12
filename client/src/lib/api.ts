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
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API Object ────────────────────────────────────────────────
export const api = {
  contacts: {
    list:  ()   => request<Contact[]>('/contacts'),
    clear: ()   => request<{ success: boolean }>('/contacts', { method: 'DELETE' }),
    downloadUrl: () => '/api/contacts/download',
  },

  history: {
    list: () => request<ScrapeSession[]>('/history'),
    contacts: (id: string) => request<Contact[]>(`/history/${id}/contacts`),
  },

  analytics: {
    get: () => request<Analytics>('/analytics'),
  },

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

  automation: {
    get:    ()                              => request<AutomationConfig>('/automation'),
    save:   (config: Partial<AutomationConfig>) => request<AutomationConfig>('/automation', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    runNow: () => request<{ started: boolean }>('/automation/run', { method: 'POST' }),
  },

  status: {
    get: () => request<{ status: 'idle' | 'scraping' | 'sending' }>('/status'),
  },
};
