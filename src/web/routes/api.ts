import { Router } from 'express';
import { EventBus, restartCron } from '../server';
import { ScrapeHistoryRepository } from '../../infra/storage/ScrapeHistoryRepository';
import { AutomationRepository } from '../../infra/storage/AutomationRepository';
import { state, repository, runScrapeJob, runSendJob, runAutomationJob } from '../jobRunner';
import { Channel } from '../../application/SendMessagesUseCase';
import { getTunnelUrl } from '../tunnel';
import fs from 'fs';

let bus: EventBus;

export function setEventBus(b: EventBus) { bus = b; }
export { runAutomationJob };

export const apiRouter = Router();

// ─── Status ──────────────────────────────────────────────────────────────────
apiRouter.get('/status', (_req, res) => res.json({ status: state.job }));

// ─── Tunnel URL ───────────────────────────────────────────────────────────────
apiRouter.get('/tunnel-url', (_req, res) => res.json({ url: getTunnelUrl() }));

// ─── Contacts ────────────────────────────────────────────────────────────────
apiRouter.get('/contacts', async (_req, res) => {
  try { res.json(await repository.load()); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

apiRouter.delete('/contacts', async (_req, res) => {
  try { await repository.clear(); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

apiRouter.get('/contacts/download', (_req, res) => {
  const fp = repository.getFilePath();
  if (!fs.existsSync(fp)) { res.status(404).json({ error: 'Arquivo não encontrado' }); return; }
  res.download(fp, 'contacts.csv');
});

// ─── History ─────────────────────────────────────────────────────────────────
apiRouter.get('/history', (_req, res) => res.json(ScrapeHistoryRepository.list()));

apiRouter.get('/history/:id/contacts', async (req, res) => {
  const session = ScrapeHistoryRepository.list().find((s) => s.id === req.params.id);
  if (!session) { res.status(404).json({ error: 'Sessão não encontrada' }); return; }
  const all = await repository.load();
  const ids = new Set(session.contactIds);
  res.json(all.filter((c) => ids.has(c.id)));
});

// ─── Analytics ───────────────────────────────────────────────────────────────
apiRouter.get('/analytics', async (_req, res) => {
  try {
    const contacts = await repository.load();
    const sessions = ScrapeHistoryRepository.list();

    const total       = contacts.length;
    const withPhone   = contacts.filter(c => c.phone).length;
    const withEmail   = contacts.filter(c => c.email).length;
    const withWebsite = contacts.filter(c => c.website).length;
    const withCat     = contacts.filter(c => c.category).length;
    const withRating  = contacts.filter(c => c.rating).length;
    const waSent      = contacts.filter(c => c.messageSentWhatsapp).length;
    const emailSent   = contacts.filter(c => c.messageSentEmail).length;

    // Mapa id → contato para enriquecer sessões
    const contactMap = new Map(contacts.map(c => [c.id, c]));

    // Stats por sessão: encontrados, com telefone, com email
    const sessionStats = sessions.map(s => {
      const sc = s.contactIds.map(cid => contactMap.get(cid)).filter(Boolean) as typeof contacts;
      const ms = s.completedAt
        ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
        : null;
      return {
        id:        s.id,
        query:     s.query,
        location:  s.location,
        startedAt: s.startedAt,
        status:    s.status,
        found:     s.found,
        withPhone: sc.filter(c => c.phone).length,
        withEmail: sc.filter(c => c.email).length,
        durationMs: ms,
      };
    });

    // Top 10 categorias por volume
    const catMap: Record<string, number> = {};
    contacts.forEach(c => { if (c.category) catMap[c.category] = (catMap[c.category] || 0) + 1; });
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    res.json({
      funnel: { total, withPhone, withEmail, waSent, emailSent },
      fieldRates: {
        phone:    total ? Math.round(withPhone   / total * 100) : 0,
        email:    total ? Math.round(withEmail   / total * 100) : 0,
        website:  total ? Math.round(withWebsite / total * 100) : 0,
        category: total ? Math.round(withCat     / total * 100) : 0,
        rating:   total ? Math.round(withRating  / total * 100) : 0,
      },
      topCategories,
      sessionStats,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Scrape ──────────────────────────────────────────────────────────────────
apiRouter.post('/scrape', async (req, res) => {
  if (state.job !== 'idle') { res.status(409).json({ error: 'Já existe um job em execução' }); return; }

  const { query, location, maxResults, extractEmails } = req.body;
  if (!query?.trim()) { res.status(400).json({ error: '"query" é obrigatório' }); return; }

  const parsedMax = parseInt(maxResults);
  if (isNaN(parsedMax) || parsedMax < 1 || parsedMax > 500) {
    res.status(400).json({ error: '"maxResults" deve ser um número entre 1 e 500' }); return;
  }

  if (location !== undefined && typeof location !== 'string') {
    res.status(400).json({ error: '"location" deve ser uma string' }); return;
  }

  res.json({ started: true });

  runScrapeJob(
    { query: query.trim(), location: location?.trim() || undefined, maxResults: parsedMax, extractEmails: Boolean(extractEmails) },
    bus
  );
});

// ─── Send ─────────────────────────────────────────────────────────────────────
apiRouter.post('/send', async (req, res) => {
  if (state.job !== 'idle') { res.status(409).json({ error: 'Já existe um job em execução' }); return; }

  const { channel, template, delayMs } = req.body;
  if (!channel || !template?.trim()) { res.status(400).json({ error: '"channel" e "template" são obrigatórios' }); return; }

  const validChannels: Channel[] = ['whatsapp', 'email'];
  if (!validChannels.includes(channel as Channel)) {
    res.status(400).json({ error: `"channel" deve ser "whatsapp" ou "email"` }); return;
  }

  const parsedDelay = parseInt(delayMs);
  const safeDelay = isNaN(parsedDelay) ? 3000 : Math.min(Math.max(parsedDelay, 500), 30000);

  res.json({ started: true });

  runSendJob({ channel: channel as Channel, template: template.trim(), delayMs: safeDelay }, bus);
});

// ─── Automation ───────────────────────────────────────────────────────────────
apiRouter.get('/automation', (_req, res) => res.json(AutomationRepository.load()));

apiRouter.post('/automation', (req, res) => {
  try {
    const config = AutomationRepository.save(req.body);
    restartCron(bus);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.post('/automation/run', async (req, res) => {
  if (state.job !== 'idle') { res.status(409).json({ error: 'Já existe um job em execução' }); return; }
  res.json({ started: true });
  runAutomationJob(bus);
});
