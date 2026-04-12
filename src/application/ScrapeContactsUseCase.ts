import { IScraper } from '../domain/ports/IScraper';
import { IContactRepository } from '../domain/ports/IContactRepository';
import { Contact, ScrapeOptions } from '../domain/entities/Contact';

export class ScrapeContactsUseCase {
  constructor(
    private readonly scraper: IScraper,
    private readonly repository: IContactRepository
  ) {}

  async execute(options: ScrapeOptions): Promise<Contact[]> {
    const scraped = await this.scraper.scrape(options);

    // Deduplication against existing contacts
    const existing = await this.repository.load();
    const existingPhones = new Set(existing.map((c) => c.phone).filter(Boolean));
    const existingEmails = new Set(existing.map((c) => c.email).filter(Boolean));

    // Bug fix: deduplica também dentro do próprio batch (scraped pode conter
    // duplicatas se dois URLs do Maps apontavam para o mesmo estabelecimento).
    const batchPhones = new Set<string>();
    const batchEmails = new Set<string>();

    const unique = scraped.filter((c) => {
      if (c.phone && existingPhones.has(c.phone)) return false;
      if (c.email && existingEmails.has(c.email)) return false;
      // Verifica duplicata dentro do próprio batch
      if (c.phone && batchPhones.has(c.phone)) return false;
      if (c.email && batchEmails.has(c.email)) return false;
      // Marca como visto para os próximos do batch
      if (c.phone) batchPhones.add(c.phone);
      if (c.email) batchEmails.add(c.email);
      return true;
    });

    if (unique.length > 0) {
      await this.repository.save([...existing, ...unique]);
    }

    return unique;
  }
}
