import {
  buildBubbleSteps,
  buildSelectionSteps,
  buildInsertionSteps,
  buildShellSteps,
  buildMergeSteps,
  buildQuickSteps,
  buildHeapSteps,
} from './sortingSteps';
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
const compareCalls = (ui) => ui.setComparePair.mock.calls.map((c) => c[0]).filter((v) => v !== null);
const swapCalls = (ui) => ui.setSwapPair.mock.calls.map((c) => c[0]).filter((v) => v !== null);
const sortedCalls = (ui) => ui.setSortedIndexes.mock.calls.map((c) => c[0]);

describe('buildBubbleSteps', () => {
  test('swaps the inverted pair then reports the sorted suffix', () => {
    const ui = makeUi();
    const steps = buildBubbleSteps([2, 1], ui);

    expect(descriptions(steps)).toEqual([
      'Starting bubble sort on 2 elements',
      'Pass 1: bubbling the largest unsorted value to the end',
      'Comparing positions 0 and 1 (2 vs 1)',
      'Swapping 2 and 1',
      'Pass 1 complete — 2 is sorted at position 1',
      'Array is sorted: 1, 2',
    ]);

    runAll(steps);
    expect(kinds(steps)).toEqual(['move', 'compare', 'compare', 'move', 'found', 'found']);
    expect(compareCalls(ui)).toEqual([[0, 1]]);
    expect(swapCalls(ui)).toEqual([[0, 1]]);
    expect(sortedCalls(ui)[sortedCalls(ui).length - 2]).toEqual([1]);
    expect(sortedCalls(ui)[sortedCalls(ui).length - 1]).toEqual([0, 1]);
  });

  test('narrates a no-swap pass as an early finish', () => {
    const steps = buildBubbleSteps([1, 2, 3], makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('no swap needed');
    expect(text).toContain('Array is sorted: 1, 2, 3');
    expect(steps[steps.length - 1].vars).toEqual({ sorted: [1, 2, 3] });
  });
});

describe('buildSelectionSteps', () => {
  test('tracks the running minimum then swaps it into place', () => {
    const ui = makeUi();
    const steps = buildSelectionSteps([3, 1, 2], ui);

    expect(descriptions(steps)).toEqual([
      'Starting selection sort on 3 elements',
      'Pass 1: selecting the minimum of positions 0..2',
      'Assuming position 0 (3) is the minimum',
      'Comparing 1 with minimum 3 (position 1)',
      'New minimum: 1 at position 1',
      'Comparing 2 with minimum 1 (position 2)',
      '2 ≥ 1 — minimum unchanged',
      'Swapping positions 0 and 1 (3 ↔ 1)',
      'Pass 1 complete — 1 is sorted at the front',
      'Pass 2: selecting the minimum of positions 1..2',
      'Assuming position 1 (3) is the minimum',
      'Comparing 2 with minimum 3 (position 2)',
      'New minimum: 2 at position 2',
      'Swapping positions 1 and 2 (3 ↔ 2)',
      'Pass 2 complete — 2 is in place at position 1',
      'Array is sorted: 1, 2, 3',
    ]);

    runAll(steps);
    expect(swapCalls(ui)).toEqual([
      [0, 1],
      [1, 2],
    ]);
    expect(sortedCalls(ui)[sortedCalls(ui).length - 1]).toEqual([0, 1, 2]);
  });
});

describe('buildInsertionSteps', () => {
  test('takes a key then shifts the prefix right to make room', () => {
    const ui = makeUi();
    const steps = buildInsertionSteps([2, 1], ui);

    expect(descriptions(steps)).toEqual([
      'Starting insertion sort on 2 elements',
      'Pass 1: inserting position 1 into the sorted prefix',
      'Taking key 1 from position 1',
      'Comparing key 1 with 2 at position 0',
      'Shifting 2 right to position 1',
      'Placing key 1 at position 0',
      'Array is sorted: 1, 2',
    ]);

    runAll(steps);
    expect(kinds(steps)).toEqual([
      'move',
      'compare',
      'move',
      'compare',
      'move',
      'move',
      'found',
    ]);
    expect(compareCalls(ui)).toEqual([[0, 1]]);
    expect(sortedCalls(ui)[sortedCalls(ui).length - 1]).toEqual([0, 1]);
  });

  test('an already-sorted key just places without shifting', () => {
    const steps = buildInsertionSteps([1, 2], makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Taking key 2 from position 1');
    expect(text).toContain('2 ≥ 1 — key stays in place');
    expect(text).not.toContain('Shifting');
  });
});

describe('buildShellSteps', () => {
  test('runs gapped insertion passes over a shrinking gap sequence', () => {
    const ui = makeUi();
    const steps = buildShellSteps([4, 3, 2, 1], ui);

    expect(descriptions(steps)).toEqual([
      'Starting shell sort on 4 elements — gap sequence 2, 1',
      'Gap phase g = 2: insertion passes with stride 2',
      'Comparing arr[0] = 4 with key 2 (gap 2)',
      'Shifting 4 from position 0 to position 2',
      'Placing key 2 at position 0',
      'Comparing arr[1] = 3 with key 1 (gap 2)',
      'Shifting 3 from position 1 to position 3',
      'Placing key 1 at position 1',
      'Gap phase g = 1: insertion passes with stride 1',
      'Comparing arr[0] = 2 with key 1 (gap 1)',
      'Shifting 2 from position 0 to position 1',
      'Placing key 1 at position 0',
      'Comparing arr[1] = 2 with key 4 (gap 1)',
      '4 ≥ 2 — key stays in place',
      'Placing key 4 at position 2',
      'Comparing arr[2] = 4 with key 3 (gap 1)',
      'Shifting 4 from position 2 to position 3',
      'Comparing arr[1] = 2 with key 3 (gap 1)',
      '3 ≥ 2 — key stays in place',
      'Placing key 3 at position 2',
      'Array is sorted: 1, 2, 3, 4',
    ]);

    runAll(steps);
    expect(kinds(steps)).toEqual([
      'move',
      'compare',
      'compare',
      'move',
      'move',
      'compare',
      'move',
      'move',
      'compare',
      'compare',
      'move',
      'move',
      'compare',
      'compare',
      'move',
      'compare',
      'move',
      'compare',
      'compare',
      'move',
      'found',
    ]);
    expect(compareCalls(ui)).toEqual([
      [0, 2],
      [1, 3],
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 2],
    ]);
    expect(swapCalls(ui)).toEqual([
      [0, 2],
      [1, 3],
      [0, 1],
      [2, 3],
    ]);
    expect(sortedCalls(ui)[sortedCalls(ui).length - 1]).toEqual([0, 1, 2, 3]);
    expect(steps[steps.length - 1].vars).toEqual({ sorted: [1, 2, 3, 4] });
  });

  test('a two-element input only needs the gap-1 pass', () => {
    const steps = buildShellSteps([2, 1], makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting shell sort on 2 elements — gap sequence 1',
      'Gap phase g = 1: insertion passes with stride 1',
      'Comparing arr[0] = 2 with key 1 (gap 1)',
      'Shifting 2 from position 0 to position 1',
      'Placing key 1 at position 0',
      'Array is sorted: 1, 2',
    ]);
    expect(descriptions(steps).join('\n')).not.toContain('Gap phase g = 2');
  });

  test('already-sorted input narrates no shifts at every gap', () => {
    const ui = makeUi();
    const steps = buildShellSteps([1, 2, 3], ui);
    const text = descriptions(steps).join('\n');
    expect(text).toContain('key stays in place');
    expect(text).not.toContain('Shifting');
    expect(text).toContain('Array is sorted: 1, 2, 3');
    expect(swapCalls(ui)).toEqual([]);
  });
});

