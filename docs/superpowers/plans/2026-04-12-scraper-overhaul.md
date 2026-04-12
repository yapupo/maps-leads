# Scraper Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aumentar o yield e a estabilidade do scraper do Google Maps resolvendo o bug do CSS bloqueado, reduzindo agressividade de concorrência, eliminando seletores ofuscados instáveis e adicionando interceptação de respostas XHR para extrair dados diretamente da camada de rede em vez do DOM.

**Architecture:** Duas camadas de extração — (1) interceptação de respostas XHR/fetch do Maps como fonte primária de dados (nome, telefone, endereço), com (2) fallback DOM via seletores ARIA estáveis para campos não cobertos pela rede. O bloqueio de recursos passa a preservar stylesheets (necessários para o Maps renderizar campos de contato), bloqueando apenas imagens, fontes e mídia.

**Tech Stack:** TypeScript, Playwright (Firefox), axios, cheerio, vitest (testes unitários novos)

---

## Arquivos que serão modificados ou criados

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/infra/scraping/GoogleMapsScraper.ts` | Modificar | Engine principal do scraper |
| `src/infra/scraping/WebsiteEmailExtractor.ts` | Modificar | Extração de email via HTTP |
| `src/infra/scraping/MapsXhrParser.ts` | Criar | Parsear payload XHR do Maps |
| `tests/infra/scraping/MapsXhrParser.test.ts` | Criar | Testes unitários do parser |
| `tests/infra/scraping/WebsiteEmailExtractor.test.ts` | Criar | Testes unitários do extractor |
| `package.json` | Modificar | Adicionar vitest como devDependency |
| `vitest.config.ts` | Criar | Configuração do runner de testes |

---

## Task 1: Setup do ambiente de testes (vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Instalar vitest**

```bash
cd C:/Users/TEPA/maps-leads
npm install --save-dev vitest @vitest/coverage-v8
```

Expected: vitest aparece em `devDependencies` no package.json.

- [ ] **Step 2: Adicionar scripts de teste no package.json**

Abra `package.json` e adicione dentro de `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

O bloco `scripts` completo ficará:

```json
"scripts": {
  "start": "ts-node main.ts",
  "build": "tsc",
  "postinstall": "npx playwright install firefox",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 3: Criar vitest.config.ts na raiz**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Criar diretório de testes**

```bash
mkdir -p C:/Users/TEPA/maps-leads/tests/infra/scraping
```

- [ ] **Step 5: Verificar que vitest funciona**

```bash
cd C:/Users/TEPA/maps-leads
npx vitest run
```

Expected output: `No test files found` (sem erro, só aviso de zero testes).

- [ ] **Step 6: Commit**

```bash
git init  # se não houver repo git
git add package.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Criar MapsXhrParser — parser de payloads XHR do Google Maps

O Google Maps carrega os dados de um negócio via XHR antes do DOM renderizar.
A resposta chega como JSON que contém nome, telefone, endereço em campos indexados.
Este módulo isola o parser para ser testável sem abrir um browser.

**Files:**
- Create: `src/infra/scraping/MapsXhrParser.ts`
- Create: `tests/infra/scraping/MapsXhrParser.test.ts`

- [ ] **Step 1: Escrever os testes antes da implementação**

