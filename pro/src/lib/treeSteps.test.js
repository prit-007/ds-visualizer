import { buildInsertSteps, buildDeleteSteps, buildSearchSteps, buildTraversalSteps } from './treeSteps';
import { AVLTree } from './avl';
import { TREE_PSEUDOCODE } from './pseudocode';

const build = (values) => {
  const tree = new AVLTree();
  values.forEach((v) => {
    tree.root = tree.insert(tree.root, v);
  });
  return tree;
};

const tracedInsert = (values, newValue) => {
  const tree = build(values);
  const trace = [];
  tree.root = tree.insert(tree.root, newValue, trace);
  return trace;
};

const tracedDelete = (values, target) => {
  const tree = build(values);
  const trace = [];
  tree.root = tree.deleteNode(tree.root, target, trace);
  return trace;
};

const makeUi = () => ({
  setActiveNodeValue: vi.fn(),
  setHighlightedNodes: vi.fn(),
  setRemovingNodeValue: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const activeCalls = (ui) => ui.setActiveNodeValue.mock.calls.map((c) => c[0]);
const highlightCalls = (ui) => ui.setHighlightedNodes.mock.calls.map((c) => c[0]);
const removingCalls = (ui) => ui.setRemovingNodeValue.mock.calls.map((c) => c[0]);

describe('buildInsertSteps', () => {
  test('walks the path and each comparison reports its own node', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([50, 30, 70], 25), 25, ui);

    expect(descriptions(steps)).toEqual([
      'Starting insertion of value 25',
      'Comparing with node 50',
      '25 < 50, moving to left subtree',
      'Comparing with node 30',
      '25 < 30, moving to left subtree',
      'Left child of 30 is empty, inserting 25 here',
      'Node 30: height 2, balance factor 1 (balanced)',
      'Node 50: height 3, balance factor 1 (balanced)',
      'Insertion complete, tree is balanced',
    ]);

    runAll(steps);

    // Regression: the old inline builder closed over a mutated `current`,
    // so every action reported the final node instead of its own.
    expect(activeCalls(ui)).toEqual([null, 50, 30, null, 25]);
    expect(highlightCalls(ui)).toEqual([
      [],
      [50],
      [30],
      [],
      [30],
      [50],
      [],
    ]);
  });

  test('walks right subtree with the correct comparison text', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([50, 30, 70], 80), 80, ui);

    expect(descriptions(steps)).toEqual([
      'Starting insertion of value 80',
      'Comparing with node 50',
      '80 > 50, moving to right subtree',
      'Comparing with node 70',
      '80 > 70, moving to right subtree',
      'Right child of 70 is empty, inserting 80 here',
      'Node 70: height 2, balance factor -1 (balanced)',
      'Node 50: height 3, balance factor -1 (balanced)',
      'Insertion complete, tree is balanced',
    ]);
    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 50, 70, null, 80]);
  });

  test('inserting into an empty tree narrates the root creation', () => {
    const ui = makeUi();
    const tree = new AVLTree();
    const trace = [];
    tree.root = tree.insert(tree.root, 42, trace);
    const steps = buildInsertSteps(trace, 42, ui);

    expect(descriptions(steps)).toEqual([
      'Starting insertion of value 42',
      'Tree is empty, 42 becomes the root',
      'Insertion complete, tree is balanced',
    ]);
    runAll(steps);
    expect(ui.setActiveNodeValue).toHaveBeenLastCalledWith(42);
  });

  test('narrates the left-left rebalance node by node', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([50, 30, 70, 20], 10), 10, ui);

    expect(descriptions(steps)).toEqual([
      'Starting insertion of value 10',
      'Comparing with node 50',
      '10 < 50, moving to left subtree',
      'Comparing with node 30',
      '10 < 30, moving to left subtree',
      'Comparing with node 20',
      '10 < 20, moving to left subtree',
      'Left child of 20 is empty, inserting 10 here',
      'Node 20: height 2, balance factor 1 (balanced)',
      'Node 30: height 3, balance factor 2 (unbalanced)',
      'Left-left case at 30: rotate right (20 moves up)',
      'Node 50: height 3, balance factor 1 (balanced)',
      'Insertion complete, tree is balanced',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 50, 30, 20, null, 30, 10]);
    expect(highlightCalls(ui)).toEqual([
      [],
      [50],
      [30],
      [20],
      [],
      [20],
      [30],
      [30, 20],
      [50],
      [],
    ]);
  });

  test('narrates the left-right double rotation', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([30, 20], 25), 25, ui);

    expect(descriptions(steps)).toEqual([
      'Starting insertion of value 25',
      'Comparing with node 30',
      '25 < 30, moving to left subtree',
      'Comparing with node 20',
      '25 > 20, moving to right subtree',
      'Right child of 20 is empty, inserting 25 here',
      'Node 20: height 2, balance factor -1 (balanced)',
      'Node 30: height 3, balance factor 2 (unbalanced)',
      'Left-right case at 30: rotate left at 20, then rotate right at 30',
      'Insertion complete, tree is balanced',
    ]);
    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 30, 20, null, 30, 25]);
  });

  test('narrates the right-right single rotation', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([50, 30, 70, 80], 90), 90, ui);
    const d = descriptions(steps);

    expect(d).toContain('Node 70: height 3, balance factor -2 (unbalanced)');
    expect(d).toContain('Right-right case at 70: rotate left (80 moves up)');
    expect(d[d.length - 1]).toBe('Insertion complete, tree is balanced');
    runAll(steps);
    expect(highlightCalls(ui)).toContainEqual([70, 80]);
    expect(ui.setActiveNodeValue).toHaveBeenLastCalledWith(90);
  });

  test('narrates the right-left double rotation', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([10, 20], 15), 15, ui);
    const d = descriptions(steps);

    expect(d).toContain('Node 10: height 3, balance factor -2 (unbalanced)');
    expect(d).toContain('Right-left case at 10: rotate right at 20, then rotate left at 10');
    runAll(steps);
    expect(ui.setActiveNodeValue).toHaveBeenLastCalledWith(15);
  });

  test('duplicate insert reports the duplicate and stops', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([50], 50), 50, ui);

    expect(descriptions(steps)).toEqual([
      'Starting insertion of value 50',
      'Comparing with node 50',
      '50 already exists in the tree, insertion skipped',
    ]);
    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 50, null]);
    expect(highlightCalls(ui)).toEqual([[], []]);
  });
});

