/**
 * Property 15 – Task list persistence round-trip
 *
 * For any array of task objects, saving then loading from Storage returns
 * a deep-equal copy.
 *
 * Validates: Requirements 2.1, 2.2, 5.5
 */
import { describe, it, beforeEach } from 'vitest';
import * as fc from 'fast-check';

describe('Property 15 – Task list persistence round-trip', () => {
  let store;
  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it('save then load returns deep-equal task list', () => {
    const taskArb = fc.record({
      id: fc.string({ minLength: 1 }),
      text: fc.string({ minLength: 1 }),
      done: fc.boolean(),
    });
    fc.assert(fc.property(fc.array(taskArb), (tasks) => {
      const { Storage } = window.Dashboard;
      Storage.save(Storage.KEYS.TASKS, tasks);
      const loaded = Storage.load(Storage.KEYS.TASKS, []);
      expect(loaded).toStrictEqual(tasks);
    }), { numRuns: 100 });
  });
});
