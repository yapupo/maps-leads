import { describe, it, expect } from 'vitest';
import { MapsXhrParser } from '../../../src/infra/scraping/MapsXhrParser';

describe('MapsXhrParser', () => {
  it('extrai nome de URL de detalhe do Maps', () => {
    const parser = new MapsXhrParser();
    const result = parser.extractNameFromUrl('https://www.google.com/maps/place/Pizzaria+Bella+Vista/@-3.71,-38.53');
    expect(result).toBe('Pizzaria Bella Vista');
  });

  it('retorna null para URL sem nome de negócio', () => {
    const parser = new MapsXhrParser();
    const result = parser.extractNameFromUrl('https://www.google.com/maps/search/pizza');
    expect(result).toBeNull();
  });

  it('isPlaceDetailUrl identifica URL de detalhe', () => {
    const parser = new MapsXhrParser();
    expect(parser.isPlaceDetailUrl('https://www.google.com/maps/place/Padaria/@-3.71')).toBe(true);
    expect(parser.isPlaceDetailUrl('https://www.google.com/maps/search/pizza')).toBe(false);
  });

  it('parsePhoneFromResponse extrai telefone de body JSON do Maps', () => {
    const body = JSON.stringify({ data: [null, null, [null, 'tel:+5585999999999', null]] });
    const parser = new MapsXhrParser();
    expect(parser.parsePhoneFromResponseBody(body)).toBe('+5585999999999');
  });

  it('parsePhoneFromResponse retorna null se não há telefone', () => {
    const parser = new MapsXhrParser();
    expect(parser.parsePhoneFromResponseBody('{"data": []}')).toBeNull();
  });
});