describe('buildDeleteSteps', () => {
  test('deleting a leaf explains the walk and flags removal', () => {
    const ui = makeUi();
    const steps = buildDeleteSteps(tracedDelete([50, 30, 70, 20], 20), 20, ui);

    expect(descriptions(steps)).toEqual([
      'Starting deletion of value 20',
      'Checking node 50',
      '20 < 50, moving to left subtree',
      'Checking node 30',
      '20 < 30, moving to left subtree',
      'Checking node 20',
      'Found node 20 to delete',
      'Node has no children, simply removing it',
      'Node 30: height 1, balance factor 0 (balanced)',
      'Node 50: height 2, balance factor 0 (balanced)',
      'Deletion complete, tree is balanced',
    ]);

    runAll(steps);

    expect(activeCalls(ui)).toEqual([null, 50, 30, 20, null, null]);
    expect(removingCalls(ui)).toEqual([null, 20]);
    expect(highlightCalls(ui)).toEqual([
      [],
      [50],
      [30],
      [20],
      [30],
      [50],
      [],
    ]);
  });

  test('one-child delete narrates which child replaces the node', () => {
    const ui = makeUi();
    const steps = buildDeleteSteps(tracedDelete([50, 30, 70, 80], 70), 70, ui);

    expect(descriptions(steps)).toEqual([
      'Starting deletion of value 70',
      'Checking node 50',
      '70 > 50, moving to right subtree',
      'Checking node 70',
      'Found node 70 to delete',
      'Node has only right child, replacing with right child 80',
      'Node 50: height 2, balance factor 0 (balanced)',
      'Deletion complete, tree is balanced',
    ]);

    runAll(steps);
    expect(removingCalls(ui)).toEqual([null, 70]);
    expect(highlightCalls(ui)).toContainEqual([80]);
  });

  test('two-children delete explains the inorder successor step by step', () => {
    const ui = makeUi();
    const steps = buildDeleteSteps(tracedDelete([50, 30, 70, 20, 40, 60, 80], 50), 50, ui);
    const d = descriptions(steps);

    expect(d).toEqual([
      'Starting deletion of value 50',
      'Checking node 50',
      'Found node 50 to delete',
      'Node has two children, finding inorder successor',
      'Inorder successor: go left from 70 to 60',
      'Inorder successor is 60',
      'Replacing 50 with 60',
      'Now need to delete 60 from right subtree',
      'Checking node 70',
      '60 < 70, moving to left subtree',
      'Checking node 60',
      'Found node 60 to delete',
      'Node has no children, simply removing it',
      'Node 70: height 2, balance factor -1 (balanced)',
      'Node 60: height 3, balance factor 0 (balanced)',
      'Deletion complete, tree is balanced',
    ]);

    runAll(steps);
    // The target itself is not faded out — its slot is inherited by the
    // successor; only the successor's old node is removed from the view.
    expect(removingCalls(ui)).toEqual([null, 60]);
    expect(activeCalls(ui)).toEqual([null, 50, null, 60, 70, 60, null, null]);
    expect(d[d.length - 1]).toBe('Deletion complete, tree is balanced');
  });

  test('deletion narrates rebalance rotations node by node', () => {
    const ui = makeUi();
    const steps = buildDeleteSteps(tracedDelete([50, 30, 70, 20, 40], 70), 70, ui);

    expect(descriptions(steps)).toEqual([
      'Starting deletion of value 70',
      'Checking node 50',
      '70 > 50, moving to right subtree',
      'Checking node 70',
      'Found node 70 to delete',
      'Node has no children, simply removing it',
      'Node 50: height 3, balance factor 2 (unbalanced)',
      'Left-left case at 50: rotate right (30 moves up)',
      'Deletion complete, tree is balanced',
    ]);

    runAll(steps);
    expect(highlightCalls(ui)).toContainEqual([50, 30]);
  });

  test('every step has a non-empty description', () => {
    const steps = buildDeleteSteps(tracedDelete([50, 30], 50), 50, makeUi());
    steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0));
  });

  test('missing value reports the miss and still finishes safely', () => {
    const ui = makeUi();
    const trace = [
      { type: 'compare', node: 50, value: 99 },
      { type: 'move', node: 50, dir: 'right' },
      { type: 'missing', value: 99 },
      { type: 'recheck', node: 50, height: 1, balance: 0 },
    ];
    const steps = buildDeleteSteps(trace, 99, ui);

    expect(descriptions(steps)).toEqual([
      'Starting deletion of value 99',
      'Checking node 50',
      '99 > 50, moving to right subtree',
      '99 does not exist in the tree',
      'Node 50: height 1, balance factor 0 (balanced)',
      'Deletion complete, tree is balanced',
    ]);
    expect(() => runAll(steps)).not.toThrow();
    expect(removingCalls(ui)).toEqual([null]);
  });
});

