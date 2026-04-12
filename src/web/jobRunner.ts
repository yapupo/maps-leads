import { EventBus } from './server';
import { GoogleMapsScraper } from '../infra/scraping/GoogleMapsScraper';
import { CsvContactRepository } from '../infra/storage/CsvContactRepository';
import { WhatsAppMessenger } from '../infra/messaging/WhatsAppMessenger';
import { EmailMessenger } from '../infra/messaging/EmailMessenger';
import { ScrapeContactsUseCase } from '../application/ScrapeContactsUseCase';
import { SendMessagesUseCase, Channel } from '../application/SendMessagesUseCase';
import { ScrapeHistoryRepository } from '../infra/storage/ScrapeHistoryRepository';
import { AutomationRepository } from '../infra/storage/AutomationRepository';

export type JobStatus = 'idle' | 'scraping' | 'sending';

// Shared mutable state
export const state = { job: 'idle' as JobStatus };

const repository = new CsvContactRepository();

export { repository };

// ─── Scrape Job ──────────────────────────────────────────────────────────────

export interface ScrapeParams {
  query: string;
  location?: string;
  maxResults: number;
  extractEmails: boolean;
}

export async function runScrapeJob(params: ScrapeParams, bus: EventBus): Promise<string[]> {
  const session = ScrapeHistoryRepository.create({
    query: params.query,
    location: params.location ?? null,
    maxResults: params.maxResults,
  });

  state.job = 'scraping';
  bus.emit('job:start', { job: 'scrape', sessionId: session.id });

  try {
    const useCase = new ScrapeContactsUseCase(new GoogleMapsScraper(), repository);

    const contacts = await useCase.execute({
      query: params.query,
      location: params.location,
      maxResults: params.maxResults,
      extractEmailsFromWebsite: params.extractEmails,
      onProgress: (current, name) => {
        bus.emit('scrape:progress', { current, max: params.maxResults, name });
      },
      onPhase: (phase, current, total) => {
        bus.emit('scrape:phase', { phase, current, total });
      },
      onRetry: (businessName, field) => {
        bus.emit('scrape:retry', { name: businessName, field });
      },
    });

    const ids = contacts.map((c) => c.id);
    ScrapeHistoryRepository.complete(session.id, ids);
    bus.emit('scrape:done', { count: contacts.length, sessionId: session.id });
    return ids;
  } catch (err) {
    const msg = String(err);
    ScrapeHistoryRepository.fail(session.id, msg);
    bus.emit('job:error', { job: 'scrape', message: msg });
    return [];
  } finally {
    state.job = 'idle';
    bus.emit('job:idle', {});
  }
}

// ─── Send Job ─────────────────────────────────────────────────────────────────

export interface SendParams {
  channel: Channel;
  template: string;
  delayMs: number;
}

export async function runSendJob(params: SendParams, bus: EventBus): Promise<void> {
  state.job = 'sending';
  bus.emit('job:start', { job: 'send', channel: params.channel });

  try {
    const messenger =
      params.channel === 'whatsapp' ? new WhatsAppMessenger() : new EmailMessenger();
    const useCase = new SendMessagesUseCase(messenger, repository);

    const results = await useCase.execute({
      channel: params.channel,
      template: params.template,
      delayMs: params.delayMs,
      onQR: (qr) => bus.emit('whatsapp:qr', { qr }),
      onReady: () => bus.emit('whatsapp:ready', {}),
      onProgress: (current, total, result) => {
        bus.emit('send:progress', { current, total, success: result.success, error: result.error ?? null });
      },
    });

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    bus.emit('send:done', { sent, failed });
  } catch (err) {
    bus.emit('job:error', { job: 'send', message: String(err) });
  } finally {
    state.job = 'idle';
    bus.emit('job:idle', {});
  }
}

// ─── Automation Job (scrape → send) ──────────────────────────────────────────

export async function runAutomationJob(bus: EventBus): Promise<void> {
  if (state.job !== 'idle') {
    console.log('[CRON] Pulando execução — outro job em andamento.');
    return;
  }

  const config = AutomationRepository.load();
  if (!config.query) return;

  bus.emit('automation:start', { at: new Date().toISOString() });

  try {
    // 1. Scrape
    await runScrapeJob(
      {
        query: config.query,
        location: config.location || undefined,
        maxResults: config.maxResults,
        extractEmails: false,
      },
      bus
    );

    // 2. Send to pending contacts
    const channels: Channel[] =
      config.channel === 'both'
        ? ['whatsapp', 'email']
        : config.channel === 'none'
        ? []
        : [config.channel as Channel];

    for (const ch of channels) {
      const template = ch === 'whatsapp' ? config.templateWhatsapp : config.templateEmail;
      await runSendJob({ channel: ch, template, delayMs: config.delayMs }, bus);
    }

    AutomationRepository.save({
      lastRunAt: new Date().toISOString(),
      lastRunStatus: 'success',
      lastRunSummary: `Raspagem + envio via ${config.channel} concluídos`,
    });

    bus.emit('automation:done', { status: 'success' });
  } catch (err) {
    AutomationRepository.save({
      lastRunAt: new Date().toISOString(),
      lastRunStatus: 'error',
      lastRunSummary: String(err),
    });
    bus.emit('automation:done', { status: 'error', message: String(err) });
  }
}
