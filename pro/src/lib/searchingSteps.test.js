import { buildLinearSteps, buildBinarySteps } from './searchingSteps';
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
