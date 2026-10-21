import { parseDataValue, compareValues } from './value';

describe('parseDataValue', () => {
  test('parses integers', () => {
    expect(parseDataValue('42')).toBe(42);
    expect(typeof parseDataValue('42')).toBe('number');
  });

  test('parses floats', () => {
    expect(parseDataValue('3.14')).toBe(3.14);
    expect(parseDataValue('-2.5')).toBe(-2.5);
    expect(typeof parseDataValue('3.14')).toBe('number');
  });

  test('parses negatives and zero', () => {
    expect(parseDataValue('-7')).toBe(-7);
    expect(parseDataValue('0')).toBe(0);
    expect(parseDataValue('-0.25')).toBe(-0.25);
  });

  test('trims surrounding whitespace', () => {
    expect(parseDataValue(' 42 ')).toBe(42);
    expect(parseDataValue('\t3.14\n')).toBe(3.14);
  });

  test('keeps non-numeric input as a string', () => {
    expect(parseDataValue('hello')).toBe('hello');
    expect(parseDataValue('abc123')).toBe('abc123');
    expect(parseDataValue('3.14.15')).toBe('3.14.15');
    expect(typeof parseDataValue('hello')).toBe('string');
  });

  test('treats empty input as null', () => {
    expect(parseDataValue('')).toBeNull();
    expect(parseDataValue('   ')).toBeNull();
    expect(parseDataValue(null)).toBeNull();
    expect(parseDataValue(undefined)).toBeNull();
  });

  test('does not confuse numeric-looking strings with actual numbers when already numeric', () => {
    expect(parseDataValue('3.0')).toBe(3);
    expect(parseDataValue('100')).toBe(100);
  });
});

describe('compareValues', () => {
  test('compares two numbers numerically', () => {
    expect(compareValues(3, 5)).toBe(-1);
    expect(compareValues(5, 3)).toBe(1);
    expect(compareValues(3, 3)).toBe(0);
    expect(compareValues(-2, 3)).toBe(-1);
    expect(compareValues(3.14, 2.7)).toBeGreaterThan(0);
  });

  test('compares two strings lexicographically', () => {
    expect(compareValues('apple', 'banana')).toBeLessThan(0);
    expect(compareValues('banana', 'apple')).toBeGreaterThan(0);
    expect(compareValues('apple', 'apple')).toBe(0);
  });

  test('falls back to string comparison when types are mixed', () => {
    expect(compareValues(3, '5')).toBeLessThan(0);
    expect(compareValues('5', 3)).toBeGreaterThan(0);
  });

  test('numeric comparison beats lexicographic for multi-digit numbers', () => {
    expect(compareValues(10, 2)).toBeGreaterThan(0); // 10 - 2 = 8
  });
});
