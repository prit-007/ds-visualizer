import {
  buildLinearSteps,
  buildBinarySteps,
  buildTernarySteps,
  buildJumpSteps,
  buildInterpolationSteps,
} from './searchingSteps';
import { SEARCHING_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setComparePair: vi.fn(),
  setActiveIndex: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const activeCalls = (ui) => ui.setActiveIndex.mock.calls.map((c) => c[0]).filter((v) => v !== null);

describe('buildLinearSteps', () => {
  test('walks every index and reports the found position', () => {
    const ui = makeUi();
    const steps = buildLinearSteps([2, 4, 6, 8], 6, ui);

    expect(descriptions(steps)).toEqual([
      'Starting linear search for 6',
      'Comparing 6 with index 0 (value 2)',
      'Comparing 6 with index 1 (value 4)',
      'Comparing 6 with index 2 (value 6)',
      'Found 6 at index 2',
    ]);

    runAll(steps);
    expect(kinds(steps)).toEqual(['move', 'compare', 'compare', 'compare', 'found']);
    expect(steps.map((s) => s.line)).toEqual([1, 3, 3, 3, 4]);
    expect(activeCalls(ui)).toEqual([0, 1, 2, 2]);
  });

  test('missing targets walk the whole array then error', () => {
    const steps = buildLinearSteps([2, 4], 9, makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting linear search for 9',
      'Comparing 9 with index 0 (value 2)',
      'Comparing 9 with index 1 (value 4)',
      '9 is not in the array',
    ]);
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('error');
  });
});

describe('buildBinarySteps', () => {
  test('halves the window and reports the found index', () => {
    const ui = makeUi();
    const steps = buildBinarySteps([2, 4, 6, 8, 10], 8, ui);

    const text = descriptions(steps).join('\n');
    expect(text).toContain('Starting binary search for 8 on sorted array');
    expect(text).toContain('Comparing 8 with mid 6 (index 2)');
    expect(text).toContain('8 > 6 → search right [3..4]');
    expect(text).toContain('Found 8 at index 3');
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('found');
  });

  test('missing targets end with an error step', () => {
    const steps = buildBinarySteps([2, 4, 6], 5, makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toBe('5 is not in the sorted array');
    expect(last.kind).toBe('error');
  });

  test('every step maps into its listing', () => {
    const ui = makeUi();
    [buildLinearSteps([1, 2], 2, ui), buildBinarySteps([1, 2, 3], 3, ui)].forEach(
      (steps, idx) => {
        const listing = idx === 0 ? SEARCHING_PSEUDOCODE.linear : SEARCHING_PSEUDOCODE.binary;
        steps.forEach((s) => {
          expect(Number.isInteger(s.line)).toBe(true);
          expect(s.line).toBeGreaterThanOrEqual(1);
          expect(s.line).toBeLessThanOrEqual(listing.length);
        });
      }
    );
  });
});

describe('buildTernarySteps', () => {
  const sorted = [2, 4, 6, 8, 10, 12, 14];

  test('splits into thirds and finds the target', () => {
    const ui = makeUi();
    const steps = buildTernarySteps(sorted, 8, ui);

    expect(descriptions(steps)).toEqual([
      'Starting ternary search for 8 on sorted array [2, 4, 6, 8, 10, 12, 14]',
      'Comparing 8 with m1 6 (index 2)',
      '8 > 6 → compare m2',
      'Comparing 8 with m2 10 (index 4)',
      '8 < 10 → search middle third [3..3]',
      'Comparing 8 with m1 8 (index 3)',
      'Found 8 at index 3',
    ]);
    expect(kinds(steps)).toEqual([
      'move', 'compare', 'compare', 'compare', 'compare', 'compare', 'found',
    ]);
    expect(steps.map((s) => s.line)).toEqual([1, 6, 8, 8, 10, 6, 4]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([2, 4, 3, 3]);
  });

  test('discards the left third when target < m1', () => {
    const ui = makeUi();
    const steps = buildTernarySteps(sorted, 4, ui);
    expect(descriptions(steps)).toEqual([
      'Starting ternary search for 4 on sorted array [2, 4, 6, 8, 10, 12, 14]',
      'Comparing 4 with m1 6 (index 2)',
      '4 < 6 → search left third [0..1]',
      'Comparing 4 with m1 2 (index 0)',
      '4 > 2 → compare m2',
      'Comparing 4 with m2 4 (index 1)',
      'Found 4 at index 1',
    ]);
    expect(kinds(steps)).toEqual([
      'move', 'compare', 'compare', 'compare', 'compare', 'compare', 'found',
    ]);
  });

  test('discards the right third when target > m2', () => {
    const steps = buildTernarySteps(sorted, 12, makeUi());
    expect(descriptions(steps)).toContain('12 > 10 → search right third [5..6]');
    expect(descriptions(steps)).toContain('Found 12 at index 5');
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('found');
  });

  test('missing target ends with an error step', () => {
    const steps = buildTernarySteps(sorted, 5, makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting ternary search for 5 on sorted array [2, 4, 6, 8, 10, 12, 14]',
      'Comparing 5 with m1 6 (index 2)',
      '5 < 6 → search left third [0..1]',
      'Comparing 5 with m1 2 (index 0)',
      '5 > 2 → compare m2',
      'Comparing 5 with m2 4 (index 1)',
      '5 > 4 → search right third [2..1]',
      '5 is not in the sorted array',
    ]);
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('error');
    expect(steps[steps.length - 1].line).toBe(11);
  });

  test('every step maps into its listing', () => {
    const ui = makeUi();
    buildTernarySteps([1, 2, 3, 4, 5], 4, ui).forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(SEARCHING_PSEUDOCODE.ternary.length);
    });
  });
});

