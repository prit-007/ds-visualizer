import { AVLTree } from './avl';

const build = (values) => {
  const tree = new AVLTree();
  values.forEach((v) => {
    tree.root = tree.insert(tree.root, v);
  });
  return tree;
};

describe('AVLTree insert', () => {
  test('first insert creates a single-node tree', () => {
    const tree = new AVLTree();
    tree.root = tree.insert(tree.root, 42);
    expect(tree.root.value).toBe(42);
    expect(tree.nodeCount).toBe(1);
  });

  test('second insert does not crash', () => {
    const tree = build([20, 10]);
    expect(tree.inOrder(tree.root)).toEqual([10, 20]);
  });

  test('keeps inorder sorted for a mixed sequence', () => {
    const tree = build([50, 30, 70, 20, 40, 60, 80, 25, 35]);
    expect(tree.inOrder(tree.root)).toEqual([20, 25, 30, 35, 40, 50, 60, 70, 80]);
  });

  test('ignores duplicate values', () => {
    const tree = build([5, 5, 5]);
    expect(tree.nodeCount).toBe(1);
    expect(tree.inOrder(tree.root)).toEqual([5]);
  });

  test('right-rotates on left-left case (30, 20, 10 -> root 20)', () => {
    const tree = build([30, 20, 10]);
    expect(tree.root.value).toBe(20);
    expect(tree.inOrder(tree.root)).toEqual([10, 20, 30]);
  });

  test('left-rotates on right-right case (10, 20, 30 -> root 20)', () => {
    const tree = build([10, 20, 30]);
    expect(tree.root.value).toBe(20);
  });

  test('left-right case (30, 10, 20 -> root 20)', () => {
    const tree = build([30, 10, 20]);
    expect(tree.root.value).toBe(20);
    expect(tree.inOrder(tree.root)).toEqual([10, 20, 30]);
  });

  test('right-left case (10, 30, 20 -> root 20)', () => {
    const tree = build([10, 30, 20]);
    expect(tree.root.value).toBe(20);
    expect(tree.inOrder(tree.root)).toEqual([10, 20, 30]);
  });

  test('reports height after balancing', () => {
    const tree = build([30, 20, 10]);
    expect(tree.getHeight(tree.root)).toBe(2);
    expect(tree.isBalanced()).toBe(true);
  });
});

describe('AVLTree delete', () => {
  test('deletes a leaf node', () => {
    const tree = build([50, 30, 70, 20]);
    tree.root = tree.deleteNode(tree.root, 20);
    expect(tree.inOrder(tree.root)).toEqual([30, 50, 70]);
    expect(tree.nodeCount).toBe(3);
  });

  test('deletes a node with one child', () => {
    const tree = build([50, 30, 70, 20]);
    tree.root = tree.deleteNode(tree.root, 30);
    expect(tree.inOrder(tree.root)).toEqual([20, 50, 70]);
    expect(tree.nodeCount).toBe(3);
  });

  test('deletes a node with two children (inorder successor)', () => {
    const tree = build([50, 30, 70, 20, 40, 60, 80]);
    tree.root = tree.deleteNode(tree.root, 40);
    expect(tree.inOrder(tree.root)).toEqual([20, 30, 50, 60, 70, 80]);
    expect(tree.search(tree.root, 40)).toBe(false);
    expect(tree.nodeCount).toBe(6);
  });

  test('deleting a missing value leaves the tree unchanged', () => {
    const tree = build([50, 30, 70]);
    const before = tree.inOrder(tree.root);
    tree.root = tree.deleteNode(tree.root, 999);
    expect(tree.inOrder(tree.root)).toEqual(before);
    expect(tree.nodeCount).toBe(3);
  });

  test('deletes from empty tree safely', () => {
    const tree = new AVLTree();
    tree.root = tree.deleteNode(tree.root, 1);
    expect(tree.root).toBeNull();
    expect(tree.nodeCount).toBe(0);
  });

  test('rebalances after delete', () => {
    const tree = build([30, 20, 10, 40]);
    tree.root = tree.deleteNode(tree.root, 40);
    expect(tree.isBalanced()).toBe(true);
    expect(tree.inOrder(tree.root)).toEqual([10, 20, 30]);
  });
});

