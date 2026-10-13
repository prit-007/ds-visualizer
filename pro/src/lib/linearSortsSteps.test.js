import {
  buildCountingSteps,
  buildRadixSteps,
  buildBucketSteps,
} from './linearSortsSteps';
import { SORTING_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setComparePair: vi.fn(),
  setSwapPair: vi.fn(),
  setActiveIndex: vi.fn(),
  setSortedIndexes: vi.fn(),
  setDisplayArray: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const sortedCalls = (ui) => ui.setSortedIndexes.mock.calls.map((c) => c[0]);
const displayCalls = (ui) => ui.setDisplayArray.mock.calls.map((c) => c[0]);

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

describe('buildBucketSteps', () => {
  test('distributes by value, sorts each bucket, then concatenates', () => {
    const ui = makeUi();
    const steps = buildBucketSteps([5, 3, 8, 1, 9, 2], ui);

    expect(descriptions(steps)).toEqual([
      'Starting bucket sort on 6 elements — max 9, 6 buckets',
      'Value 5 → bucket 3 (floor(5 × 6 / 10))',
      'Value 3 → bucket 1 (floor(3 × 6 / 10))',
      'Value 8 → bucket 4 (floor(8 × 6 / 10))',
      'Value 1 → bucket 0 (floor(1 × 6 / 10))',
      'Value 9 → bucket 5 (floor(9 × 6 / 10))',
      'Value 2 → bucket 1 (floor(2 × 6 / 10))',
      'Sorting each bucket with insertion sort',
      'Bucket 0: [1] — single element, already sorted',
      'Sorting bucket 1: [3, 2] → 2, 3',
      'Bucket 3: [5] — single element, already sorted',
      'Bucket 4: [8] — single element, already sorted',
      'Bucket 5: [9] — single element, already sorted',
      'Appending bucket 0: [1] — array so far: 1',
      'Appending bucket 1: [2, 3] — array so far: 1, 2, 3',
      'Appending bucket 3: [5] — array so far: 1, 2, 3, 5',
      'Appending bucket 4: [8] — array so far: 1, 2, 3, 5, 8',
      'Appending bucket 5: [9] — array so far: 1, 2, 3, 5, 8, 9',
      'Bucket sort complete — sorted: 1, 2, 3, 5, 8, 9',
    ]);

    runAll(steps);
    expect(kinds(steps)).toEqual([
      'move',
      'move',
      'move',
      'move',
      'move',
      'move',
      'move',
      'compare',
      'compare',
      'found',
      'compare',
      'compare',
      'compare',
      'move',
      'move',
      'move',
      'move',
      'move',
      'found',
    ]);

    const displays = displayCalls(ui);
    expect(displays[displays.length - 1]).toEqual([1, 2, 3, 5, 8, 9]);
    // mid-run the canvas fills left-to-right with '-' placeholders
    expect(displays.some((arr) => arr.includes('-'))).toBe(true);
    expect(sortedCalls(ui)[sortedCalls(ui).length - 1]).toEqual([0, 1, 2, 3, 4, 5]);
    expect(steps[steps.length - 1].vars).toEqual({ sorted: [1, 2, 3, 5, 8, 9] });
  });

  test('all-identical values land in one bucket and come out sorted', () => {
    const steps = buildBucketSteps([7, 7, 7], makeUi());
    expect(descriptions(steps)[steps.length - 1]).toBe(
      'Bucket sort complete — sorted: 7, 7, 7'
    );
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Value 7 → bucket 2 (floor(7 × 3 / 8))');
    expect(text).toContain('Sorting bucket 2: [7, 7, 7] → 7, 7, 7');
    expect(text).toContain('Appending bucket 2: [7, 7, 7]');
  });

  test('empty buckets are skipped in both the sort and concat narration', () => {
    const steps = buildBucketSteps([0, 0, 7, 7], makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Value 7 → bucket 3 (floor(7 × 4 / 8))');
    expect(text).toContain('Sorting bucket 0: [0, 0] → 0, 0');
    expect(text).toContain('Appending bucket 3: [7, 7] — array so far: 0, 0, 7, 7');
    expect(text).not.toContain('bucket 1');
    expect(text).not.toContain('bucket 2');
    expect(descriptions(steps)[steps.length - 1]).toBe(
      'Bucket sort complete — sorted: 0, 0, 7, 7'
    );
  });

  test('bucket steps line up with the bucketSort listing', () => {
    const steps = buildBucketSteps([5, 3, 8, 1, 9, 2], makeUi());
    expect(steps.map((s) => s.line)).toEqual([
      1, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 8,
    ]);
    expect(steps[0].vars).toEqual({ n: 6, k: 9, buckets: 6 });
    expect(steps[1].vars).toEqual({ value: 5, bucket: 3 });
    expect(steps[7].vars).toEqual({ nonEmpty: [0, 1, 3, 4, 5] });
    expect(steps[13].vars).toEqual({ bucket: 0, values: [1], soFar: [1] });
    steps.forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(SORTING_PSEUDOCODE.bucket.length);
    });
  });
});
