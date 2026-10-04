import { layoutTree, NODE_RADIUS, H_GAP, V_GAP, CANVAS_PAD } from './treeLayout';
import { AVLTree } from './avl';

const build = (values) => {
  const tree = new AVLTree();
  values.forEach((v) => {
    tree.root = tree.insert(tree.root, v);
  });
  return tree;
};

const byValue = (nodes) =>
  Object.fromEntries(nodes.map((n) => [n.value, n]));

test('empty tree yields an empty canvas', () => {
  const layout = layoutTree(null);
  expect(layout.nodes).toEqual([]);
  expect(layout.edges).toEqual([]);
  expect(layout.width).toBe(0);
  expect(layout.height).toBe(0);
});

test('in-order slotting keeps x ascending with constant depth spacing', () => {
  const layout = layoutTree(build([20, 10, 30]).root);

  expect(layout.nodes.map((n) => n.value)).toEqual([10, 20, 30]);
  const [ten, twenty, thirty] = layout.nodes;

  expect(ten.x).toBe(CANVAS_PAD);
  expect(thirty.x - twenty.x).toBe(twenty.x - ten.x);
  expect(twenty.x - ten.x).toBe(H_GAP);

  expect(ten.y).toBe(thirty.y);
  expect(ten.y - twenty.y).toBe(V_GAP);
});

test('edges run parent-bottom to child-top with radius clearance', () => {
  const layout = layoutTree(build([20, 10, 30]).root);
  const map = byValue(layout.nodes);

  expect(layout.edges).toHaveLength(2);
  const left = layout.edges.find((e) => e.side === 'left');
  const right = layout.edges.find((e) => e.side === 'right');

  expect(left.parentValue).toBe(20);
  expect(left.childValue).toBe(10);
  expect(left.x1).toBe(map[20].x);
  expect(left.y1).toBe(map[20].y + NODE_RADIUS);
  expect(left.x2).toBe(map[10].x);
  expect(left.y2).toBe(map[10].y - NODE_RADIUS);

  expect(right.parentValue).toBe(20);
  expect(right.childValue).toBe(30);
  expect(right.x1).toBe(map[20].x);
  expect(right.y2).toBe(map[30].y - NODE_RADIUS);
});

test('every node gets a distinct slot and bounds cover them all', () => {
  const values = [50, 40, 60, 30, 45, 55, 70, 25, 35];
  const layout = layoutTree(build(values).root);

  expect(layout.nodes).toHaveLength(values.length);
  expect(layout.edges).toHaveLength(values.length - 1);

  const xs = layout.nodes.map((n) => n.x);
  xs.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(xs[i]));
  xs.forEach((x) => expect(x).toBeLessThan(layout.width));
  layout.nodes.forEach((n) => expect(n.y).toBeLessThan(layout.height));
});

test('height and balance metadata mirror the AVL structure', () => {
  const balanced = layoutTree(build([20, 10, 30]).root);
  const twenty = balanced.nodes.find((n) => n.value === 20);
  expect(twenty.height).toBe(2);
  expect(twenty.balance).toBe(0);

  const lopsided = layoutTree(build([50, 40, 60, 30]).root);
  const forty = lopsided.nodes.find((n) => n.value === 40);
  expect(forty.height).toBe(2);
  expect(forty.balance).toBe(1);
  const fifty = lopsided.nodes.find((n) => n.value === 50);
  expect(fifty.height).toBe(3);
});

test('a single node fits a minimal canvas', () => {
  const layout = layoutTree(build([7]).root);
  expect(layout.nodes).toHaveLength(1);
  expect(layout.edges).toHaveLength(0);
  expect(layout.width).toBe(CANVAS_PAD * 2);
  expect(layout.height).toBe(CANVAS_PAD * 2);
  expect(layout.nodes[0].x).toBe(CANVAS_PAD);
  expect(layout.nodes[0].y).toBe(CANVAS_PAD);
});

test('wide trees compress horizontally instead of stretching', () => {
  // 20 sequential inserts through AVL stay reasonably balanced but still
  // produce many slots — the gap must shrink below H_GAP.
  const values = Array.from({ length: 20 }, (_, i) => (i + 1) * 3);
  const layout = layoutTree(build(values).root);

  expect(layout.nodes.length).toBe(20);
  const gap = layout.nodes[1].x - layout.nodes[0].x;
  expect(gap).toBeLessThan(H_GAP);
  expect(gap).toBeGreaterThanOrEqual(72);
  // natural width stays under ~1400px for 20 nodes (scale-to-fit then
  // handles the rest) — no more multi-thousand-pixel stretches
  expect(layout.width).toBeLessThanOrEqual(60 * 2 + 19 * 130);
});

test('small trees keep the comfortable H_GAP', () => {
  const layout = layoutTree(build([20, 10, 30]).root);
  expect(layout.nodes[1].x - layout.nodes[0].x).toBe(H_GAP);
});