describe('every step has a non-empty description', () => {
  test('all three builders', () => {
    const ui = makeUi();
    [
      buildBubbleSteps([3, 1], ui),
      buildSelectionSteps([2, 1], ui),
      buildInsertionSteps([3, 1, 2], ui),
      buildShellSteps([3, 1], ui),
    ].forEach((steps) =>
      steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0))
    );
  });
});

describe('pseudocode lines and variable watch', () => {
  test('bubble steps line up with the bubbleSort listing', () => {
    const steps = buildBubbleSteps([2, 1], makeUi());
    expect(steps.map((s) => s.line)).toEqual([1, 3, 4, 5, 6, 8]);
    expect(steps[0].vars).toEqual({ n: 2 });
    expect(steps[2].vars).toEqual({ i: 0, a: 2, b: 1 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(SORTING_PSEUDOCODE.bubble.length)
    );
  });

  test('selection steps line up with the selectionSort listing', () => {
    const steps = buildSelectionSteps([3, 1, 2], makeUi());
    expect(steps.map((s) => s.line)).toEqual([1, 3, 4, 6, 6, 6, 6, 7, 7, 3, 4, 6, 6, 7, 7, 8]);
    expect(steps[3].vars).toEqual({ j: 1, a: 1, min: 3 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(SORTING_PSEUDOCODE.selection.length)
    );
  });

  test('insertion steps line up with the insertionSort listing', () => {
    const steps = buildInsertionSteps([2, 1], makeUi());
    expect(steps.map((s) => s.line)).toEqual([1, 3, 4, 6, 7, 9, 10]);
    expect(steps[2].vars).toEqual({ key: 1, i: 1 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(SORTING_PSEUDOCODE.insertion.length)
    );
  });

  test('shell steps line up with the shellSort listing', () => {
    const steps = buildShellSteps([4, 3, 2, 1], makeUi());
    expect(steps.map((s) => s.line)).toEqual([
      1, 5, 7, 8, 9, 7, 8, 9, 5, 7, 8, 9, 7, 7, 9, 7, 8, 7, 7, 9, 11,
    ]);
    expect(steps[0].vars).toEqual({ n: 4, gaps: [2, 1] });
    expect(steps[1].vars).toEqual({ gap: 2 });
    expect(steps[2].vars).toEqual({ gap: 2, j: 0, a: 4, key: 2 });
    expect(steps[3].vars).toEqual({ gap: 2, from: 0, to: 2, value: 4 });
    expect(steps[4].vars).toEqual({ pos: 0, key: 2 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(SORTING_PSEUDOCODE.shell.length)
    );
  });
});

describe('buildMergeSteps', () => {
  test('splits, compares heads and merges [2,1] into [1,2]', () => {
    const ui = makeUi();
    const steps = buildMergeSteps([2, 1], ui);

    expect(descriptions(steps)).toEqual([
      'Starting merge sort on 2 elements',
      'Splitting [2, 1] into [2] and [1]',
      'Merging [2] and [1]',
      'Comparing heads 2 and 1 → take 1',
      'Taking 1 from the right run',
      'Taking 2 (leftover)',
      'Merged run: 1, 2',
      'Merge sort complete: 1, 2',
    ]);

    expect(kinds(steps)).toEqual([
      'move',
      'compare',
      'compare',
      'compare',
      'move',
      'move',
      'found',
      'found',
    ]);
    expect(steps.map((s) => s.line)).toEqual([1, 3, 6, 7, 7, 8, 9, 10]);
    expect(steps[steps.length - 1].vars).toEqual({ sorted: [1, 2] });
  });

  test('multi-level merges on a three-element array end sorted', () => {
    const steps = buildMergeSteps([3, 1, 2], makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Merge sort complete: 1, 2, 3');
    expect(last.vars).toEqual({ sorted: [1, 2, 3] });
  });
});

describe('buildQuickSteps', () => {
  test('partitions around the last-element pivot', () => {
    const ui = makeUi();
    const steps = buildQuickSteps([2, 1], ui);

    expect(descriptions(steps)).toEqual([
      'Starting quick sort on 2 elements',
      'Choosing pivot 1 (last element of [0..1])',
      'Comparing 2 with pivot 1 → right partition',
      'Placing pivot 1 at position 0',
      'Recursing on left [] and right [2]',
      'Single element [2] at position 1 is in place',
      'Quick sort complete: 1, 2',
    ]);

    expect(kinds(steps)).toEqual(['move', 'compare', 'compare', 'move', 'compare', 'found', 'found']);
    expect(steps.map((s) => s.line)).toEqual([1, 3, 3, 3, 5, 6, 7]);
    expect(steps[steps.length - 1].vars).toEqual({ sorted: [1, 2] });
  });
});

describe('buildHeapSteps', () => {
  test('builds a max-heap then extracts the maximum', () => {
    const ui = makeUi();
    const steps = buildHeapSteps([2, 1], ui);

    const text = descriptions(steps).join('\n');
    expect(text).toContain('Starting heap sort on 2 elements');
    expect(text).toContain('Building max-heap');
    expect(text).toContain('Extracting max');
    expect(descriptions(steps)[steps.length - 1]).toBe('Heap sort complete: 1, 2');
    expect(steps[steps.length - 1].vars).toEqual({ sorted: [1, 2] });
  });

  test('a larger array ends sorted', () => {
    const steps = buildHeapSteps([3, 1, 2], makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Heap sort complete: 1, 2, 3');
    expect(last.vars).toEqual({ sorted: [1, 2, 3] });
  });
});

describe('pseudocode lines for merge/quick/heap', () => {
  test('every step maps into its listing', () => {
    const ui = makeUi();
    const sets = [
      [buildMergeSteps([2, 1], ui), SORTING_PSEUDOCODE.merge],
      [buildQuickSteps([2, 1], ui), SORTING_PSEUDOCODE.quick],
      [buildHeapSteps([2, 1], ui), SORTING_PSEUDOCODE.heap],
    ];
    sets.forEach(([steps, listing]) => {
      steps.forEach((s) => {
        expect(Number.isInteger(s.line)).toBe(true);
        expect(s.line).toBeGreaterThanOrEqual(1);
        expect(s.line).toBeLessThanOrEqual(listing.length);
      });
    });
  });
});