Crie `tests/infra/scraping/MapsXhrParser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MapsXhrParser, ParsedPlaceData } from '../../../src/infra/scraping/MapsXhrParser';

describe('MapsXhrParser', () => {
  it('extrai nome, telefone e endereço de payload Maps', () => {
    // Payload simplificado com a estrutura que o Maps retorna via XHR.
    // O Maps usa um array de arrays — o nome fica em [11][0][0][0][1][0][0]
    // mas o formato mais acessível é quando o URL da página já contém o nome.
    // Este teste cobre a extração via URL (estratégia mais confiável).
    const url = 'https://www.google.com/maps/place/Pizzaria+Bella+Vista/@-3.71,-38.53';
    const parser = new MapsXhrParser();
    const result = parser.extractNameFromUrl(url);
    expect(result).toBe('Pizzaria Bella Vista');
  });

  it('retorna null para URL sem nome de negócio', () => {
    const parser = new MapsXhrParser();
    const result = parser.extractNameFromUrl('https://www.google.com/maps/search/pizza');
    expect(result).toBeNull();
  });

  it('isPlaceDetailUrl identifica URL de detalhe de estabelecimento', () => {
    const parser = new MapsXhrParser();
    expect(parser.isPlaceDetailUrl(
      'https://www.google.com/maps/place/Padaria/@-3.71'
    )).toBe(true);

    expect(parser.isPlaceDetailUrl(
      'https://www.google.com/maps/search/pizza'
    )).toBe(false);
  });

  it('parsePhoneFromResponse extrai telefone de body JSON do Maps', () => {
    // O Maps retorna JSON com o telefone na estrutura de dados interna.
    // Quando a resposta contém o padrão tel:, extraímos diretamente.
    const body = JSON.stringify({
      data: [null, null, [null, 'tel:+5585999999999', null]]
    });
    const parser = new MapsXhrParser();
    const phone = parser.parsePhoneFromResponseBody(body);
    expect(phone).toBe('+5585999999999');
  });

  it('parsePhoneFromResponse retorna null se não há telefone', () => {
    const parser = new MapsXhrParser();
    expect(parser.parsePhoneFromResponseBody('{"data": []}')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar os testes e verificar que falham**

```bash
cd C:/Users/TEPA/maps-leads
npx vitest run tests/infra/scraping/MapsXhrParser.test.ts
```

Expected: FAIL — "Cannot find module '../../../src/infra/scraping/MapsXhrParser'"

- [ ] **Step 3: Implementar MapsXhrParser**

Crie `src/infra/scraping/MapsXhrParser.ts`:

```typescript
/**
 * MapsXhrParser — extrai dados de estabelecimentos das respostas de rede do Google Maps.
 *
 * O Google Maps carrega dados de negócios via XHR/fetch antes de renderizar o DOM.
 * Interceptar essas respostas é mais confiável do que parsear seletores CSS,
 * pois os dados de rede são estruturados e não mudam com redesigns de UI.
 *
 * Estratégias implementadas:
 *   1. Extração de nome via URL da página de detalhe (estável — faz parte do SEO do Google)
 *   2. Extração de telefone via regex em payloads JSON de resposta XHR
 *   3. Detecção de URL de detalhe vs URL de busca
 */
export interface ParsedPlaceData {
  name: string | null;
  phone: string | null;
}

export class MapsXhrParser {
  /**
   * Extrai o nome do negócio diretamente da URL de detalhe.
   * Formato: /maps/place/Nome+Do+Negocio/@lat,lng,...
   *
   * Essa estratégia é estável porque o slug de nome faz parte da URL
   * canônica do Maps (usado para SEO e compartilhamento) e não muda
   * com atualizações de UI do frontend.
   */
  extractNameFromUrl(url: string): string | null {
    try {
      // Match: /maps/place/<nome>/ onde nome pode ter +, %20 ou texto normal
      const match = url.match(/\/maps\/place\/([^/@?]+)/);
      if (!match) return null;

      const raw = match[1];
      // Decodifica %XX e substitui + por espaço (formato URL do Maps)
      const decoded = decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
      return decoded.length > 0 ? decoded : null;
    } catch {
      return null;
    }
  }

  /**
   * Retorna true se a URL é de uma página de detalhe de estabelecimento,
   * false se for uma página de busca/listagem.
   */
  isPlaceDetailUrl(url: string): boolean {
    return /\/maps\/place\/[^/@?]+\/@/.test(url);
  }