describe('buildTraversalSteps', () => {
  const makeTraversalUi = () => ({
    setActiveNodeValue: vi.fn(),
    setHighlightedNodes: vi.fn(),
    setTraversalResult: vi.fn(),
  });

  const root = () => {
    const tree = build([50, 30, 70, 20]);
    return tree.root;
  };

  test('in-order narrates descend, visit and backtrack with absolute results', () => {
    const ui = makeTraversalUi();
    const steps = buildTraversalSteps(root(), 'inOrder', ui);

    expect(descriptions(steps)).toEqual([
      'Starting inOrder traversal',
      'Moving to left child of 50',
      'Moving to left child of 30',
      'Visit node 20',
      'Back at 30 after left subtree',
      'Visit node 30',
      'Back at 50 after left subtree',
      'Visit node 50',
      'Moving to right child of 50',
      'Visit node 70',
      'Back at 50 after right subtree',
      'inOrder traversal complete',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 20, 30, 30, 50, 50, 70, 50, null]);
    expect(ui.setTraversalResult.mock.calls.map((c) => c[0])).toEqual([
      [],
      [20],
      [20, 30],
      [20, 30, 50],
      [20, 30, 50, 70],
    ]);
  });

  test('pre-order visits each node before descending', () => {
    const ui = makeTraversalUi();
    const steps = buildTraversalSteps(root(), 'preOrder', ui);

    expect(descriptions(steps)).toEqual([
      'Starting preOrder traversal',
      'Visit node 50',
      'Moving to left child of 50',
      'Visit node 30',
      'Moving to left child of 30',
      'Visit node 20',
      'Back at 30 after left subtree',
      'Back at 50 after left subtree',
      'Moving to right child of 50',
      'Visit node 70',
      'Back at 50 after right subtree',
      'preOrder traversal complete',
    ]);

    runAll(steps);
    expect(ui.setTraversalResult).toHaveBeenLastCalledWith([50, 30, 20, 70]);
  });

  test('post-order visits each node after both subtrees', () => {
    const ui = makeTraversalUi();
    const steps = buildTraversalSteps(root(), 'postOrder', ui);

    expect(descriptions(steps)).toEqual([
      'Starting postOrder traversal',
      'Moving to left child of 50',
      'Moving to left child of 30',
      'Visit node 20',
      'Back at 30 after left subtree',
      'Visit node 30',
      'Back at 50 after left subtree',
      'Moving to right child of 50',
      'Visit node 70',
      'Back at 50 after right subtree',
      'Visit node 50',
      'postOrder traversal complete',
    ]);

    runAll(steps);
    expect(ui.setTraversalResult).toHaveBeenLastCalledWith([20, 30, 70, 50]);
  });

  test('replaying all actions converges to the same result (scrub-safe)', () => {
    const ui = makeTraversalUi();
    const steps = buildTraversalSteps(root(), 'inOrder', ui);

    runAll(steps);
    runAll(steps);

    expect(ui.setTraversalResult).toHaveBeenLastCalledWith([20, 30, 50, 70]);
    expect(ui.setActiveNodeValue).toHaveBeenLastCalledWith(null);
    expect(ui.setHighlightedNodes).toHaveBeenLastCalledWith([]);
  });

  test('empty tree produces just the start and complete steps', () => {
    const ui = makeTraversalUi();
    const steps = buildTraversalSteps(null, 'inOrder', ui);

    expect(descriptions(steps)).toEqual([
      'Starting inOrder traversal',
      'inOrder traversal complete',
    ]);
    expect(() => runAll(steps)).not.toThrow();
  });

  test('every step has a non-empty description', () => {
    const steps = buildTraversalSteps(root(), 'inOrder', makeTraversalUi());
    steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0));
  });
});

