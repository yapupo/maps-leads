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

export interface ScrapeOptions {
  query: string;
  location?: string;
  maxResults: number;
  extractEmailsFromWebsite: boolean;
  onProgress?: (current: number, name: string) => void;
  onPhase?: (phase: 'collect' | 'extract', current: number, total: number) => void;
  /** Chamado quando um campo falha na primeira tentativa e entra em retry */
  onRetry?: (businessName: string, field: string) => void;
}

export interface MessageTemplate {
  body: string;
}
