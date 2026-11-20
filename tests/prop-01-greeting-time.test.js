/**
 * Property 1 – Greeting displays time and date
 * Validates: Requirements 3.1
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property 1 – Greeting displays time and date', () => {
  it('formatTime returns HH:MM zero-padded for any date', () => {
    fc.assert(fc.property(
      fc.date({ min: new Date(2000, 0, 1), max: new Date(2099, 11, 31) }),
      (date) => {
        const { GreetingModel } = window.Dashboard;
        const result = GreetingModel.formatTime(date);
        expect(result).toMatch(/^\d{2}:\d{2}$/);
        const [h, m] = result.split(':').map(Number);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(23);
        expect(m).toBeGreaterThanOrEqual(0);
        expect(m).toBeLessThanOrEqual(59);
        // Verify zero-padding
        expect(result.length).toBe(5);
      }
    ), { numRuns: 200 });
  });

  it('formatDate returns a non-empty string for any date', () => {
    fc.assert(fc.property(
      fc.date({ min: new Date(2000, 0, 1), max: new Date(2099, 11, 31) }),
      (date) => {
        const { GreetingModel } = window.Dashboard;
        const result = GreetingModel.formatDate(date);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    ), { numRuns: 100 });
  });
});
