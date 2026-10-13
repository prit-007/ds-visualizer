import {
  buildKmpTableSteps,
  buildKmpSearchSteps,
  buildNaiveSearchSteps,
} from './kmpSteps';
import { STRING_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setHighlight: vi.fn(),
  setFound: vi.fn(),
  setActiveIndex: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

describe('buildKmpTableSteps', () => {
  test('computes the failure table with narration', () => {
    const ui = makeUi();
    const steps = buildKmpTableSteps('abab', ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Building failure (π) table for pattern "abab"');
    expect(d).toContain('π[2]: longest proper prefix == suffix of "aba" is 1');
    expect(d).toContain('π[3]: longest proper prefix == suffix of "abab" is 2');
    expect(d[d.length - 1]).toBe('Failure table complete: [0, 0, 1, 2]');
  });

  test('every step maps into the listing', () => {
    buildKmpTableSteps('abab', makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(STRING_PSEUDOCODE.table.length);
    });
  });
});

describe('buildKmpSearchSteps', () => {
  test('finds both occurrences without re-matching shared prefixes', () => {
    const ui = makeUi();
    const steps = buildKmpSearchSteps('ababcabcabab', 'abab', ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('KMP search for "abab" in text "ababcabcabab"');
    expect(d).toContain('Pattern "abab" fully matched at index 0');
    expect(d).toContain('Pattern "abab" fully matched at index 8');
    expect(d).toContain('Mismatch (c vs a) — shift pattern right using π[1] = 0');

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Occurrences of "abab": 0, 8');
    expect(last.kind).toBe('found');
    expect(last.vars.matches).toEqual([0, 8]);
  });

  test('every step maps into the listing', () => {
    buildKmpSearchSteps('abc', 'x', makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(STRING_PSEUDOCODE.kmpMatch.length);
    });
  });
});

describe('buildNaiveSearchSteps', () => {
  test('slides one position at a time and finds matches', () => {
    const ui = makeUi();
    const steps = buildNaiveSearchSteps('ababcabcabab', 'abab', ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Naive search for "abab" in text "ababcabcabab"');
    expect(d).toContain('Mismatch at alignment 1 (text[1] = b vs pattern[0] = a) — shift by 1');
    expect(d).toContain('Mismatch at alignment 2 (text[4] = c vs pattern[2] = a) — shift by 1');
    expect(d[d.length - 1]).toBe('Occurrences of "abab": 0, 8');
  });

  test('every step maps into the listing', () => {
    buildNaiveSearchSteps('abc', 'x', makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(STRING_PSEUDOCODE.naive.length);
    });
  });
});
