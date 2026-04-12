import { Contact, ScrapeOptions } from '../entities/Contact';

export interface IScraper {
  scrape(options: ScrapeOptions): Promise<Contact[]>;
}