describe('search, traversals and height utilities', () => {
  test('search finds existing values and rejects missing ones', () => {
    const tree = build([50, 30, 70]);
    expect(tree.search(tree.root, 30)).toBe(true);
    expect(tree.search(tree.root, 300)).toBe(false);
    expect(tree.search(null, 1)).toBe(false);
  });

  test('pre/in/post order traversals', () => {
    const tree = build([50, 30, 70, 20]);
    expect(tree.preOrder(tree.root)).toEqual([50, 30, 20, 70]);
    expect(tree.inOrder(tree.root)).toEqual([20, 30, 50, 70]);
    expect(tree.postOrder(tree.root)).toEqual([20, 30, 70, 50]);
  });

  test('levelOrder visits breadth-first', () => {
    const tree = build([20, 10, 30, 5, 15, 25, 35]);
    expect(tree.levelOrder(tree.root)).toEqual([20, 10, 30, 5, 15, 25, 35]);
  });

  test('levelOrder on an empty tree returns an empty result', () => {
    expect(new AVLTree().levelOrder(null)).toEqual([]);
    expect(new AVLTree().levelOrder(null, [])).toEqual([]);
  });

  test('getHeight is a non-recursive utility', () => {
    const tree = build([50, 30]);
    expect(tree.getHeight(null)).toBe(0);
    expect(tree.getHeight(tree.root)).toBe(tree.root.height);
  });
});

describe('nodeCount invariants', () => {
  test('every mutation updates the count exactly once', () => {
    const tree = new AVLTree();
    tree.root = tree.insert(tree.root, 50);
    tree.root = tree.insert(tree.root, 30);
    tree.root = tree.insert(tree.root, 70);
    expect(tree.nodeCount).toBe(3);

    tree.root = tree.insert(tree.root, 50);
    expect(tree.nodeCount).toBe(3);

    tree.root = tree.deleteNode(tree.root, 70);
    expect(tree.nodeCount).toBe(2);

    tree.root = tree.deleteNode(tree.root, 999);
    expect(tree.nodeCount).toBe(2);

    tree.root = tree.deleteNode(tree.root, 50);
    expect(tree.nodeCount).toBe(1);

    tree.root = tree.deleteNode(tree.root, 30);
    expect(tree.nodeCount).toBe(0);
    expect(tree.root).toBeNull();
  });
});

