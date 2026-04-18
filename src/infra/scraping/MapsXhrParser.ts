export interface ParsedPlaceData {
  name: string | null;
  phone: string | null;
}

export class MapsXhrParser {
  extractNameFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/maps\/place\/([^/@?]+)/);
      if (!match) return null;
      const decoded = decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
      return decoded.length > 0 ? decoded : null;
    } catch {
      return null;
    }
  }

  isPlaceDetailUrl(url: string): boolean {
    return /\/maps\/place\/[^/@?]+\/@/.test(url);
  }

  parsePhoneFromResponseBody(body: string): string | null {
    if (!body || body.length < 10) return null;
    const telMatch = body.match(/"tel:(\+[\d\s\-().]+?)"/);
    if (telMatch) return telMatch[1].trim();
    const rawMatch = body.match(/tel:(\+[\d]{8,15})/);
    if (rawMatch) return rawMatch[1];
    return null;
  }
}
