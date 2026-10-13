import { MinHeap, parentOf, leftOf, rightOf } from './heap';
import { buildInsertSteps, buildExtractSteps, buildPeekSteps } from './heapSteps';
import { layoutHeap } from './heapLayout';
import { HEAP_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveIndex: vi.fn(),
  setComparePair: vi.fn(),
  setSwapPair: vi.fn(),
  setDisplayArray: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const displays = (ui) => ui.setDisplayArray.mock.calls.map((c) => c[0]);
const runAll = (steps) => steps.forEach((s) => s.action && s.action());

describe('MinHeap core', () => {
  test('index helpers match the array-backed tree', () => {
    expect(parentOf(1)).toBe(0);
    expect(parentOf(2)).toBe(0);
    expect(parentOf(6)).toBe(2);
    expect(leftOf(0)).toBe(1);
    expect(rightOf(0)).toBe(2);
    expect(leftOf(2)).toBe(5);
    expect(rightOf(2)).toBe(6);
  });

  test('insert bubbles the smallest key to the root', () => {
    const h = new MinHeap();
    [5, 3, 8, 1].forEach((v) => h.insert(v));
    expect(h.items[0]).toBe(1);
    expect(h.size).toBe(4);
    // heap property holds everywhere (pair list avoids conditional expects)
    const satisfied = [];
    h.items.forEach((v, i) => {
      const l = leftOf(i);
      const r = rightOf(i);
      if (l < h.size) satisfied.push(v <= h.items[l]);
      if (r < h.size) satisfied.push(v <= h.items[r]);
    });
    expect(satisfied.every(Boolean)).toBe(true);
  });

  test('extractMin returns ascending order', () => {
    const h = new MinHeap([4, 2, 7, 1, 3]);
    const out = [];
    while (h.size > 0) out.push(h.extractMin());
    expect(out).toEqual([1, 2, 3, 4, 7]);
  });

  test('peek and empty extract are safe', () => {
    const h = new MinHeap();
    expect(h.peek()).toBeUndefined();
    const trace = [];
    expect(h.extractMin(trace)).toBeUndefined();
    expect(trace[trace.length - 1]).toEqual({ type: 'empty' });
  });
});

describe('buildInsertSteps', () => {
  test('empty heap: the key becomes the root', () => {
    const h = new MinHeap();
    const trace = [];
    h.insert(5, trace);
    const steps = buildInsertSteps([], 5, trace, makeUi());

    expect(descriptions(steps)).toEqual([
      'Creating a new key 5',
      'Heap is empty — 5 becomes the root',
      'Heap property restored — heap now has 1 keys',
    ]);
    expect(kinds(steps)).toEqual(['move', 'move', 'found']);
  });

  test('bubbling up narrates compare then swap per level', () => {
    const ui = makeUi();
    const h = new MinHeap([5]);
    const trace = [];
    h.insert(3, trace);
    const steps = buildInsertSteps([5], 3, trace, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new key 3',
      'Appending 3 at index 1',
      'Comparing 3 with parent at index 0 (value 5)',
      '3 < 5 → swap with parent (bubble up)',
      'Heap property restored — heap now has 2 keys',
    ]);
    expect(kinds(steps)).toEqual(['move', 'move', 'compare', 'move', 'found']);
    expect(steps.map((s) => s.line)).toEqual([1, 2, 4, 5, 7]);

    // display snapshots animate the swap: [5] → [5,3] → [3,5]
    runAll(steps);
    const snaps = displays(ui);
    expect(snaps[0]).toEqual([5]);
    expect(snaps[1]).toEqual([5, 3]);
    expect(snaps[3]).toEqual([3, 5]);
  });

  test('every step maps into the insert listing with a description', () => {
    const h = new MinHeap([9, 4, 7]);
    const trace = [];
    h.insert(2, trace);
    buildInsertSteps([9, 4, 7], 2, trace, makeUi()).forEach((s) => {
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(HEAP_PSEUDOCODE.insert.length);
    });
  });
});

describe('buildExtractSteps', () => {
  test('moves the last key to the root and sifts down', () => {
    const ui = makeUi();
    const h = new MinHeap([2, 5, 3, 7]);
    const trace = [];
    const min = h.extractMin(trace);
    expect(min).toBe(2);
    const steps = buildExtractSteps([2, 5, 3, 7], trace, ui);

    const text = descriptions(steps).join('\n');
    expect(text).toContain('Heap has 4 keys — extracting the minimum');
    expect(text).toContain('Minimum is 2 at the root');
    expect(text).toContain('Moving last key 7 to the root');
    expect(text).toContain('Comparing 7 with children 5 and 3 at index 0');
    expect(text).toContain('7 > smaller child 3 → swap');
    expect(text).toContain('Extracted minimum: 2');
    expect(steps[steps.length - 1].vars).toEqual({ min: 2 });
  });

  test('extracting from a two-key heap needs no sift', () => {
    const h = new MinHeap([3, 5]);
    const trace = [];
    h.extractMin(trace);
    const steps = buildExtractSteps([3, 5], trace, makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Moving last key 5 to the root');
    expect(text).not.toContain('Comparing');
    expect(text).toContain('Heap property restored');
  });
});

describe('buildPeekSteps', () => {
  test('reports the root minimum', () => {
    const steps = buildPeekSteps([2, 5, 3], makeUi());
    expect(descriptions(steps)).toEqual([
      'Finding the minimum (the root)',
      'Minimum is 2',
    ]);
    expect(steps[1].vars).toEqual({ min: 2 });
  });
});

describe('layoutHeap', () => {
  test('empty heap has no nodes', () => {
    const layout = layoutHeap(0);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.height).toBe(0);
  });

  test('a single root sits centered at depth 0', () => {
    const layout = layoutHeap(1);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.nodes[0]).toMatchObject({ index: 0, depth: 0 });
    expect(layout.nodes[0].x).toBeGreaterThan(0);
    expect(layout.edges).toEqual([]);
  });

  test('complete tree gains two children and depth-1 spacing', () => {
    const layout = layoutHeap(3);
    expect(layout.nodes.map((n) => n.depth)).toEqual([0, 1, 1]);
    expect(layout.edges).toHaveLength(2);
    expect(layout.edges[0]).toMatchObject({ parentIndex: 0, childIndex: 1 });
    expect(layout.edges[1]).toMatchObject({ parentIndex: 0, childIndex: 2 });
    expect(layout.nodes[2].x).toBeGreaterThan(layout.nodes[1].x);
  });

  test('deeper levels compress x spacing', () => {
    const layout = layoutHeap(7);
    const level1Gap = layout.nodes[2].x - layout.nodes[1].x;
    const level2Gap = layout.nodes[4].x - layout.nodes[3].x;
    expect(level2Gap).toBeLessThan(level1Gap);
    expect(layout.nodes.map((n) => n.depth)).toEqual([0, 1, 1, 2, 2, 2, 2]);
  });
});