describe('operation traces', () => {
  const tracedInsert = (values, newValue) => {
    const tree = build(values);
    const trace = [];
    tree.root = tree.insert(tree.root, newValue, trace);
    expect(tree.isBalanced()).toBe(true);
    return trace;
  };

  const tracedDelete = (values, target) => {
    const tree = build(values);
    const trace = [];
    tree.root = tree.deleteNode(tree.root, target, trace);
    expect(tree.isBalanced()).toBe(true);
    return trace;
  };

  test('insert walk emits compare, move, created and per-node recheck events', () => {
    const trace = tracedInsert([10, 20], 15);
    expect(trace).toEqual([
      { type: 'compare', node: 10, value: 15 },
      { type: 'move', node: 10, dir: 'right' },
      { type: 'compare', node: 20, value: 15 },
      { type: 'move', node: 20, dir: 'left' },
      { type: 'created', value: 15 },
      { type: 'recheck', node: 20, height: 2, balance: 1 },
      { type: 'recheck', node: 10, height: 3, balance: -2 },
      { type: 'rotate', case: 'RL', node: 10, child: 20 },
    ]);
  });

  test('insert emits an LL rotation event with node and child', () => {
    const trace = tracedInsert([50, 30, 70, 20], 10);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 10 },
      { type: 'move', node: 50, dir: 'left' },
      { type: 'compare', node: 30, value: 10 },
      { type: 'move', node: 30, dir: 'left' },
      { type: 'compare', node: 20, value: 10 },
      { type: 'move', node: 20, dir: 'left' },
      { type: 'created', value: 10 },
      { type: 'recheck', node: 20, height: 2, balance: 1 },
      { type: 'recheck', node: 30, height: 3, balance: 2 },
      { type: 'rotate', case: 'LL', node: 30, child: 20 },
      { type: 'recheck', node: 50, height: 3, balance: 1 },
    ]);
  });

  test('insert emits an LR rotation event', () => {
    const trace = tracedInsert([30, 20], 25);
    expect(trace).toEqual([
      { type: 'compare', node: 30, value: 25 },
      { type: 'move', node: 30, dir: 'left' },
      { type: 'compare', node: 20, value: 25 },
      { type: 'move', node: 20, dir: 'right' },
      { type: 'created', value: 25 },
      { type: 'recheck', node: 20, height: 2, balance: -1 },
      { type: 'recheck', node: 30, height: 3, balance: 2 },
      { type: 'rotate', case: 'LR', node: 30, child: 20 },
    ]);
  });

  test('insert emits an RR rotation event', () => {
    const trace = tracedInsert([50, 30, 70, 80], 90);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 90 },
      { type: 'move', node: 50, dir: 'right' },
      { type: 'compare', node: 70, value: 90 },
      { type: 'move', node: 70, dir: 'right' },
      { type: 'compare', node: 80, value: 90 },
      { type: 'move', node: 80, dir: 'right' },
      { type: 'created', value: 90 },
      { type: 'recheck', node: 80, height: 2, balance: -1 },
      { type: 'recheck', node: 70, height: 3, balance: -2 },
      { type: 'rotate', case: 'RR', node: 70, child: 80 },
      { type: 'recheck', node: 50, height: 3, balance: -1 },
    ]);
  });

  test('duplicate insert emits compare then duplicate', () => {
    const trace = tracedInsert([50], 50);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 50 },
      { type: 'duplicate', node: 50 },
    ]);
  });

  test('leaf delete emits compare, match, replace and ancestor rechecks', () => {
    const trace = tracedDelete([50, 30, 70, 20], 20);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 20 },
      { type: 'move', node: 50, dir: 'left' },
      { type: 'compare', node: 30, value: 20 },
      { type: 'move', node: 30, dir: 'left' },
      { type: 'compare', node: 20, value: 20 },
      { type: 'replace', node: 20, replacement: null, side: 'none' },
      { type: 'recheck', node: 30, height: 1, balance: 0 },
      { type: 'recheck', node: 50, height: 2, balance: 0 },
    ]);
  });

  test('delete emits LL rotation event when left side shrinks', () => {
    const trace = tracedDelete([50, 30, 70, 20, 40], 70);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 70 },
      { type: 'move', node: 50, dir: 'right' },
      { type: 'compare', node: 70, value: 70 },
      { type: 'replace', node: 70, replacement: null, side: 'none' },
      { type: 'recheck', node: 50, height: 3, balance: 2 },
      { type: 'rotate', case: 'LL', node: 50, child: 30 },
    ]);
  });

  test('delete emits LR rotation event when the left child is right-heavy', () => {
    const trace = tracedDelete([50, 30, 60, 20, 40, 65, 35], 65);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 65 },
      { type: 'move', node: 50, dir: 'right' },
      { type: 'compare', node: 60, value: 65 },
      { type: 'move', node: 60, dir: 'right' },
      { type: 'compare', node: 65, value: 65 },
      { type: 'replace', node: 65, replacement: null, side: 'none' },
      { type: 'recheck', node: 60, height: 1, balance: 0 },
      { type: 'recheck', node: 50, height: 4, balance: 2 },
      { type: 'rotate', case: 'LR', node: 50, child: 30 },
    ]);
  });

  test('delete emits RR rotation event when the right side shrinks', () => {
    const trace = tracedDelete([20, 10, 30, 40], 10);
    expect(trace).toEqual([
      { type: 'compare', node: 20, value: 10 },
      { type: 'move', node: 20, dir: 'left' },
      { type: 'compare', node: 10, value: 10 },
      { type: 'replace', node: 10, replacement: null, side: 'none' },
      { type: 'recheck', node: 20, height: 3, balance: -2 },
      { type: 'rotate', case: 'RR', node: 20, child: 30 },
    ]);
  });

  test('two-children delete emits successor search, copy and second-pass events', () => {
    const trace = tracedDelete([50, 30, 70, 20, 40, 60, 80], 50);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 50 },
      { type: 'two-children', node: 50 },
      { type: 'successor-descend', from: 70, to: 60 },
      { type: 'successor-found', value: 60 },
      { type: 'copy-successor', from: 50, to: 60 },
      { type: 'compare', node: 70, value: 60 },
      { type: 'move', node: 70, dir: 'left' },
      { type: 'compare', node: 60, value: 60 },
      { type: 'replace', node: 60, replacement: null, side: 'none' },
      { type: 'recheck', node: 70, height: 2, balance: -1 },
      { type: 'recheck', node: 60, height: 3, balance: 0 },
    ]);
  });

  test('missing delete value emits a missing event after the walk', () => {
    const tree = build([50]);
    const trace = [];
    tree.root = tree.deleteNode(tree.root, 99, trace);
    expect(trace).toEqual([
      { type: 'compare', node: 50, value: 99 },
      { type: 'move', node: 50, dir: 'right' },
      { type: 'missing', value: 99 },
      { type: 'recheck', node: 50, height: 1, balance: 0 },
    ]);
  });
});

