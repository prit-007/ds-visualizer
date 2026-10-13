import { buildRabinKarpSteps, buildZSearchSteps } from './rabinZSteps';
import { STRING_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setHighlight: vi.fn(),
  setActiveIndex: vi.fn(),
  setFound: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

describe('buildRabinKarpSteps', () => {
  test('rolls the hash window, verifies hits, and lists occurrences', () => {
    const ui = makeUi();
    const steps = buildRabinKarpSteps('ababcabcabab', 'abab', ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Rabin-Karp search for "abab" in text "ababcabcabab"');
    expect(d).toContain('pattern hash hp = 2 (base 256, mod 101)');
    expect(d).toContain('first window "abab" hash = 2');
    expect(d).toContain('hash hit at shift 0 (h = 2 = hp) — verifying characters');
    expect(d).toContain('verified match at 0');
    expect(d).toContain('roll: drop "a" (97), add "c" (99) → hash 75');
    expect(d).toContain('hash 75 ≠ hp (2) — slide window');
    expect(d).toContain('verified match at 8');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(STRING_PSEUDOCODE.rabin.length);
    });

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Occurrences of "abab": 0, 8');
    expect(last.kind).toBe('found');
    expect(last.vars.matches).toEqual([0, 8]);
  });

  test('a hash collision without equal characters is called out as spurious', () => {
    const ui = makeUi();
    const steps = buildRabinKarpSteps('ju', 'ab', ui);
    const d = descriptions(steps);

    expect(d).toContain('pattern hash hp = 84 (base 256, mod 101)');
    expect(d).toContain('hash hit at shift 0 (h = 84 = hp) — verifying characters');
    expect(d).toContain('spurious collision at 0 — text[0] = "j" ≠ "a" = pattern[0]');

    const last = steps[steps.length - 1];
    expect(last.description).toBe('No occurrences of "ab" found');
    expect(last.kind).toBe('error');
  });
});

describe('buildZSearchSteps', () => {
  test('builds the Z array over pattern$text and reports prefix matches', () => {
    const ui = makeUi();
    const steps = buildZSearchSteps('zabcab', 'abc', ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Z search for "abc" in text "zabcab"');
    expect(d).toContain('S = "abc$zabcab" — Z[i] = longest match between S and S[i..]');
    expect(d).toContain('Z[5] = 3 — matched "abc"');
    expect(d).toContain('i = 6 inside box [5..7] → seed Z[6] = 0');
    expect(d).toContain('Z[6] = 0 — "b" ≠ "a"');
    expect(d).toContain('Z[8] = 2 — matched "ab"');
    expect(d).toContain('Z ≥ 3 → match at text index 1');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(STRING_PSEUDOCODE.zalg.length);
    });

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Occurrences of "abc": 1');
    expect(last.kind).toBe('found');
    expect(last.vars.matches).toEqual([1]);
  });

  test('no prefix overlap ends with an honest empty result', () => {
    const ui = makeUi();
    const steps = buildZSearchSteps('xyz', 'abc', ui);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('No occurrences of "abc" found');
    expect(last.kind).toBe('error');
  });
});
