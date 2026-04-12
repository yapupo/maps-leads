import fs from 'fs';
import path from 'path';
import { IContactRepository } from '../../domain/ports/IContactRepository';
import { Contact } from '../../domain/entities/Contact';

const HEADERS: (keyof Contact)[] = [
  'id',
  'businessName',
  'phone',
  'email',
  'website',
  'address',
  'rating',
  'category',
  'messageSentWhatsapp',
  'messageSentEmail',
  'scrapedAt',
];

export class CsvContactRepository implements IContactRepository {
  private readonly filePath: string;

  constructor(filePath: string = process.env.CSV_FILE ?? 'contacts.csv') {
    this.filePath = path.resolve(filePath);
  }

  getFilePath(): string {
    return this.filePath;
  }

  async save(contacts: Contact[]): Promise<void> {
    const rows = [
      HEADERS.join(','),
      ...contacts.map((c) =>
        HEADERS.map((h) => this.escape(String(c[h] ?? ''))).join(',')
      ),
    ];
    const content = rows.join('\n');
    // Bug fix: escrita atômica — escreve em arquivo temporário e renomeia.
    // Evita corrupção do CSV se o processo cair no meio da escrita.
    const tmp = this.filePath + '.tmp';
    fs.writeFileSync(tmp, content, 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  async load(): Promise<Contact[]> {
    if (!fs.existsSync(this.filePath)) return [];

    const content = fs.readFileSync(this.filePath, 'utf8').trim();
    if (!content) return [];

    // Bug fix: não usa split('\n') diretamente porque campos CSV podem conter
    // quebras de linha embutidas entre aspas. Usa o parser de linhas completas.
    const allLines = this.splitCsvLines(content);
    if (allLines.length <= 1) return [];

    return allLines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      const obj: Record<string, unknown> = {};
      HEADERS.forEach((header, i) => {
        const val = values[i] ?? '';
        if (header === 'messageSentWhatsapp' || header === 'messageSentEmail') {
          obj[header] = val === 'true';
        } else {
          obj[header] = val === '' ? null : val;
        }
      });
      return obj as unknown as Contact;
    });
  }

  async update(id: string, fields: Partial<Contact>): Promise<void> {
    const contacts = await this.load();
    const updated = contacts.map((c) => (c.id === id ? { ...c, ...fields } : c));
    await this.save(updated);
  }

  async clear(): Promise<void> {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }

  private escape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Divide o conteúdo CSV em linhas lógicas respeitando campos entre aspas.
   * Um campo como "Rua X\nAndar 2" (com newline) não deve ser dividido.
   */
  private splitCsvLines(content: string): string[] {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      if (ch === '"') {
        if (inQuotes && content[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
        current += ch;
      } else if (ch === '\n' && !inQuotes) {
        lines.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
