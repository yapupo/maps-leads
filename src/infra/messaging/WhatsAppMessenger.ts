import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { IMessenger, MessengerInitOptions, SendResult } from '../../domain/ports/IMessenger';
import { Contact } from '../../domain/entities/Contact';

const COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE ?? '55';
const INIT_TIMEOUT_MS = 3 * 60 * 1000;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function isContextError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Execution context was destroyed') ||
    msg.includes('Protocol error') ||
    msg.includes('Target closed') ||
    msg.includes('Session closed')
  );
}

export class WhatsAppMessenger implements IMessenger {
  private client: Client;
  private ready = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'maps-leads' }),
      puppeteer: {
        headless: true,
        // --single-process e --no-zygote causam ProtocolError no Chromium — removidos.
        // --disable-dev-shm-usage evita crash por memória compartilhada insuficiente.
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
        protocolTimeout: 90_000,
      },
    });

    this.client.on('ready', () => { this.ready = true; });
    this.client.on('disconnected', () => { this.ready = false; });
  }

  async initialize(options?: MessengerInitOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const timer = setTimeout(() => {
        settle(() => reject(new Error('Timeout na inicialização do WhatsApp (3 min)')));
      }, INIT_TIMEOUT_MS);

      this.client.on('qr', async (qr: string) => {
        if (options?.onQR) {
          const dataUrl = await QRCode.toDataURL(qr, { width: 280 });
          options.onQR(dataUrl);
        }
      });

      this.client.on('ready', () => {
        clearTimeout(timer);
        settle(() => {
          options?.onReady?.();
          resolve();
        });
      });

      this.client.on('auth_failure', (msg: string) => {
        clearTimeout(timer);
        settle(() => reject(new Error(`Falha na autenticação WhatsApp: ${msg}`)));
      });

      this.client.initialize().catch((err) => {
        clearTimeout(timer);
        settle(() => reject(err));
      });
    });
  }

  async send(contact: Contact, message: string): Promise<SendResult> {
    if (!contact.phone) {
      return { contactId: contact.id, success: false, error: 'Sem telefone' };
    }

    // Aguarda até 10s se o cliente não estiver pronto (reconectando após reload)
    if (!this.ready) {
      for (let i = 0; i < 10; i++) {
        await sleep(1000);
        if (this.ready) break;
      }
      if (!this.ready) {
        return { contactId: contact.id, success: false, error: 'WhatsApp não está pronto' };
      }
    }

    return this.sendWithRetry(contact, message, 3);
  }

  private async sendWithRetry(contact: Contact, message: string, attempts: number): Promise<SendResult> {
    try {
      const digits = contact.phone!.replace(/\D/g, '').replace(/^0+/, '');
      const normalized = digits.startsWith(COUNTRY_CODE) ? digits : COUNTRY_CODE + digits;

      const numberId = await this.client.getNumberId(normalized);
      if (!numberId) {
        return { contactId: contact.id, success: false, error: 'Número não encontrado no WhatsApp' };
      }

      await this.client.sendMessage(numberId._serialized, message);
      return { contactId: contact.id, success: true };
    } catch (err) {
      if (isContextError(err) && attempts > 1) {
        const wait = (4 - attempts) * 3000; // 3s, 6s em retries progressivos
        console.warn(`[WHATSAPP] Context error para "${contact.businessName}", retry em ${wait / 1000}s (${attempts - 1} tentativa(s) restante(s))`);
        await sleep(wait);
        return this.sendWithRetry(contact, message, attempts - 1);
      }
      const msg = err instanceof Error ? err.message : String(err);
      return { contactId: contact.id, success: false, error: msg };
    }
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}
