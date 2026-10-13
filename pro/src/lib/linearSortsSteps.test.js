import { buildCountingSteps, buildRadixSteps } from './linearSortsSteps';
import { SORTING_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setComparePair: vi.fn(),
  setSwapPair: vi.fn(),
  setActiveIndex: vi.fn(),
  setSortedIndexes: vi.fn(),
  setDisplayArray: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

describe('buildCountingSteps', () => {
  test('tally, prefix positions, then stable placement', () => {
    const ui = makeUi();
    const steps = buildCountingSteps([4, 2, 2, 8], ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Starting counting sort on 4 elements — max value 8');
    expect(d[1]).toBe('Tally array size k+1 = 9, all zeroed');
    expect(d).toContain('Counting 4 — tally[4] becomes 1');
    expect(d).toContain('Counting 2 — tally[2] becomes 2');
    expect(d).toContain('Tally[2] now holds an end position of 2');
    expect(d).toContain('Placing 2 from index 2 into slot 1');
    expect(d).toContain('Placing 2 from index 1 into slot 0');

    expect(steps[steps.length - 1].description).toBe(
      'Output copied back — counting sort is stable and complete'
    );
  });

  test('every step maps into the listing', () => {
    buildCountingSteps([3, 1, 2], makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(SORTING_PSEUDOCODE.counting.length);
    });
  });
});

describe('buildRadixSteps', () => {
  test('stable LSD passes by digit place', () => {
    const ui = makeUi();
    const steps = buildRadixSteps([44, 12, 103], ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Radix sort (LSD, base 10) on 3 elements — 3 digit passes');
    expect(d).toContain('Digit pass 1 (1s place): 44 → bucket 4, 12 → bucket 2, 103 → bucket 3');
    expect(d).toContain('Digit pass 2 (10s place): 12 → bucket 1, 103 → bucket 0, 44 → bucket 4');
    expect(d).toContain('Digit pass 3 (100s place): 103 → bucket 1, 12 → bucket 0, 44 → bucket 0');
    expect(steps[steps.length - 1].description).toContain('Radix sort complete');
  });

  test('every step maps into the listing', () => {
    buildRadixSteps([7, 210], makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(SORTING_PSEUDOCODE.radix.length);
    });
  });
});