describe('buildSearchSteps', () => {
  test('found value traces comparisons then reports the hit', () => {
    const tree = build([50, 30, 70]);
    const ui = makeUi();
    const steps = buildSearchSteps(tree.root, 30, ui);

    expect(descriptions(steps)).toEqual([
      'Starting search for value 30',
      'Checking node 50',
      '30 < 50, moving to left subtree',
      'Checking node 30',
      'Found 30!',
    ]);

    runAll(steps);
    expect(ui.setActiveNodeValue.mock.calls.map((c) => c[0])).toEqual([null, 50, 30]);
    expect(ui.setHighlightedNodes).toHaveBeenLastCalledWith([30]);
  });

  test('missing value: all actions run safely and the last step says not found', () => {
    const tree = build([50, 30, 70]);
    const ui = makeUi();
    const steps = buildSearchSteps(tree.root, 99, ui);

    expect(descriptions(steps)).toEqual([
      'Starting search for value 99',
      'Checking node 50',
      '99 > 50, moving to right subtree',
      'Checking node 70',
      '99 > 70, moving to right subtree',
      '99 not found in the tree',
    ]);

    // Regression: the old builder let `current` end as null, so one action
    // dereferenced null.value during the animation.
    expect(() => runAll(steps)).not.toThrow();
    expect(ui.setHighlightedNodes).toHaveBeenLastCalledWith([]);
  });
});

