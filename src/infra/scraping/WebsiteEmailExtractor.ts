/**
 * WebsiteEmailExtractor — motor leve com axios + cheerio
 *
 * Substituímos o Playwright aqui porque abrir um navegador headless completo
 * só para buscar um e-mail é extremamente custoso em CPU/memória.
 * axios faz requisições HTTP nativas, cheerio parseia o HTML em memória
 * sem renderizar JavaScript — ideal para sites estáticos de pequenos negócios.
 */

import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

// Regex para capturar emails válidos no texto bruto da página
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Domínios/sufixos que geram falsos positivos frequentes — ignoramos
const BLACKLIST = [
  'example.com', 'domain.com', 'sentry.io', 'wixpress.com',
  'schemas.org', 'w3.org', 'cloudflare.com', 'amazonaws.com',
  '.png', '.jpg', '.gif', '.svg', '.webp',
];

// Rotas de contato comuns que visitamos se a home não tiver email
const CONTACT_PATHS = [
  '/contato',
  '/contact',
  '/fale-conosco',
  '/sobre',
  '/about',
  '/quem-somos',
  '/atendimento',
  '/nossa-empresa',
];

// Configuração padrão do axios: timeout agressivo + headers de browser real
const AXIOS_CONFIG: AxiosRequestConfig = {
  timeout: 7000, // 7s — suficiente para sites lentos, não engargala o pipeline
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  },
  // Segue redirects automáticos (max 3 para não entrar em loops)
  maxRedirects: 3,
  // Não lança exceção em status 4xx/5xx — tratamos manualmente
  validateStatus: () => true,
};

export class WebsiteEmailExtractor {
  /**
   * Tenta extrair um e-mail do site do negócio.
   * Estratégia em 3 camadas:
   *   1. Parseia a home via axios+cheerio buscando <a href="mailto:...">
   *   2. Se não achar, faz regex no texto bruto da home
   *   3. Se ainda não achar, visita rotas de contato conhecidas
   */
  async extract(url: string): Promise<string | null> {
    try {
      const baseUrl = this.normalizeBase(url);

      // Camada 1 + 2: tenta na home page
      const homeEmail = await this.fetchAndParse(baseUrl);
      if (homeEmail) return homeEmail;

      // Camada 3: deep crawl nas rotas de contato
      for (const path of CONTACT_PATHS) {
        try {
          const contactEmail = await this.fetchAndParse(baseUrl + path);
          if (contactEmail) return contactEmail;
        } catch {
          // rota não existe — segue para a próxima sem explodir
        }
      }

      return null;
    } catch {
      // Site offline, timeout, SSL inválido — retorna null sem propagar erro
      return null;
    }
  }

  /**
   * Faz o request HTTP e parseia o HTML com cheerio buscando emails.
   * Retorna o primeiro email válido encontrado ou null.
   */
  private async fetchAndParse(url: string): Promise<string | null> {
    const response = await axios.get<string>(url, AXIOS_CONFIG);

    // Status 4xx/5xx provavelmente não tem conteúdo útil
    if (response.status >= 400) return null;

    const html = response.data;
    if (typeof html !== 'string' || html.length < 50) return null;

    const $ = cheerio.load(html);

    // Prioridade 1: links mailto explícitos — mais confiáveis
    let found: string | null = null;
    $('a[href^="mailto:"]').each((_, el) => {
      if (found) return; // já achou, para o loop
      const raw = $(el).attr('href')?.replace('mailto:', '').split('?')[0].trim().toLowerCase();
      if (raw && this.isValidEmail(raw)) {
        found = raw;
      }
    });
    if (found) return found;

    // Prioridade 2: regex no texto visível da página (sem scripts/estilos)
    // Remove scripts e styles para evitar capturar imports de CDN com @
    $('script, style, noscript').remove();
    const bodyText = $.root().text();
    const matches = bodyText.match(EMAIL_REGEX);

    if (matches) {
      const clean = matches.find((e) => this.isValidEmail(e));
      if (clean) return clean.toLowerCase();
    }

    return null;
  }

  /** Remove partes desnecessárias da URL para montar a base das rotas */
  private normalizeBase(url: string): string {
    try {
      const parsed = new URL(url);
      // Mantém apenas protocolo + hostname + porta (sem path/query)
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url.replace(/\/$/, '');
    }
  }

  /** Valida que o email não está na blacklist e tem formato mínimo */
  private isValidEmail(email: string): boolean {
    if (!email.includes('@') || !email.includes('.')) return false;
    return !BLACKLIST.some((b) => email.includes(b));
  }
}
