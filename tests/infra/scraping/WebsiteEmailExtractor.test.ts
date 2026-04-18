import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { WebsiteEmailExtractor } from '../../../src/infra/scraping/WebsiteEmailExtractor';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('WebsiteEmailExtractor', () => {
  let extractor: WebsiteEmailExtractor;

  beforeEach(() => {
    extractor = new WebsiteEmailExtractor();
    vi.clearAllMocks();
  });

  it('extrai email de link mailto na home', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      status: 200,
      data: '<html><body><a href="mailto:contato@loja.com.br">Fale conosco</a></body></html>',
    });
    const result = await extractor.extract('https://loja.com.br');
    expect(result).toBe('contato@loja.com.br');
  });

  it('extrai email via regex quando não há mailto', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      status: 200,
      data: '<html><body><p>Contato: vendas@empresa.com.br</p></body></html>',
    });
    const result = await extractor.extract('https://empresa.com.br');
    expect(result).toBe('vendas@empresa.com.br');
  });

  it('tenta rota /contato se home não tiver email', async () => {
    mockedAxios.get = vi.fn()
      .mockResolvedValueOnce({ status: 200, data: '<html><body>Sem email</body></html>' })
      .mockResolvedValueOnce({ status: 200, data: '<html><body><a href="mailto:oi@loja.com">email</a></body></html>' });
    const result = await extractor.extract('https://loja.com');
    expect(result).toBe('oi@loja.com');
  });

  it('retorna null quando site retorna 404', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ status: 404, data: 'Not Found' });
    const result = await extractor.extract('https://loja.com');
    expect(result).toBeNull();
  });

  it('retorna null quando site faz timeout', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('timeout of 7000ms exceeded'));
    const result = await extractor.extract('https://loja.com');
    expect(result).toBeNull();
  });

  it('ignora emails de domínios da blacklist', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      status: 200,
      data: '<html><body>noreply@sentry.io e algo@example.com</body></html>',
    });
    const result = await extractor.extract('https://loja.com');
    expect(result).toBeNull();
  });
});
