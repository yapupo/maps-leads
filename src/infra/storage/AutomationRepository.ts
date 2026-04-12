import fs from 'fs';
import path from 'path';

export interface AutomationConfig {
  enabled: boolean;
  query: string;
  location: string;
  maxResults: number;
  hour: number;
  minute: number;
  timezone: string;
  channel: 'whatsapp' | 'email' | 'both' | 'none';
  templateWhatsapp: string;
  templateEmail: string;
  delayMs: number;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunSummary: string | null;
}

const DEFAULT: AutomationConfig = {
  enabled: false,
  query: '',
  location: '',
  maxResults: 30,
  hour: 9,
  minute: 0,
  timezone: 'America/Sao_Paulo',
  channel: 'whatsapp',
  templateWhatsapp: 'Olá {nome}!\n\nEncontramos seu negócio e gostaríamos de apresentar uma proposta especial. Podemos conversar? 😊',
  templateEmail: 'Proposta especial para {nome}\nOlá {nome},\n\nEncontramos seu negócio e gostaríamos de apresentar uma proposta personalizada.\n\nAguardamos seu retorno!',
  delayMs: 5000,
  lastRunAt: null,
  lastRunStatus: null,
  lastRunSummary: null,
};

const FILE = path.resolve('automation.json');

export const AutomationRepository = {
  load(): AutomationConfig {
    if (!fs.existsSync(FILE)) return { ...DEFAULT };
    try {
      return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
    } catch {
      return { ...DEFAULT };
    }
  },

  save(fields: Partial<AutomationConfig>): AutomationConfig {
    const updated = { ...this.load(), ...fields };
    fs.writeFileSync(FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  },
};
