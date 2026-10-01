import { randomValues, sortedSequence, uniqueRandomValues } from './presets';

describe('preset helpers', () => {
  test('randomValues produces the requested count of integers in 1..99', () => {
    const values = randomValues(8);
    expect(values).toHaveLength(8);
    values.forEach((v) => {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(99);
    });
  });

  test('sortedSequence is strictly ascending from 10', () => {
    expect(sortedSequence(4)).toEqual([10, 20, 30, 40]);
    expect(sortedSequence(12)).toHaveLength(12);
  });

  test('uniqueRandomValues never repeats a value', () => {
    const values = uniqueRandomValues(7);
    expect(values).toHaveLength(7);
    expect(new Set(values).size).toBe(7);
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(99);
    });
  });
});
