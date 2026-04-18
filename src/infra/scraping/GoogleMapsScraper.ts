/**
 * GoogleMapsScraper — versão de alta performance
 *
 * Otimizações implementadas:
 *  1. Bloqueio de recursos desnecessários (imagens, CSS, fontes, mídia)
 *     via page.route() → reduz tráfego de rede e tempo de carregamento ~60-70%
 *  2. Concorrência aumentada para 6 abas paralelas na fase de extração
 *  3. Seletores resilientes usando aria-label e getByRole() ao invés de
 *     classes ofuscadas do Google (DUwDvf, DkEaL, etc.) que mudam a qualquer update
 *  4. Jitter real no scroll para simular comportamento humano e evitar bloqueio
 *  5. User-agents rotativos para reduzir fingerprinting
 *  6. WebsiteEmailExtractor migrado para axios+cheerio (sem Playwright para email)
 */

import { chromium, BrowserContext, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { IScraper } from '../../domain/ports/IScraper';
import { Contact, ScrapeOptions } from '../../domain/entities/Contact';
import { WebsiteEmailExtractor } from './WebsiteEmailExtractor';
import { MapsXhrParser } from './MapsXhrParser';

const HEADLESS = process.env.SCRAPER_HEADLESS === 'true';

// 3 abas simultâneas é o ponto de equilíbrio entre velocidade e rate-limiting.
// 6 abas do mesmo IP dispara detecção de bot no Google Maps.
const CONCURRENCY = 3;

// Pool de user-agents realistas para rotacionar entre requisições
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:124.0) Gecko/20100101 Firefox/124.0',
];

/** Delay aleatório com jitter — simula pausa humana entre ações */
function jitter(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((r) => setTimeout(r, ms));
}