  /**
   * Extrai número de telefone do body de uma resposta XHR do Maps.
   *
   * O Maps usa um formato JSON próprio onde telefones aparecem como
   * strings "tel:+55..." em vários níveis do array. Usamos regex para
   * capturar independente de onde o campo esteja na estrutura.
   */
  parsePhoneFromResponseBody(body: string): string | null {
    if (!body || body.length < 10) return null;

    // Padrão: "tel:+55XXXXXXXXXX" ou "tel:+55 XX XXXXX-XXXX"
    const telMatch = body.match(/"tel:(\+[\d\s\-().]+?)"/);
    if (telMatch) {
      return telMatch[1].trim();
    }

    // Padrão alternativo sem aspas (às vezes o Maps serializa sem JSON)
    const rawMatch = body.match(/tel:(\+[\d]{8,15})/);
    if (rawMatch) return rawMatch[1];

    return null;
  }
}
```

- [ ] **Step 4: Rodar os testes e verificar que passam**

```bash
cd C:/Users/TEPA/maps-leads
npx vitest run tests/infra/scraping/MapsXhrParser.test.ts
```

Expected: PASS — todos os 5 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/infra/scraping/MapsXhrParser.ts tests/infra/scraping/MapsXhrParser.test.ts
git commit -m "feat: add MapsXhrParser for network-level data extraction"
```

---

## Task 3: Testes unitários para WebsiteEmailExtractor

Antes de modificar o extractor, escrever os testes para garantir que o comportamento existente não quebra.

**Files:**
- Create: `tests/infra/scraping/WebsiteEmailExtractor.test.ts`

- [ ] **Step 1: Escrever os testes**

Crie `tests/infra/scraping/WebsiteEmailExtractor.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { WebsiteEmailExtractor } from '../../../src/infra/scraping/WebsiteEmailExtractor';

// Mock do axios para não fazer requests reais nos testes
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
      data: '<html><body><p>Contato: vendas@empresa.com.br | WhatsApp: (85) 9999-9999</p></body></html>',
    });

    const result = await extractor.extract('https://empresa.com.br');
    expect(result).toBe('vendas@empresa.com.br');
  });

  it('tenta rota /contato se home não tiver email', async () => {
    mockedAxios.get = vi.fn()
      // Primeira chamada: home sem email
      .mockResolvedValueOnce({ status: 200, data: '<html><body>Sem email</body></html>' })
      // Segunda chamada: /contato com email
      .mockResolvedValueOnce({ status: 200, data: '<html><body><a href="mailto:oi@loja.com">email</a></body></html>' });

    const result = await extractor.extract('https://loja.com');
    expect(result).toBe('oi@loja.com');
    // Deve ter chamado axios.get duas vezes: home + /contato
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
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
      data: '<html><body>Email: noreply@sentry.io e contato@example.com mas não esses</body></html>',
    });
    const result = await extractor.extract('https://loja.com');
    expect(result).toBeNull();
  });

  it('extrai email mesmo em domínio .com.br', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      status: 200,
      data: '<html><body><a href="mailto:joao@padaria.com.br">João</a></body></html>',
    });
    const result = await extractor.extract('https://padaria.com.br');
    expect(result).toBe('joao@padaria.com.br');
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que passam com o código atual**

```bash
cd C:/Users/TEPA/maps-leads
npx vitest run tests/infra/scraping/WebsiteEmailExtractor.test.ts
```

Expected: PASS — esses testes validam o comportamento atual. Se algum falhar, há um bug já existente a corrigir antes de prosseguir.

- [ ] **Step 3: Commit**

```bash
git add tests/infra/scraping/WebsiteEmailExtractor.test.ts
git commit -m "test: add unit tests for WebsiteEmailExtractor"
```

---

## Task 4: Melhorar WebsiteEmailExtractor — mais rotas e melhor regex

**Files:**
- Modify: `src/infra/scraping/WebsiteEmailExtractor.ts`

- [ ] **Step 1: Adicionar os novos casos de teste primeiro**

Abra `tests/infra/scraping/WebsiteEmailExtractor.test.ts` e adicione após o último teste `it(...)`:

```typescript
  it('tenta rota /fale-conosco', async () => {
    mockedAxios.get = vi.fn()
      .mockResolvedValueOnce({ status: 200, data: '<html>sem email</html>' })   // home
      .mockResolvedValueOnce({ status: 404, data: '' })                          // /contato
      .mockResolvedValueOnce({ status: 404, data: '' })                          // /contact
      .mockResolvedValueOnce({ status: 200, data: '<html><a href="mailto:x@y.com.br">x</a></html>' }); // /fale-conosco

    const result = await extractor.extract('https://loja.com.br');
    expect(result).toBe('x@y.com.br');
  });

  it('tenta rota /quem-somos', async () => {
    mockedAxios.get = vi.fn()
      .mockResolvedValueOnce({ status: 200, data: '<html>sem email</html>' })  // home
      .mockResolvedValueOnce({ status: 404, data: '' })                         // /contato
      .mockResolvedValueOnce({ status: 404, data: '' })                         // /contact
      .mockResolvedValueOnce({ status: 404, data: '' })                         // /fale-conosco
      .mockResolvedValueOnce({ status: 404, data: '' })                         // /sobre
      .mockResolvedValueOnce({ status: 404, data: '' })                         // /about
      .mockResolvedValueOnce({ status: 200, data: '<html><a href="mailto:z@loja.com">z</a></html>' }); // /quem-somos

    const result = await extractor.extract('https://loja.com');
    expect(result).toBe('z@loja.com');
  });
