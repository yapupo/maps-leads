import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ScrapeSession {
  id: string;
  query: string;
  location: string | null;
  maxResults: number;
  found: number;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'done' | 'error';
  error?: string;
  contactIds: string[];
}

const FILE = path.resolve('scrape-history.json');

function read(): ScrapeSession[] {
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function write(sessions: ScrapeSession[]): void {
  fs.writeFileSync(FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

export const ScrapeHistoryRepository = {
  create(params: Pick<ScrapeSession, 'query' | 'location' | 'maxResults'>): ScrapeSession {
    const session: ScrapeSession = {
      id: uuidv4(),
      ...params,
      found: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      contactIds: [],
    };
    const sessions = read();
    sessions.unshift(session);
    write(sessions);
    return session;
  },

  complete(id: string, contactIds: string[]): void {
    const sessions = read();
    const s = sessions.find((s) => s.id === id);
    if (s) {
      s.status = 'done';
      s.found = contactIds.length;
      s.contactIds = contactIds;
      s.completedAt = new Date().toISOString();
      write(sessions);
    }
  },

  fail(id: string, error: string): void {
    const sessions = read();
    const s = sessions.find((s) => s.id === id);
    if (s) {
      s.status = 'error';
      s.error = error;
      s.completedAt = new Date().toISOString();
      write(sessions);
    }
  },

  list(): ScrapeSession[] {
    return read();
  },
};
