import { Contact } from '../entities/Contact';

export interface IContactRepository {
  save(contacts: Contact[]): Promise<void>;
  load(): Promise<Contact[]>;
  update(id: string, fields: Partial<Contact>): Promise<void>;
  clear(): Promise<void>;
}
