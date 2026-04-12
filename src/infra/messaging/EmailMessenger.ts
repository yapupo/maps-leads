import nodemailer from 'nodemailer';
import { IMessenger, MessengerInitOptions, SendResult } from '../../domain/ports/IMessenger';
import { Contact } from '../../domain/entities/Contact';

export class EmailMessenger implements IMessenger {
  private transporter!: nodemailer.Transporter;

  async initialize(_options?: MessengerInitOptions): Promise<void> {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT ?? '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await this.transporter.verify();
  }

  async send(contact: Contact, message: string): Promise<SendResult> {
    if (!contact.email) {
      return { contactId: contact.id, success: false, error: 'Sem email' };
    }
    try {
      const [subject, ...bodyLines] = message.split('\n');
      const body = bodyLines.join('\n') || message;
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: contact.email,
        subject: subject.trim(),
        text: body.trim(),
      });
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
    this.transporter.close();
  }
}
