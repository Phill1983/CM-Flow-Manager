import { describe, expect, it } from 'vitest';
import { assertCatalogParity, translate } from './catalog';
import { SUPPORTED_LOCALES } from './types';

describe('localization catalogs', () => {
  it('keeps pl/uk/en key parity', () => {
    expect(() => assertCatalogParity()).not.toThrow();
  });

  it('returns product name for all locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(translate(locale, 'app.name')).toBe('CM Flow Manager');
    }
  });
});