describe('property: random insert sequences stay sorted and balanced', () => {
  test('inorder equals sorted input and every node is balanced', async () => {
    const fc = (await import('fast-check')).default;
    await fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: -999, max: 999 }), { maxLength: 40 }),
        (values) => {
          const tree = build(values);
          expect(tree.inOrder(tree.root)).toEqual([...values].sort((a, b) => a - b));
          expect(tree.isBalanced()).toBe(true);
          expect(tree.nodeCount).toBe(values.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('counterfactual: rotations disabled', () => {
  const buildNoRotate = (values) => {
    const tree = new AVLTree({ rotations: false });
    values.forEach((v) => {
      tree.root = tree.insert(tree.root, v);
    });
    return tree;
  };

  test('an LL sequence stays unbalanced but sorted and fully counted', () => {
    const tree = new AVLTree({ rotations: false });
    const trace = [];
    tree.root = tree.insert(tree.root, 30, trace);
    tree.root = tree.insert(tree.root, 20, trace);
    tree.root = tree.insert(tree.root, 10, trace);

    expect(tree.root.value).toBe(30);
    expect(tree.isBalanced()).toBe(false);
    expect(tree.inOrder(tree.root)).toEqual([10, 20, 30]);
    expect(tree.nodeCount).toBe(3);
    expect(tree.root.height).toBe(3);
    expect(trace.filter((e) => e.type === 'rotate')).toHaveLength(0);
    expect(trace.filter((e) => e.type === 'rotate-skipped').length).toBeGreaterThan(0);
    expect(trace.filter((e) => e.type === 'recheck').length).toBeGreaterThan(0);
  });

  test('delete still works and narrates without rotations', () => {
    const tree = buildNoRotate([30, 20, 10, 40]);
    const trace = [];
    tree.root = tree.deleteNode(tree.root, 20, trace);

    expect(tree.inOrder(tree.root)).toEqual([10, 30, 40]);
    expect(tree.nodeCount).toBe(3);
    expect(trace.filter((e) => e.type === 'rotate')).toHaveLength(0);
  });

  test('the default tree still rotates (regression)', () => {
    const tree = new AVLTree();
    const trace = [];
    tree.root = tree.insert(tree.root, 30, trace);
    tree.root = tree.insert(tree.root, 20, trace);
    tree.root = tree.insert(tree.root, 10, trace);

    expect(tree.root.value).toBe(20);
    expect(tree.isBalanced()).toBe(true);
    expect(trace.filter((e) => e.type === 'rotate')).toHaveLength(1);
    expect(trace.filter((e) => e.type === 'rotate-skipped')).toHaveLength(0);
  });
});
