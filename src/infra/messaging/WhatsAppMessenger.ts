import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { IMessenger, MessengerInitOptions, SendResult } from '../../domain/ports/IMessenger';
import { Contact } from '../../domain/entities/Contact';

const COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE ?? '55';

// Timeout máximo de inicialização: 3 minutos (scan de QR incluso)
const INIT_TIMEOUT_MS = 3 * 60 * 1000;

export class WhatsAppMessenger implements IMessenger {
  private client: Client;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'maps-leads' }),
      puppeteer: { headless: true, args: ['--no-sandbox'] },
    });
  }

  async initialize(options?: MessengerInitOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Bug fix: garantia de que resolve/reject só é chamado uma vez
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      // Timeout: se ready nunca disparar, rejeita em vez de pendurar para sempre
      const timer = setTimeout(() => {
        settle(() => reject(new Error('Timeout na inicialização do WhatsApp (3 min)')));
      }, INIT_TIMEOUT_MS);

      this.client.on('qr', async (qr: string) => {
        if (options?.onQR) {
          const dataUrl = await QRCode.toDataURL(qr, { width: 280 });
          options.onQR(dataUrl);
        }
      });

      // Bug fix: 'authenticated' NÃO chama onReady — só sinaliza sessão restaurada.
      // onReady só dispara UMA VEZ em 'ready', evitando toast duplicado.
      this.client.on('authenticated', () => {
        // sessão restaurada — aguarda 'ready' para confirmar cliente operacional
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

    try {
      const digits = contact.phone.replace(/\D/g, '').replace(/^0+/, '');
      const normalized = digits.startsWith(COUNTRY_CODE) ? digits : COUNTRY_CODE + digits;

      // getNumberId resolve o LID correto e valida se o número existe no WhatsApp
      const numberId = await this.client.getNumberId(normalized);

      if (!numberId) {
        return {
          contactId: contact.id,
          success: false,
          error: 'Número não encontrado no WhatsApp',
        };
      }

      await this.client.sendMessage(numberId._serialized, message);
      return { contactId: contact.id, success: true };
    } catch (err) {
      return {
        contactId: contact.id,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}
