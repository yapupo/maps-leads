import { Contact } from '../entities/Contact';

export interface MessengerInitOptions {
  onQR?: (qrDataUrl: string) => void;
  onReady?: () => void;
}

export interface SendResult {
  contactId: string;
  success: boolean;
  error?: string;
}

export interface IMessenger {
  initialize(options?: MessengerInitOptions): Promise<void>;
  send(contact: Contact, message: string): Promise<SendResult>;
  destroy(): Promise<void>;
}
