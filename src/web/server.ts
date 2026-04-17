import express from 'express';
import path from 'path';
import cron from 'node-cron';
import type { Response } from 'express';
import { apiRouter, setEventBus } from './routes/api';
import { AutomationRepository } from '../infra/storage/AutomationRepository';
import { runAutomationJob } from './jobRunner';
import { createAuthMiddleware } from './middleware/auth';

export class EventBus {
  private clients = new Set<Response>();

  addClient(res: Response): void {
    this.clients.add(res);
    res.on('close', () => this.clients.delete(res));
  }

  emit(type: string, data: Record<string, unknown> = {}): void {
    const payload = `data: ${JSON.stringify({ type, ...data })}\n\n`;
    this.clients.forEach((c) => c.write(payload));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cronTask: any = null;

export function restartCron(bus: EventBus): void {
  if (cronTask) { cronTask.destroy(); cronTask = null; }

  const config = AutomationRepository.load();
  if (!config.enabled || !config.query) return;

  const expr = `${config.minute} ${config.hour} * * *`;
  cronTask = cron.schedule(
    expr,
    () => { runAutomationJob(bus).catch(console.error); },
    { timezone: config.timezone }
  );

  console.log(
    `  [CRON] Agendado: "${config.query}" todo dia às ` +
    `${String(config.hour).padStart(2, '0')}:${String(config.minute).padStart(2, '0')} ` +
    `(${config.timezone})`
  );
}

export function createServer(port = 3000): Promise<void> {
  const app = express();
  const bus = new EventBus();

  app.use(express.json());

  const auth = createAuthMiddleware();
  if (auth) {
    app.use(auth);
    console.log('  [AUTH] Proteção por senha ativada.');
  }

  app.use(express.static(path.join(__dirname, 'public')));

  setEventBus(bus);
  app.use('/api', apiRouter);

  // SSE stream
  app.get('/api/events', (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    bus.addClient(res);
    const ping = setInterval(() => res.write(':ping\n\n'), 20000);
    res.on('close', () => clearInterval(ping));
  });

  // Start cron if already configured
  restartCron(bus);

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`\n  Maps Leads rodando em http://localhost:${port}\n`);
      resolve();
    });
  });
}