describe('semantic step kinds', () => {
  const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');

  test('insert steps tag kinds by event type', () => {
    const trace = [
      { type: 'compare', node: 50, value: 60 },
      { type: 'move', node: 50, dir: 'right' },
      { type: 'created', value: 60 },
      { type: 'recheck', node: 50, height: 2, balance: 1 },
      { type: 'rotate', case: 'RR', node: 50, child: 60 },
    ];
    expect(kinds(buildInsertSteps(trace, 60, makeUi()))).toEqual([
      'neutral',
      'compare',
      'move',
      'found',
      'compare',
      'move',
      'found',
    ]);
  });

  test('delete steps tag matches, replacements and misses', () => {
    const matchTrace = [
      { type: 'compare', node: 50, value: 50 },
      { type: 'replace', replacement: null, side: 'none' },
    ];
    expect(kinds(buildDeleteSteps(matchTrace, 50, makeUi()))).toEqual([
      'neutral',
      'compare',
      'found',
      'move',
      'found',
    ]);

    const missingTrace = [{ type: 'missing', value: 40 }];
    expect(kinds(buildDeleteSteps(missingTrace, 40, makeUi()))).toEqual([
      'neutral',
      'error',
      'found',
    ]);
  });

  test('traversal steps tag moves and visits', () => {
    const tree = build([50, 30, 70]);
    const ui = { ...makeUi(), setTraversalResult: vi.fn() };
    expect(kinds(buildTraversalSteps(tree.root, 'inOrder', ui))).toEqual([
      'neutral',
      'move',
      'found',
      'move',
      'found',
      'move',
      'found',
      'move',
      'found',
    ]);
  });

  test('search steps tag comparisons, hits and misses', () => {
    const tree = build([50, 30, 70]);
    expect(kinds(buildSearchSteps(tree.root, 70, makeUi()))).toEqual([
      'neutral',
      'compare',
      'compare',
      'compare',
      'found',
    ]);
    expect(kinds(buildSearchSteps(tree.root, 99, makeUi()))).toEqual([
      'neutral',
      'compare',
      'compare',
      'compare',
      'compare',
      'error',
    ]);
  });
});

describe('pseudocode lines and variable watch', () => {
  test('insert steps map onto the treeInsert pseudocode', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(tracedInsert([50, 30], 25), 25, ui);
    steps.forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(TREE_PSEUDOCODE.insert.length);
    });
    expect(steps[0].line).toBe(1);
    expect(steps[0].vars).toEqual({ value: 25 });

    const compare = steps.find((s) => s.kind === 'compare');
    expect(compare.line).toBe(3);
    expect(compare.vars).toEqual({ target: 25, node: 50 });

    const move = steps.find((s) => s.kind === 'move');
    expect(move.line).toBe(4);
    expect(move.vars).toEqual({ target: 25, node: 50 });

    const created = steps.find((s) => s.kind === 'found' && s !== steps[steps.length - 1]);
    expect(created.line).toBe(2);
    expect(created.vars).toEqual({ value: 25 });

    expect(steps[steps.length - 1].line).toBe(13);
    expect(steps[steps.length - 1].vars).toEqual({ value: 25 });
  });

  test('recheck and rotation steps expose height, balance and case', () => {
    // [50,30,20] would already rotate during build (LL at 50); use a
    // tree that stays deep so inserting 10 triggers the LL rotation here.
    const steps = buildInsertSteps(tracedInsert([50, 30], 10), 10, makeUi());

    const recheck = steps.find((s) => s.description.includes('height'));
    expect(recheck.line).toBe(9);
    expect(recheck.vars).toMatchObject({
      height: expect.any(Number),
      balance: expect.any(Number),
    });

    const rotate = steps.find((s) => s.kind === 'move' && s.description.includes('rotate'));
    expect([10, 11]).toContain(rotate.line);
    expect(rotate.vars).toHaveProperty('case');
  });

  test('delete steps expose successor wiring', () => {
    const steps = buildDeleteSteps(tracedDelete([50, 30, 70], 50), 50, makeUi());
    steps.forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(TREE_PSEUDOCODE.delete.length);
    });

    const two = steps.find((s) => s.description.includes('two children'));
    expect(two.line).toBe(6);

    const copy = steps.find((s) => s.description.startsWith('Replacing'));
    expect(copy.line).toBe(8);
    expect(copy.vars).toEqual({ from: 50, to: 70 });

    const notFound = buildDeleteSteps(
      tracedDelete([50, 30, 70], 99),
      99,
      makeUi()
    );
    const missing = notFound.find((s) => s.kind === 'error');
    expect(missing.line).toBe(2);
    expect(missing.vars).toEqual({ value: 99 });

    expect(steps[steps.length - 1].line).toBe(13);
  });

  test('search steps follow the while-loop pseudocode', () => {
    const tree = build([50, 30, 70]);
    const found = buildSearchSteps(tree.root, 70, makeUi());
    expect(found[0].line).toBe(1);
    expect(found[0].vars).toEqual({ value: 70 });
    expect(found[1].line).toBe(3);
    expect(found[1].vars).toEqual({ node: 50 });
    expect(found[2].line).toBe(5);
    expect(found[3].line).toBe(3);
    expect(found[4].line).toBe(3);
    expect(found[4].vars).toEqual({ value: 70 });
    found.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(TREE_PSEUDOCODE.search.length)
    );

    const missing = buildSearchSteps(tree.root, 99, makeUi());
    expect(missing[missing.length - 1].line).toBe(6);
    expect(missing[missing.length - 1].vars).toEqual({ value: 99 });
  });

  test('traversal steps carry visit variables per variant', () => {
    const tree = build([20, 10, 30]);

    const pre = buildTraversalSteps(tree.root, 'preOrder', makeUi());
    pre.forEach((s) =>
      expect(s.line).toBeGreaterThanOrEqual(1)
    );
    expect(pre[0].line).toBe(1);
    const preVisit = pre.find((s) => s.description.startsWith('Visit'));
    expect(preVisit.line).toBe(3);
    expect(preVisit.vars).toEqual({ node: 20 });

    const inOrder = buildTraversalSteps(tree.root, 'inOrder', makeUi());
    const inVisit = inOrder.find((s) => s.description.startsWith('Visit'));
    expect(inVisit.line).toBe(4);

    const post = buildTraversalSteps(tree.root, 'postOrder', makeUi());
    const postVisit = post.find((s) => s.description.startsWith('Visit'));
    expect(postVisit.line).toBe(5);
    expect(postVisit.vars).toEqual({ node: 10 });
  });

  test('levelOrder steps follow the queue pseudocode', () => {
    const tree = build([20, 10, 30]);
    const steps = buildTraversalSteps(tree.root, 'levelOrder', makeUi());

    steps.forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(
        TREE_PSEUDOCODE['traversal-levelOrder'].length
      );
    });

    expect(steps[0].line).toBe(1);
    expect(steps[0].vars).toEqual({ type: 'levelOrder' });

    const visits = steps.filter((s) => s.description.startsWith('Visit'));
    expect(visits.map((s) => s.description)).toEqual([
      'Visit node 20',
      'Visit node 10',
      'Visit node 30',
    ]);
    visits.forEach((v) => {
      expect(v.line).toBe(5);
      expect(v.vars).toEqual({ node: expect.any(Number) });
    });

    const enqueues = steps.filter((s) => s.description.startsWith('Enqueue'));
    expect(enqueues).toHaveLength(2);
    expect(enqueues[0].line).toBe(6);
    expect(enqueues[0].vars).toEqual({ parent: 20, child: 10 });
    expect(enqueues[1].line).toBe(7);
    expect(enqueues[1].vars).toEqual({ parent: 20, child: 30 });

    expect(steps[steps.length - 1].line).toBe(8);
    expect(steps[steps.length - 1].vars).toEqual({ type: 'levelOrder' });
  });
});

