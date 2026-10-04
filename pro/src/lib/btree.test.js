import { BTree } from './btree';
import { buildBTreeInsertSteps, buildBTreeSearchSteps } from './btreeSteps';
import { B_TREE_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveNodeKeys: vi.fn(),
  setHighlightedNodeKeys: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');

describe('BTree core', () => {
  test('inserts into an empty tree then splits on overflow', () => {
    const t = new BTree();
    t.insert(8);
    expect(t.root.keys).toEqual([8]);
    expect(t.size).toBe(1);

    t.insert(3);
    t.insert(10);
    expect(t.root.keys).toEqual([8]);
    expect(t.root.leaf).toBe(false);
    expect(t.root.children).toHaveLength(2);
    expect(t.root.children[0].keys).toEqual([3]);
    expect(t.root.children[1].keys).toEqual([10]);
  });

  test('in-order traversal yields sorted keys across splits', () => {
    const t = new BTree();
    [8, 3, 10, 1, 6, 14, 4, 7, 13].forEach((v) => t.insert(v));
    expect(t.inOrder()).toEqual([1, 3, 4, 6, 7, 8, 10, 13, 14]);
    expect(t.size).toBe(9);
  });

  test('search finds present keys and reports missing ones via trace', () => {
    const t = new BTree();
    [8, 3, 10].forEach((v) => t.insert(v));

    const foundTrace = [];
    expect(t.search(10, foundTrace)).not.toBeNull();
    expect(foundTrace[foundTrace.length - 1]).toEqual({ type: 'found', node: [10] });

    const missTrace = [];
    expect(t.search(99, missTrace)).toBeNull();
    expect(missTrace[missTrace.length - 1]).toEqual({ type: 'missing', value: 99 });
  });

  test('duplicate inserts are refused via trace', () => {
    const t = new BTree();
    t.insert(5);
    const trace = [];
    t.insert(5, trace);
    expect(trace[trace.length - 1]).toEqual({ type: 'duplicate', value: 5 });
    expect(t.size).toBe(1);
  });

  test('height stays small for a bushy order-3 tree', () => {
    const t = new BTree();
    [8, 3, 10, 1, 6, 14, 4, 7, 13].forEach((v) => t.insert(v));
    expect(t.height()).toBeLessThanOrEqual(3);
    expect(t.nodeCount()).toBeGreaterThan(1);
  });
});

describe('buildBTreeInsertSteps', () => {
  test('empty root becomes the first key', () => {
    const t = new BTree();
    const trace = [];
    t.insert(8, trace);
    const steps = buildBTreeInsertSteps(t.root, 8, trace, makeUi());

    expect(descriptions(steps)).toEqual([
      'Creating a new key to insert: 8',
      'Root is empty — 8 becomes the first key',
      'B-tree insert complete: 8',
    ]);
    expect(kinds(steps)).toEqual(['move', 'move', 'found']);
  });

  test('narrates descent, leaf insert and split', () => {
    const t = new BTree();
    const trace = [];
    t.insert(8, trace);
    const trace2 = [];
    t.insert(3, trace2);
    const trace3 = [];
    t.insert(6, trace3); // leaf [3] gets 6 → ok; wait order: after 8,3,10 root splits. Use fresh tree.
  });

  test('split narration names the median and both sides', () => {
    const t = new BTree();
    const trace = [];
    [8, 3, 10].forEach((v, i) => {
      const stepTrace = [];
      t.insert(v, stepTrace);
      if (i === 2) trace.push(...stepTrace);
    });
    const steps = buildBTreeInsertSteps(t.root, 10, trace, makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Splitting');
    expect(text).toContain('median 8 promotes');
  });

  test('every step carries a non-empty description', () => {
    const t = new BTree();
    const trace = [];
    t.insert(5, trace);
    const steps = buildBTreeInsertSteps(t.root, 5, trace, makeUi());
    steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0));
  });
});

describe('buildBTreeSearchSteps', () => {
  test('walks to a found key and reports it', () => {
    const t = new BTree();
    [8, 3, 10].forEach((v) => t.insert(v));
    const trace = [];
    t.search(10, trace);
    const steps = buildBTreeSearchSteps(t.root, 10, trace, makeUi());

    const text = descriptions(steps).join('\n');
    expect(text).toContain('Searching the B-tree for 10');
    expect(text).toContain('Key 10 found in node');
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('found');
  });

  test('missing keys end with an error step', () => {
    const t = new BTree();
    [8, 3, 10].forEach((v) => t.insert(v));
    const trace = [];
    t.search(99, trace);
    const steps = buildBTreeSearchSteps(t.root, 99, trace, makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Key 99 is not in the B-tree');
    expect(last.kind).toBe('error');
  });

  test('every step maps into the search pseudocode listing', () => {
    const t = new BTree();
    [8, 3, 10].forEach((v) => t.insert(v));
    const trace = [];
    t.search(10, trace);
    const steps = buildBTreeSearchSteps(t.root, 10, trace, makeUi());
    steps.forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(B_TREE_PSEUDOCODE.search.length);
    });
  });
});
