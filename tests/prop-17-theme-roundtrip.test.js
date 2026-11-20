/**
 * Property 17 – Theme persistence round-trip with light default
 * Validates: Requirements 2.1, 2.2, 7.2, 7.3, 7.4
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

describe('Property 17 – Theme persistence round-trip', () => {
  let store;
  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it('save then load returns the same theme', () => {
    const themeArb = fc.constantFrom('light', 'dark');
    fc.assert(fc.property(themeArb, (theme) => {
      const { Storage } = window.Dashboard;
      Storage.save(Storage.KEYS.THEME, theme);
      const loaded = Storage.load(Storage.KEYS.THEME, 'light');
      expect(loaded).toBe(theme);
    }), { numRuns: 100 });
  });

  it('returns light default when key is missing', () => {
    const { Storage } = window.Dashboard;
    // key not set
    const loaded = Storage.load(Storage.KEYS.THEME, 'light');
    expect(loaded).toBe('light');
  });
});