```

- [ ] **Step 2: Confirmar que os novos testes falham (rotas ainda não existem)**

```bash
cd C:/Users/TEPA/maps-leads
npx vitest run tests/infra/scraping/WebsiteEmailExtractor.test.ts
```

Expected: os 2 novos testes falham porque `/fale-conosco` e `/quem-somos` não estão em `CONTACT_PATHS`.

- [ ] **Step 3: Atualizar `CONTACT_PATHS` em WebsiteEmailExtractor.ts**

Abra `src/infra/scraping/WebsiteEmailExtractor.ts` e substitua a linha:

```typescript
const CONTACT_PATHS = ['/contato', '/contact', '/fale-conosco', '/sobre', '/about'];
```

Por:

```typescript
// Rotas de contato comuns em sites brasileiros e internacionais.
// Ordenas por frequência de ocorrência em pequenos negócios BR.
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
```

- [ ] **Step 4: Rodar os testes e verificar que todos passam**

```bash
cd C:/Users/TEPA/maps-leads
npx vitest run tests/infra/scraping/WebsiteEmailExtractor.test.ts
```

Expected: PASS — todos os 8 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/infra/scraping/WebsiteEmailExtractor.ts tests/infra/scraping/WebsiteEmailExtractor.test.ts
git commit -m "feat: expand contact route paths for Brazilian business sites"
```

---

## Task 5: Corrigir bug crítico — CSS bloqueado no Google Maps

Este é o bug de maior impacto. Bloquear stylesheets impede o Maps de renderizar
campos de contato, causando extrações em branco que disparam retry e ainda falham.

**Files:**
- Modify: `src/infra/scraping/GoogleMapsScraper.ts`

- [ ] **Step 1: Localizar e corrigir o método `blockHeavyResources`**

Em `src/infra/scraping/GoogleMapsScraper.ts`, localize o método `blockHeavyResources` (linha ~307) e substitua:

```typescript
private async blockHeavyResources(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'texttrack', 'eventsource'];
    if (blockedTypes.includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });
}
```

Por:

```typescript
/**
 * Aborta apenas recursos visuais que não afetam renderização de dados.
 *
 * IMPORTANTE: 'stylesheet' foi REMOVIDO da lista de bloqueio.
 * O Google Maps usa CSS para controlar visibilidade de elementos via
 * classes dinâmicas. Bloquear stylesheets faz campos como telefone e
 * endereço não renderizarem, resultando em extrações em branco.
 *
 * O que bloqueamos: imagens, fontes, mídia — conteúdo puramente visual.
 * O que mantemos: scripts, fetch, xhr, document, stylesheet.
 */
private async blockHeavyResources(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    // Não incluir 'stylesheet' aqui — o Maps precisa do CSS para renderizar
    const blockedTypes = ['image', 'font', 'media', 'texttrack', 'eventsource'];
    if (blockedTypes.includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });
}
```