describe('counterfactual narration (rotations disabled)', () => {
  test('rotate-skipped events narrate the skipped rotation and final imbalance', () => {
    const tree = new AVLTree({ rotations: false });
    const trace = [];
    tree.root = tree.insert(tree.root, 30, trace);
    tree.root = tree.insert(tree.root, 20, trace);
    tree.root = tree.insert(tree.root, 10, trace);

    const ui = makeUi();
    const steps = buildInsertSteps(trace, 10, ui);

    const skipped = steps.find((s) => s.description.includes('Rotations disabled'));
    expect(skipped).toBeDefined();
    expect(skipped.kind).toBe('error');
    expect(skipped.vars).toEqual({ case: 'LL', node: 30 });
    expect(descriptions(steps)[steps.length - 1]).toMatch(/unbalanced/);
    runAll(steps);
    expect(ui.setHighlightedNodes).toHaveBeenCalled();
  });

  test('delete narration ends unbalanced when rotations are off', () => {
    const tree = new AVLTree({ rotations: false });
    const trace = [];
    tree.root = tree.insert(tree.root, 30, trace);
    tree.root = tree.insert(tree.root, 10, trace);
    tree.root = tree.insert(tree.root, 20, trace);
    tree.root = tree.insert(tree.root, 5, trace);
    const deleteTrace = [];
    tree.root = tree.deleteNode(tree.root, 20, deleteTrace);

    const ui = makeUi();
    const steps = buildDeleteSteps(deleteTrace, 20, ui);
    expect(descriptions(steps)[steps.length - 1]).toMatch(/unbalanced/);
  });
});
