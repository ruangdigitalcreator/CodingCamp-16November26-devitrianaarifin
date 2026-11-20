/**
 * Property 18 – Storage failure does not crash the dashboard
 * Validates: Requirements 2.3
 *
 * When localStorage is broken (every operation throws), all Storage methods
 * must NEVER throw — they must return false or the fallback value.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

describe('Property 18 – Storage failure resilience', () => {
  beforeEach(() => {
    // Make localStorage throw on every operation
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('unavailable'); },
      setItem: () => { throw new Error('unavailable'); },
      removeItem: () => { throw new Error('unavailable'); },
    });
  });

  it('isAvailable returns false when localStorage throws', () => {
    expect(() => window.Dashboard.Storage.isAvailable()).not.toThrow();
    expect(window.Dashboard.Storage.isAvailable()).toBe(false);
  });

  it('load never throws and returns fallback', () => {
    fc.assert(fc.property(fc.string(), fc.anything(), (key, fallback) => {
      let result;
      expect(() => { result = window.Dashboard.Storage.load(key, fallback); }).not.toThrow();
      expect(result).toStrictEqual(fallback);
    }), { numRuns: 100 });
  });

  it('save never throws and returns false', () => {
    fc.assert(fc.property(fc.string(), fc.anything(), (key, value) => {
      let result;
      expect(() => { result = window.Dashboard.Storage.save(key, value); }).not.toThrow();
      expect(result).toBe(false);
    }), { numRuns: 100 });
  });

  it('remove never throws and returns false', () => {
    fc.assert(fc.property(fc.string(), (key) => {
      let result;
      expect(() => { result = window.Dashboard.Storage.remove(key); }).not.toThrow();
      expect(result).toBe(false);
    }), { numRuns: 100 });
  });
});