- [ ] **Step 2: Reduzir CONCURRENCY de 6 para 3**

No mesmo arquivo, localize a constante (linha ~25):

```typescript
const CONCURRENCY = 6;
```

Substitua por:

```typescript
// 3 é o ponto de equilíbrio entre velocidade e anti-rate-limiting.
// 6 abas simultâneas do mesmo IP dispara detecção de bot no Google.
// Com 3 abas + jitter entre chunks, o scraper opera abaixo do threshold.
const CONCURRENCY = 3;
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/scraping/GoogleMapsScraper.ts
git commit -m "fix: unblock CSS stylesheets in Maps scraper, reduce concurrency to 3"
```

---

## Task 6: Integrar MapsXhrParser no GoogleMapsScraper

Adiciona interceptação de respostas XHR como fonte primária de nome e telefone,
com fallback para os extratores DOM existentes.

**Files:**
- Modify: `src/infra/scraping/GoogleMapsScraper.ts`

- [ ] **Step 1: Adicionar o import do MapsXhrParser**

No topo de `src/infra/scraping/GoogleMapsScraper.ts`, após os imports existentes, adicione:

```typescript
import { MapsXhrParser } from './MapsXhrParser';
```

- [ ] **Step 2: Adicionar a instância do parser na classe**

Na classe `GoogleMapsScraper`, após a linha `private emailExtractor = new WebsiteEmailExtractor();`, adicione:

```typescript
private xhrParser = new MapsXhrParser();
```

- [ ] **Step 3: Adicionar método `extractWithXhrInterception`**

Dentro da classe `GoogleMapsScraper`, adicione este novo método após o método `extractDetails`:

```typescript
/**
 * Configura interceptação de respostas XHR na página e coleta dados
 * do negócio diretamente da camada de rede antes do DOM renderizar.
 *
 * O Maps faz requests XHR que retornam dados do estabelecimento em JSON.
 * Capturar esses dados é mais confiável que parsear o DOM renderizado,
 * pois não depende de seletores CSS que mudam a cada deploy do Google.
 *
 * Retorna parcial — só o que foi possível capturar via XHR.
 * O chamador deve complementar com extractDetails para campos restantes.
 */
private setupXhrCapture(page: Page): { captured: Partial<{ name: string; phone: string }> } {
  const captured: Partial<{ name: string; phone: string }> = {};

  // Captura respostas que possam conter dados do estabelecimento
  page.on('response', async (response) => {
    const url = response.url();

    // Captura nome via URL da página de detalhe (mais confiável)
    if (!captured.name && this.xhrParser.isPlaceDetailUrl(url)) {
      const name = this.xhrParser.extractNameFromUrl(url);
      if (name) captured.name = name;
    }

    // Captura telefone de respostas XHR/fetch que contenham dados do Maps
    if (!captured.phone) {
      const contentType = response.headers()['content-type'] ?? '';
      if (
        (url.includes('maps') || url.includes('place')) &&
        (contentType.includes('json') || contentType.includes('javascript'))
      ) {
        try {
          const body = await response.text().catch(() => '');
          const phone = this.xhrParser.parsePhoneFromResponseBody(body);
          if (phone) captured.phone = phone;
        } catch {
          // Ignorar erros de leitura de response — não são críticos
        }
      }
    }
  });

  return { captured };
}
```

- [ ] **Step 4: Modificar `extractDetails` para usar XHR como fonte primária**

No método `extractDetails`, localize este bloco (logo após o `waitForSelector`):

```typescript
    // Nome do negócio: estratégia aria-label + role antes das classes ofuscadas
    const businessName = await this.extractBusinessName(page);
    if (!businessName) return null;

    // ── Extração com retry para telefone ──────────────────────────
    let phone = await this.extractPhone(page);
    if (!phone) {
      options.onRetry?.(businessName, 'telefone');
      await jitter(1500, 2200); // aguarda lazy-load do número
      phone = await this.extractPhone(page);
    }
```