describe('buildJumpSteps', () => {
  const sorted = [2, 4, 6, 8, 10, 12, 14];

  test('skips blocks then scans the final block', () => {
    const ui = makeUi();
    const steps = buildJumpSteps(sorted, 8, ui);

    expect(descriptions(steps)).toEqual([
      'Starting jump search for 8 on sorted array [2, 4, 6, 8, 10, 12, 14]',
      'Jump size ⌊√7⌋ = 2',
      'Comparing 8 with block end 4 (index 1)',
      '8 > 4 → jump to next block starting at 2',
      'Comparing 8 with block end 8 (index 3)',
      '8 ≤ 8 → scan block [2..3]',
      'Comparing 8 with index 2 (value 6)',
      'Comparing 8 with index 3 (value 8)',
      'Found 8 at index 3',
    ]);
    expect(kinds(steps)).toEqual([
      'move', 'compare', 'compare', 'compare', 'compare', 'compare',
      'compare', 'compare', 'found',
    ]);
    expect(steps.map((s) => s.line)).toEqual([1, 2, 3, 6, 3, 7, 8, 8, 8]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([1, 3, 2, 3, 3]);
  });

  test('finds the target in the last block', () => {
    const steps = buildJumpSteps(sorted, 14, makeUi());
    expect(descriptions(steps)).toContain(
      '14 > 12 → jump to next block starting at 6'
    );
    expect(descriptions(steps)).toContain('14 ≤ 14 → scan block [6..6]');
    expect(descriptions(steps)).toContain('Found 14 at index 6');
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('found');
  });

  test('overshooting past the end reports not found', () => {
    const steps = buildJumpSteps(sorted, 99, makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting jump search for 99 on sorted array [2, 4, 6, 8, 10, 12, 14]',
      'Jump size ⌊√7⌋ = 2',
      'Comparing 99 with block end 4 (index 1)',
      '99 > 4 → jump to next block starting at 2',
      'Comparing 99 with block end 8 (index 3)',
      '99 > 8 → jump to next block starting at 4',
      'Comparing 99 with block end 12 (index 5)',
      '99 > 12 → jump to next block starting at 6',
      'Comparing 99 with block end 14 (index 6)',
      '99 > 14 → next block starts past the end',
      '99 is not in the sorted array',
    ]);
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('error');
  });

  test('every step maps into its listing', () => {
    const ui = makeUi();
    buildJumpSteps([1, 2, 3], 2, ui).forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(SEARCHING_PSEUDOCODE.jump.length);
    });
  });
});

describe('buildInterpolationSteps', () => {
  const sorted = [2, 4, 6, 8, 10, 12, 14];

  test('probes the estimated position directly', () => {
    const ui = makeUi();
    const steps = buildInterpolationSteps(sorted, 8, ui);

    expect(descriptions(steps)).toEqual([
      'Starting interpolation search for 8 on sorted array [2, 4, 6, 8, 10, 12, 14]',
      'Probing pos = 0 + ⌊(8 − 2) × 6 ÷ (14 − 2)⌋ = 3',
      'Comparing 8 with array[3] = 8',
      'Found 8 at index 3',
    ]);
    expect(kinds(steps)).toEqual(['move', 'compare', 'compare', 'found']);
    expect(steps.map((s) => s.line)).toEqual([1, 5, 7, 7]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([3, 3]);
  });

  test('narrows right after a low probe', () => {
    const steps = buildInterpolationSteps(sorted, 13, makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting interpolation search for 13 on sorted array [2, 4, 6, 8, 10, 12, 14]',
      'Probing pos = 0 + ⌊(13 − 2) × 6 ÷ (14 − 2)⌋ = 5',
      'Comparing 13 with array[5] = 12',
      '13 > 12 → search [6..6]',
      '13 is outside the value range [14..14] — not in the array',
    ]);
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('error');
  });

  test('multi-probe narrows on non-uniform data', () => {
    const ui = makeUi();
    const steps = buildInterpolationSteps([2, 3, 10, 15, 20, 30, 40], 15, ui);
    expect(descriptions(steps)).toEqual([
      'Starting interpolation search for 15 on sorted array [2, 3, 10, 15, 20, 30, 40]',
      'Probing pos = 0 + ⌊(15 − 2) × 6 ÷ (40 − 2)⌋ = 2',
      'Comparing 15 with array[2] = 10',
      '15 > 10 → search [3..6]',
      'Probing pos = 3 + ⌊(15 − 15) × 3 ÷ (40 − 15)⌋ = 3',
      'Comparing 15 with array[3] = 15',
      'Found 15 at index 3',
    ]);
    expect(kinds(steps)).toEqual([
      'move', 'compare', 'compare', 'compare', 'compare', 'compare', 'found',
    ]);
    expect(steps.map((s) => s.line)).toEqual([1, 5, 7, 9, 5, 7, 7]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([2, 3, 3]);
  });

  test('rejects a target outside the value range up front', () => {
    const steps = buildInterpolationSteps([2, 4, 6], 1, makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting interpolation search for 1 on sorted array [2, 4, 6]',
      '1 is outside the value range [2..6] — not in the array',
    ]);
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('error');
    expect(steps[steps.length - 1].line).toBe(10);
  });

  test('handles a single-valued window with an exact match', () => {
    const steps = buildInterpolationSteps([5, 5, 5], 5, makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting interpolation search for 5 on sorted array [5, 5, 5]',
      'Window [0..2] holds only 5 — probing index 0',
      'Comparing 5 with array[0] = 5',
      'Found 5 at index 0',
    ]);
  });

  test('every step maps into its listing', () => {
    const ui = makeUi();
    buildInterpolationSteps([1, 2, 3, 4, 5], 3, ui).forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(SEARCHING_PSEUDOCODE.interpolation.length);
    });
  });
});
