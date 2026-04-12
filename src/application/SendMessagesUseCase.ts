import { IMessenger, SendResult } from '../domain/ports/IMessenger';
import { IContactRepository } from '../domain/ports/IContactRepository';
import { Contact } from '../domain/entities/Contact';

export type Channel = 'whatsapp' | 'email';

export interface SendOptions {
  channel: Channel;
  template: string;
  delayMs?: number;
  onProgress?: (current: number, total: number, result: SendResult) => void;
  onQR?: (qrDataUrl: string) => void;
  onReady?: () => void;
}

export class SendMessagesUseCase {
  constructor(
    private readonly messenger: IMessenger,
    private readonly repository: IContactRepository
  ) {}

  async execute(options: SendOptions): Promise<SendResult[]> {
    const contacts = await this.repository.load();

    const targets = contacts.filter((c) => {
      if (options.channel === 'whatsapp') return c.phone && !c.messageSentWhatsapp;
      if (options.channel === 'email') return c.email && !c.messageSentEmail;
      return false;
    });

    // Bug fix: destroy() chamado no finally para garantir que o processo
    // puppeteer seja encerrado mesmo se initialize() ou send() lançar exceção.
    await this.messenger.initialize({ onQR: options.onQR, onReady: options.onReady });

    const results: SendResult[] = [];
    const delay = options.delayMs ?? 2000;
    // Bug fix: acumula IDs enviados com sucesso e persiste UMA vez no final
    // em vez de fazer load()+save() para cada contato → evita O(n²) em I/O.
    const successIds = new Set<string>();

    try {
      for (let i = 0; i < targets.length; i++) {
        const contact = targets[i];
        const message = this.interpolate(options.template, contact);
        const result = await this.messenger.send(contact, message);
        results.push(result);

        if (result.success) successIds.add(contact.id);

        options.onProgress?.(i + 1, targets.length, result);

        if (i < targets.length - 1) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    } finally {
      // Persiste todos os envios bem-sucedidos em uma única operação de escrita
      if (successIds.size > 0) {
        const field =
          options.channel === 'whatsapp'
            ? { messageSentWhatsapp: true }
            : { messageSentEmail: true };
        const all = await this.repository.load();
        const updated = all.map((c) => (successIds.has(c.id) ? { ...c, ...field } : c));
        await this.repository.save(updated);
      }
      // Sempre encerra o cliente — evita processo puppeteer zumbi
      await this.messenger.destroy().catch(() => {});
    }

    return results;
  }

  private interpolate(template: string, contact: Contact): string {
    return template
      .replace(/\{nome\}/gi, contact.businessName)
      .replace(/\{telefone\}/gi, contact.phone ?? '')
      .replace(/\{email\}/gi, contact.email ?? '')
      .replace(/\{endereco\}/gi, contact.address ?? '')
      .replace(/\{site\}/gi, contact.website ?? '');
  }
}