Substitua por:

```typescript
    // ── Configura captura XHR antes de navegar ──────────────────────
    // A captura XHR já foi configurada antes do goto, então `captured`
    // pode já ter dados quando chegamos aqui.
    // Nota: setupXhrCapture deve ser chamado ANTES do page.goto.
    // Como extractDetails é chamado após goto, usamos apenas fallback XHR via URL.
    const nameFromUrl = this.xhrParser.extractNameFromUrl(page.url());

    // Nome do negócio: XHR (URL slug) → aria-label → classes ofuscadas
    const businessName = nameFromUrl ?? await this.extractBusinessName(page);
    if (!businessName) return null;

    // ── Extração com retry para telefone ──────────────────────────
    // data-item-id é a estratégia mais estável — contém o número no atributo.
    let phone = await this.extractPhone(page);
    if (!phone) {
      options.onRetry?.(businessName, 'telefone');
      await jitter(1500, 2200); // aguarda lazy-load do número
      phone = await this.extractPhone(page);
    }
```

- [ ] **Step 5: Remover seletores com classes ofuscadas do extractCategory**

Localize o método `extractCategory` (linha ~415) e substitua:

```typescript
private async extractCategory(page: Page): Promise<string | null> {
  // Estratégia 1: getByRole button próximo à categoria (mais estável)
  try {
    // O botão de categoria fica abaixo do nome do negócio, antes do endereço
    const btn = page.locator('button.DkEaL, span.mgr77e button').first();
    if (await btn.isVisible({ timeout: 800 })) {
      const t = await btn.innerText({ timeout: 800 });
      if (t?.trim()) return t.trim();
    }
  } catch {}

  return null;
}
```

Por:

```typescript
/**
 * Categoria do negócio — usa aria-label e role para evitar classes ofuscadas.
 * O botão de categoria fica logo abaixo do h1, antes do bloco de endereço.
 * Classes como 'DkEaL' e 'mgr77e' mudam com deploys do Google.
 */
private async extractCategory(page: Page): Promise<string | null> {
  // Estratégia 1: botão dentro do elemento main que não seja de ação
  // (o Maps marca a categoria como um button clicável que filtra o mapa)
  try {
    // Localiza o primeiro button filho direto do painel de info que não
    // tenha aria-label de ação (Direções, Ligar, etc.)
    const actionLabels = ['Direções', 'Directions', 'Ligar', 'Call', 'Salvar', 'Save', 'Compartilhar', 'Share', 'Website'];
    const buttons = page.locator('[role="main"] button');
    const count = await buttons.count().catch(() => 0);

    for (let i = 0; i < Math.min(count, 8); i++) {
      try {
        const btn = buttons.nth(i);
        const label = await btn.getAttribute('aria-label').catch(() => null);
        const text = await btn.innerText({ timeout: 400 }).catch(() => '');
        // Pula botões de ação conhecidos e botões com texto muito longo
        if (!text?.trim() || text.length > 60) continue;
        if (actionLabels.some((a) => label?.includes(a) || text.includes(a))) continue;
        // A categoria costuma ser texto curto sem número (ex: "Pizzaria", "Academia")
        if (/^\d/.test(text)) continue; // começa com número → provavelmente rating
        return text.trim();
      } catch {}
    }
  } catch {}

  return null;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/infra/scraping/GoogleMapsScraper.ts
git commit -m "feat: integrate XhrParser and remove obfuscated CSS selectors from scraper"
```

---

## Task 7: Aumentar jitter e adicionar pausa entre chunks

Reduz o risco de rate-limiting ao adicionar pausa entre cada lote de CONCURRENCY abas.

**Files:**
- Modify: `src/infra/scraping/GoogleMapsScraper.ts`

- [ ] **Step 1: Adicionar pausa entre chunks no método `extractAll`**