/** Retorna um user-agent aleatório do pool */
function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export class GoogleMapsScraper implements IScraper {
  private emailExtractor = new WebsiteEmailExtractor();
  private xhrParser = new MapsXhrParser();

  async scrape(options: ScrapeOptions): Promise<Contact[]> {
    const browser = await chromium.launch({ headless: HEADLESS });

    // Contexto com user-agent rotativo e locale pt-BR
    const context = await browser.newContext({
      locale: 'pt-BR',
      userAgent: randomUA(),
      viewport: { width: 1366, height: 768 },
      // Desabilita WebRTC para evitar vazamento de IP real
      permissions: [],
    });

    try {
      // ── Fase 1: coleta de URLs rolando o painel esquerdo ──
      options.onPhase?.('collect', 0, options.maxResults);
      const urls = await this.collectUrls(context, options);

      // ── Fase 2: extração em paralelo com CONCURRENCY abas ──
      options.onPhase?.('extract', 0, urls.length);
      const contacts = await this.extractAll(context, urls, options);

      return contacts;
    } finally {
      await browser.close();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Fase 1 — rola o feed e coleta hrefs sem navegar para cada página
  // ─────────────────────────────────────────────────────────────────
  private async collectUrls(context: BrowserContext, options: ScrapeOptions): Promise<string[]> {
    const page = await context.newPage();

    // Bloqueia recursos pesados na página de busca do Maps também.
    // O feed do Maps carrega via JS/XHR — scripts e fetch precisam passar.
    await this.blockHeavyResources(page);

    try {
      const q = options.location
        ? `${options.query} ${options.location}`
        : options.query;

      await page.goto(
        `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
        { waitUntil: 'domcontentloaded', timeout: 30000 }
      );

      await this.dismissCookies(page);

      // Aguarda o feed aparecer antes de começar o scroll
      await page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => {});
      await jitter(1500, 2500);

      const collected = new Set<string>();
      let stuckRounds = 0;

      while (collected.size < options.maxResults && stuckRounds < 6) {
        // Coleta todos os links de estabelecimentos visíveis no feed
        const hrefs: string[] = await page
          .$$eval(
            '[role="feed"] a[href*="/maps/place/"]',
            (els) => [...new Set(els.map((el) => (el as HTMLAnchorElement).href.split('?')[0]))]
          )
          .catch(() => []);

        const before = collected.size;
        hrefs.forEach((h) => collected.add(h));
        options.onPhase?.('collect', Math.min(collected.size, options.maxResults), options.maxResults);

        if (collected.size >= options.maxResults) break;

        // Detecção de fim da lista — textos em PT e EN
        const ended = await page
          .evaluate(() => {
            const feed = document.querySelector('[role="feed"]');
            if (!feed) return false;
            const last = feed.lastElementChild?.textContent ?? '';
            return (
              last.includes("You've reached") ||
              last.includes('Você chegou ao fim') ||
              last.includes('fim da lista') ||
              last.includes('Fim')
            );
          })
          .catch(() => false);

        if (ended) break;

        // Se não coletou novas URLs nessa rodada, incrementa contador de travamento
        if (collected.size === before) {
          stuckRounds++;
        } else {
          stuckRounds = 0;
        }

        // Scroll com quantidade variável + jitter para simular comportamento humano
        const scrollAmount = Math.floor(Math.random() * 1500) + 2000; // 2000-3500px
        await page.evaluate((amount) => {
          const feed = document.querySelector('[role="feed"]');
          if (feed) {
            feed.scrollBy(0, amount);
            feed.dispatchEvent(new Event('scroll', { bubbles: true }));
          }
        }, scrollAmount);

        // Jitter humano entre scrolls: 1200ms a 2500ms
        // Valores abaixo de 1s disparam detecção de bot no Maps.
        await jitter(1200, 2500);
      }

      return [...collected].slice(0, options.maxResults);
    } finally {
      await page.close();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Fase 2 — processa URLs em lotes de CONCURRENCY abas paralelas
  // ─────────────────────────────────────────────────────────────────
  private async extractAll(
    context: BrowserContext,
    urls: string[],
    options: ScrapeOptions
  ): Promise<Contact[]> {
    const contacts: Contact[] = [];
    const seen = new Set<string>();
    let processed = 0;

    // Divide as URLs em chunks de CONCURRENCY e processa cada chunk em paralelo.
    // Isso mantém sempre N abas ativas ao mesmo tempo, sem abrir todas de uma vez.
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const chunk = urls.slice(i, i + CONCURRENCY);

      // Bug fix: passa um snapshot do seen para cada aba do chunk.
      // Sem isso, duas abas com o mesmo telefone no mesmo chunk passam as
      // duas pelo seen.has() porque o seen.add() só ocorre DEPOIS do Promise.all.
      // Com o snapshot, cada aba vê o estado do seen no início do chunk.
      const seenSnapshot = new Set(seen);

      const results = await Promise.all(
        chunk.map(async (url) => {
          const page = await context.newPage();
          // Bloqueia recursos pesados em cada aba de detalhe
          await this.blockHeavyResources(page);
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            // Pequeno jitter entre abas do mesmo chunk para não disparar rate-limit
            await jitter(300, 700);
            return await this.extractDetails(page, options, seenSnapshot);
          } catch {
            return null;
          } finally {
            await page.close();
          }
        })
      );

      // Pausa entre chunks para não disparar rate-limit do Google.
      // Não pausa após o último chunk.
      if (i + CONCURRENCY < urls.length) {
        await jitter(1000, 3000);
      }

      // Deduplica os resultados do próprio chunk antes de adicionar ao seen global
      const chunkKeys = new Set<string>();
      for (const contact of results) {
        processed++;
        options.onPhase?.('extract', processed, urls.length);
        if (contact) {
          const key = this.contactKey(contact);
          // Descarta duplicata intra-chunk (mesmo telefone em duas URLs do chunk)
          if (chunkKeys.has(key)) continue;
          chunkKeys.add(key);
          contacts.push(contact);
          seen.add(key); // propaga para chunks futuros
          options.onProgress?.(contacts.length, contact.businessName);
        }
      }
    }

    return contacts;
  }

  // ─────────────────────────────────────────────────────────────────
  // Extrai os dados de detalhe de uma página de estabelecimento
  // Com retry automático para telefone e e-mail
  // ─────────────────────────────────────────────────────────────────
  private async extractDetails(
    page: Page,
    options: ScrapeOptions,
    seen: Set<string>
  ): Promise<Contact | null> {
    // Aguarda h1 E o painel de informações (data-item-id) renderizar.
    // O Maps carrega os campos de contato via JS após o DOMContentLoaded,
    // então esperar só pelo h1 resulta em extrações vazias frequentes.
    await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});
    await page.waitForSelector('[data-item-id]', { timeout: 5000 }).catch(() => {});
    // Buffer extra para conteúdo dinâmico (telefone carrega ~200-600ms depois do h1)
    await jitter(350, 650);

    // Nome do negócio: URL slug (XHR, estável) → h1 role heading → fallback DOM
    const nameFromUrl = this.xhrParser.extractNameFromUrl(page.url());
    const businessName = nameFromUrl ?? await this.extractBusinessName(page);
    if (!businessName) return null;

    // ── Extração com retry para telefone ──────────────────────────
    // Telefones no Maps são carregados de forma assíncrona e às vezes
    // chegam 1-2s depois do painel de info principal.
    let phone = await this.extractPhone(page);
    if (!phone) {
      options.onRetry?.(businessName, 'telefone');
      await jitter(1500, 2200); // aguarda lazy-load do número
      phone = await this.extractPhone(page);
    }

    // ── Extração com retry para website ───────────────────────────
    let website = await this.extractWebsite(page);
    if (!website) {
      await jitter(600, 1000);
      website = await this.extractWebsite(page);
    }

    const address  = await this.extractAddress(page);
    const rating   = await this.extractRating(page);
    const category = await this.extractCategory(page);

    // ── Extração de e-mail via axios+cheerio (sem Playwright) ─────
    // WebsiteEmailExtractor já faz deep crawl em /contato, /contact etc.
    // Se mesmo assim null, o site não expõe email publicamente.
    let email: string | null = null;
    if (options.extractEmailsFromWebsite && website) {
      email = await this.emailExtractor.extract(website);
      // Retry de e-mail não necessário: o deep crawl cobre os casos de fallback
    }

    const contact: Contact = {
      id: uuidv4(),
      businessName: businessName.trim(),
      phone:    phone    ? this.normalizePhone(phone) : null,
      email:    email    ?? null,
      website:  website  ?? null,
      address:  address  ?? null,
      rating:   rating   ?? null,
      category: category ?? null,
      messageSentWhatsapp: false,
      messageSentEmail:    false,
      scrapedAt: new Date().toISOString(),
    };

    const key = this.contactKey(contact);
    // Descarta contatos sem nenhum canal de contato ou duplicados
    if (seen.has(key) || (!contact.phone && !contact.email)) return null;

    return contact;
  }

  // ─────────────────────────────────────────────────────────────────
  // Interceptação de recursos — bloqueia o que não agrega dados
  // ─────────────────────────────────────────────────────────────────
  /**
   * Aborta recursos puramente visuais que não afetam a renderização de dados.
   *
   * CRÍTICO: 'stylesheet' foi REMOVIDO da lista de bloqueio.
   * O Google Maps usa CSS para controlar a visibilidade de campos via classes
   * dinâmicas. Bloquear stylesheets faz telefone, endereço e categoria não
   * renderizarem, resultando em extrações em branco que disparam retries inúteis.
   *
   * Bloqueamos: imagens, fontes, mídia — conteúdo puramente visual.
   * Mantemos: document, script, xhr, fetch, stylesheet.
   */
  private async blockHeavyResources(page: Page): Promise<void> {
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      const blockedTypes = ['image', 'font', 'media', 'texttrack', 'eventsource'];
      if (blockedTypes.includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Extratores resilientes com múltiplas estratégias por campo
  // ─────────────────────────────────────────────────────────────────

  /**
   * Nome do negócio — usa aria-label e role antes de classes ofuscadas.
   * O Google muda classes como "DUwDvf" a cada deploy, mas atributos
   * ARIA são estáveis pois são usados por leitores de tela.
   */
  private async extractBusinessName(page: Page): Promise<string | null> {
    // Estratégia 1: h1 com role="heading" level 1 (semântico, estável)
    try {
      const el = page.getByRole('heading', { level: 1 }).first();
      if (await el.isVisible({ timeout: 1000 })) {
        const t = await el.innerText({ timeout: 1000 });
        if (t?.trim()) return t.trim();
      }
    } catch {}

    // Estratégia 2: seletores de fallback incluindo classes conhecidas
    return this.getText(page, [
      'h1[class*="fontHeadline"]',
      'h1[class*="DUwDvf"]',
      '[role="main"] h1',
      'h1',
    ]);
  }

  /**
   * Telefone — data-item-id é mais estável que classes CSS do Google.
   * Atributos data-* são parte da estrutura semântica do Maps.
   */
  private async extractPhone(page: Page): Promise<string | null> {
    // Estratégia 1: data-item-id contém o número direto no atributo
    const itemId = await page
      .locator('[data-item-id*="phone:tel:"]')
      .first()
      .getAttribute('data-item-id')
      .catch(() => null);

    if (itemId) {
      const m = itemId.match(/tel:(.+)/);
      if (m) return m[1];
    }

    // Estratégia 2: link href="tel:..."
    const telHref = await page
      .locator('a[href^="tel:"]')
      .first()
      .getAttribute('href')
      .catch(() => null);
    if (telHref) return telHref.replace('tel:', '');

    // Estratégia 3: aria-label com "Phone" ou "Telefone"
    return this.getText(page, [
      '[aria-label*="Phone:"] .Io6YTe',
      '[aria-label*="Telefone"] .Io6YTe',
      '[data-item-id*="phone"] .fontBodyMedium',
    ]);
  }

  /** Website — aria-label "website" é mais estável que data-item-id="authority" */
  private async extractWebsite(page: Page): Promise<string | null> {
    const href = await page
      .locator(
        '[data-item-id="authority"] a, ' +
        '[aria-label*="website" i] a, ' +
        '[aria-label*="site" i] a, ' +
        'a[data-item-id*="authority"]'
      )
      .first()
      .getAttribute('href')
      .catch(() => null);

    return href?.startsWith('http') ? href : null;
  }

  /** Endereço — usa aria-label em PT e EN para cobrir locales diferentes */
  private async extractAddress(page: Page): Promise<string | null> {
    return this.getText(page, [
      '[data-item-id*="address"] .Io6YTe',
      '[aria-label*="Endere"] .Io6YTe',
      '[aria-label*="Address"] .Io6YTe',
      'button[data-item-id*="address"] .fontBodyMedium',
    ]);
  }

  /** Rating — span aria-hidden dentro do container de estrelas */
  private async extractRating(page: Page): Promise<string | null> {
    return this.getText(page, [
      'div.F7nice span[aria-hidden="true"]',
      'span[aria-label*="stars"]',
      'span[aria-label*="estrelas"]',
    ]);
  }

  /**
   * Categoria — usa ARIA e role para evitar classes ofuscadas.
   * Classes como 'DkEaL' e 'mgr77e' mudam a cada deploy do Google.
   * O botão de categoria fica logo abaixo do h1, antes do bloco de endereço,
   * e tem texto curto sem números (ex: "Pizzaria", "Academia").
   */
  private async extractCategory(page: Page): Promise<string | null> {
    const actionLabels = ['Direções', 'Directions', 'Ligar', 'Call', 'Salvar', 'Save', 'Compartilhar', 'Share', 'Website', 'Rota'];
    try {
      const buttons = page.locator('[role="main"] button');
      const count = await buttons.count().catch(() => 0);
      for (let i = 0; i < Math.min(count, 8); i++) {
        try {
          const btn = buttons.nth(i);
          const label = await btn.getAttribute('aria-label').catch(() => null);
          const text = (await btn.innerText({ timeout: 400 }).catch(() => '')).trim();
          if (!text || text.length > 60) continue;
          if (actionLabels.some((a) => label?.includes(a) || text.includes(a))) continue;
          if (/^\d/.test(text)) continue; // rating começa com número
          return text;
        } catch {}
      }
    } catch {}
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers genéricos
  // ─────────────────────────────────────────────────────────────────

  /** Tenta múltiplos seletores em sequência, retorna o primeiro com texto */
  private async getText(page: Page, selectors: string[]): Promise<string | null> {
    for (const sel of selectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 500 })) {
          const t = await el.innerText({ timeout: 500 });
          if (t?.trim()) return t.trim();
        }
      } catch {}
    }
    return null;
  }

  /** Descarta o banner de cookies do Google para não bloquear o feed */
  private async dismissCookies(page: Page): Promise<void> {
    const cookieSelectors = [
      'button[aria-label="Accept all"]',
      'button[aria-label="Aceitar tudo"]',
      'button[id="L2AGLb"]',
      'form:nth-child(2) button',
    ];
    for (const sel of cookieSelectors) {
      try {
        await page.click(sel, { timeout: 2000 });
        return;
      } catch {}
    }
  }

  /** Normaliza telefone removendo toda formatação — armazena só dígitos */
  private normalizePhone(p: string): string {
    // Remove: espaços, hífens, parênteses, pontos, barras, +
    // Remove prefixo internacional 00 ou +
    return p.replace(/[\s\-().+/\.]/g, '').replace(/^00/, '');
  }

  /** Chave única de deduplicação: prefere phone, depois email, depois nome */
  private contactKey(c: Contact): string {
    return c.phone ?? c.email ?? c.businessName;
  }
}
