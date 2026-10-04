import {
  buildValidateBSTSteps,
  buildMirrorSteps,
  buildLCASteps,
} from './treeAlgoSteps';
import { TREE_ALGO_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveNodeValue: vi.fn(),
  setHighlightedNodes: vi.fn(),
});

const node = (value, left = null, right = null) => ({ value, left, right });

// Balanced BST used across tests.
const validTree = () =>
  node(
    50,
    node(30, node(20), node(40)),
    node(70, node(60), node(80))
  );

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const runAll = (steps) => steps.forEach((s) => s.action && s.action());

describe('buildValidateBSTSteps', () => {
  test('walks the bounds and reports a valid BST', () => {
    const ui = makeUi();
    const steps = buildValidateBSTSteps(validTree(), ui);

    expect(descriptions(steps)[0]).toBe('Validating BST property with in-order bounds');
    expect(descriptions(steps)).toContain('Visiting node 50 (allowed -∞..∞)');
    expect(descriptions(steps)).toContain('Visiting node 20 (allowed -∞..30)');
    expect(descriptions(steps)[steps.length - 1]).toBe('Tree is a valid BST');
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('found');

    runAll(steps);
    expect(ui.setActiveNodeValue).toHaveBeenCalled();
  });

  test('flags an out-of-bounds node as a violation and stops', () => {
    const badTree = node(50, node(60), null);
    const steps = buildValidateBSTSteps(badTree, makeUi());

    expect(descriptions(steps)).toEqual([
      'Validating BST property with in-order bounds',
      'Visiting node 50 (allowed -∞..∞)',
      '50 is within (-∞..∞)',
      'Visiting node 60 (allowed -∞..50)',
      'BST violation: 60 is outside (-∞..50)',
      'Tree violates the BST property',
    ]);
    expect(kinds(steps)).toEqual(['move', 'compare', 'compare', 'compare', 'error', 'error']);
  });

  test('an empty tree is trivially valid', () => {
    const steps = buildValidateBSTSteps(null, makeUi());
    expect(descriptions(steps)).toEqual([
      'Validating BST property with in-order bounds',
      'Tree is a valid BST',
    ]);
  });
});

describe('buildMirrorSteps', () => {
  test('narrates child swaps and leaf visits', () => {
    const ui = makeUi();
    const steps = buildMirrorSteps(node(2, node(1), node(3)), ui);

    expect(descriptions(steps)).toEqual([
      'Mirroring the tree (swap every left/right child)',
      'Visiting node 2',
      'Swapping children of 2 (left 1 ↔ right 3)',
      'Visiting node 1',
      'Node 1 is a leaf — nothing to swap',
      'Visiting node 3',
      'Node 3 is a leaf — nothing to swap',
      'Tree mirrored',
    ]);
    expect(kinds(steps)).toEqual([
      'move',
      'compare',
      'move',
      'compare',
      'compare',
      'compare',
      'compare',
      'found',
    ]);
  });
});

describe('buildLCASteps', () => {
  test('searches both keys then walks to the split node', () => {
    const ui = makeUi();
    const steps = buildLCASteps(validTree(), 20, 40, ui);

    expect(descriptions(steps)).toEqual([
      'Finding LCA of 20 and 40',
      'Searching for 20',
      'Visiting node 50 (looking for 20)',
      'Visiting node 30 (looking for 20)',
      'Visiting node 20 (looking for 20)',
      'Value 20 found in the tree',
      'Searching for 40',
      'Visiting node 50 (looking for 40)',
      'Visiting node 30 (looking for 40)',
      'Visiting node 20 (looking for 40)',
      'Visiting node 40 (looking for 40)',
      'Value 40 found in the tree',
      'At node 50: 20 and 40 are both smaller → descend left',
      'At node 30: 20 < 30 but 40 > 30 → LCA is 30',
      'Lowest common ancestor of 20 and 40 is 30',
    ]);

    runAll(steps);
    expect(ui.setActiveNodeValue).toHaveBeenCalled();
    const last = steps[steps.length - 1];
    expect(last.vars).toEqual({ a: 20, b: 40, lca: 30 });
  });

  test('descends right when both keys are larger', () => {
    const steps = buildLCASteps(validTree(), 60, 80, makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('At node 50: 60 and 80 are both larger → descend right');
    expect(text).toContain('At node 70: 60 < 70 but 80 > 70 → LCA is 70');
    expect(descriptions(steps)[steps.length - 1]).toBe(
      'Lowest common ancestor of 60 and 80 is 70'
    );
  });

  test('a missing key ends with an error step', () => {
    const steps = buildLCASteps(validTree(), 999, 20, makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Value 999 is not in the tree');
    expect(kinds(steps)[kinds(steps).length - 1]).toBe('error');
  });
});

describe('pseudocode lines', () => {
  test('every step maps into its listing', () => {
    const ui = makeUi();
    const sets = [
      [buildValidateBSTSteps(validTree(), ui), TREE_ALGO_PSEUDOCODE.validate],
      [buildMirrorSteps(validTree(), ui), TREE_ALGO_PSEUDOCODE.mirror],
      [buildLCASteps(validTree(), 20, 40, ui), TREE_ALGO_PSEUDOCODE.lca],
    ];
    sets.forEach(([steps, listing]) => {
      steps.forEach((s) => {
        expect(Number.isInteger(s.line)).toBe(true);
        expect(s.line).toBeGreaterThanOrEqual(1);
        expect(s.line).toBeLessThanOrEqual(listing.length);
      });
    });
  });

  test('validate/mirror/lca pin their head lines', () => {
    const v = buildValidateBSTSteps(validTree(), makeUi());
    expect(v[0].line).toBe(1);
    expect(v[1].line).toBe(2);
    expect(v[v.length - 1].line).toBe(6);

    const m = buildMirrorSteps(node(2, node(1), node(3)), makeUi());
    expect(m[0].line).toBe(1);
    expect(m[2].line).toBe(4);
    expect(m[m.length - 1].line).toBe(7);

    const l = buildLCASteps(validTree(), 20, 40, makeUi());
    expect(l[0].line).toBe(1);
    expect(l[1].line).toBe(2);
    expect(l[6].line).toBe(3);
    expect(l[12].line).toBe(4);
    expect(l[13].line).toBe(6);
  });
});

describe('every step has a non-empty description', () => {
  test('all three builders', () => {
    const ui = makeUi();
    [
      buildValidateBSTSteps(validTree(), ui),
      buildMirrorSteps(validTree(), ui),
      buildLCASteps(validTree(), 30, 70, ui),
    ].forEach((steps) =>
      steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0))
    );
  });
});
