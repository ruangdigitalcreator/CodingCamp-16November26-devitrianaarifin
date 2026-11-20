import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 16 – Quick link persistence round-trip
 * Validates: Requirements 2.1, 2.2, 6.5
 */
describe('Property 16 – Quick link persistence round-trip', () => {
  let store;
  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it('save then load returns deep-equal link list', () => {
    const linkArb = fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.string({ minLength: 1 }),
      url: fc.string({ minLength: 1 }),
    });
    fc.assert(fc.property(fc.array(linkArb), (links) => {
      const { Storage } = window.Dashboard;
      Storage.save(Storage.KEYS.QUICK_LINKS, links);
      const loaded = Storage.load(Storage.KEYS.QUICK_LINKS, []);
      expect(loaded).toStrictEqual(links);
    }), { numRuns: 100 });
  });
});