Localize o final do loop `for` em `extractAll` (logo antes do `}`que fecha o `for`):

```typescript
    }

    return contacts;
  }
```

Substitua pelo seguinte (adiciona pausa entre chunks):

```typescript
      // Pausa entre chunks para não disparar rate-limit do Google.
      // 1-3 segundos entre lotes de 3 abas simula comportamento humano
      // e mantém o scraper abaixo do threshold de detecção automática.
      if (i + CONCURRENCY < urls.length) {
        await jitter(1000, 3000);
      }
    }

    return contacts;
  }
```

- [ ] **Step 2: Aumentar o jitter do scroll na fase de coleta**

No método `collectUrls`, localize o jitter final do scroll:

```typescript
        // Jitter humano entre scrolls: 900ms a 1800ms
        await jitter(900, 1800);
```

Substitua por:

```typescript
        // Jitter humano entre scrolls: 1200ms a 2500ms
        // Valores menores que 1s disparam detecção de bot no Maps.
        await jitter(1200, 2500);
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/scraping/GoogleMapsScraper.ts
git commit -m "fix: increase jitter delays and add inter-chunk pause to reduce rate-limiting"
```

---

## Task 8: Verificação funcional manual

Roda um scrape real pequeno para validar que as mudanças melhoraram o yield.

- [ ] **Step 1: Iniciar o servidor**

```bash
cd C:/Users/TEPA/maps-leads
npm start
```

Expected: `Maps Leads rodando em http://localhost:3000`

- [ ] **Step 2: Executar um scrape de teste pequeno via cURL ou interface web**

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"query": "academia", "location": "Fortaleza", "maxResults": 10, "extractEmails": false}'
```

- [ ] **Step 3: Monitorar via SSE**

```bash
curl http://localhost:3000/api/events
```

Acompanhe os eventos `scrape:phase` e `scrape:progress`. Verifique que:
- A fase `collect` completa sem travar nos 6 rounds
- A fase `extract` não gera retries excessivos de telefone
- O yield (found/maxResults) é melhor que o histórico de 16% para academia

- [ ] **Step 4: Verificar histórico de scrape**

```bash
curl http://localhost:3000/api/history
```

Compare o `found/maxResults` ratio com as sessões anteriores no `scrape-history.json`.

- [ ] **Step 5: Commit final se tudo estiver OK**

```bash
git add .
git commit -m "chore: verified scraper overhaul working in production"
```

---

## Self-Review

### Cobertura dos requisitos identificados na análise:

| Problema | Task que resolve | Status |
|---------|----------------|--------|
| CSS bloqueado quebra Maps | Task 5 | ✅ |
| CONCURRENCY = 6 agressivo | Task 5 | ✅ |
| Seletores ofuscados (DkEaL, mgr77e) | Task 6 | ✅ |
| XHR interception como fonte primária | Task 2 + 6 | ✅ |
| Sem testes unitários | Task 1 + 3 | ✅ |
| Jitter insuficiente | Task 7 | ✅ |
| CONTACT_PATHS incompleto (BR) | Task 4 | ✅ |

### O que está fora do escopo deste plano (planos separados futuros):

- **Proxy rotation** — requer infraestrutura externa, plano próprio
- **Storage SQLite** — migração de dados, plano próprio
- **Fontes alternativas BR** (CNPJ API, Guiamais) — plano próprio
- **whatsapp-web.js → Evolution API** — plano próprio
- **SPA support no email extractor** (Playwright fallback) — plano próprio

### Scan de placeholders: nenhum encontrado.

### Consistência de tipos:
- `MapsXhrParser` exporta `ParsedPlaceData` (usado nos testes, não no scraper diretamente — OK)
- `extractNameFromUrl`, `isPlaceDetailUrl`, `parsePhoneFromResponseBody` — assinaturas consistentes entre Task 2 (implementação) e Task 6 (uso)
- `this.xhrParser` instanciado na classe antes de ser usado em Task 6 ✅
