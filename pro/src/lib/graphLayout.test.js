import { layoutGraph, NODE_RADIUS, CANVAS_PAD } from './graphLayout';

const nodeAt = (layout, value) => layout.nodes.find((n) => n.value === value);

const center = (layout) => ({
  cx: layout.width / 2,
  cy: layout.height / 2,
});

test('empty graph yields an empty canvas', () => {
  const layout = layoutGraph([], []);
  expect(layout.nodes).toEqual([]);
  expect(layout.edges).toEqual([]);
  expect(layout.width).toBe(0);
  expect(layout.height).toBe(0);
});

test('single node sits at the canvas center with no edges', () => {
  const layout = layoutGraph([7], []);
  const { cx, cy } = center(layout);
  const [only] = layout.nodes;

  expect(layout.nodes).toHaveLength(1);
  expect(only.value).toBe(7);
  expect(only.x).toBe(cx);
  expect(only.y).toBe(cy);
  expect(layout.edges).toEqual([]);
  expect(layout.width).toBe(layout.height);
});

test('three nodes sit on a circle, starting at the top, equally spaced', () => {
  const layout = layoutGraph([1, 2, 3], []);
  const { cx, cy } = center(layout);
  const radius = cx - CANVAS_PAD;

  const [one, two, three] = layout.nodes;

  // node 1 starts at the top (angle -90°)
  expect(one.x).toBeCloseTo(cx);
  expect(one.y).toBeCloseTo(cy - radius);

  // 120° apart: node 2 at +30°, node 3 at +150°
  expect(two.x).toBeCloseTo(cx + radius * Math.cos(Math.PI / 6));
  expect(two.y).toBeCloseTo(cy + radius * Math.sin(Math.PI / 6));
  expect(three.x).toBeCloseTo(cx + radius * Math.cos((5 * Math.PI) / 6));
  expect(three.y).toBeCloseTo(cy + radius * Math.sin((5 * Math.PI) / 6));

  // every node is exactly `radius` from the center
  for (const n of layout.nodes) {
    expect(Math.hypot(n.x - cx, n.y - cy)).toBeCloseTo(radius);
  }
});

test('edge endpoints are trimmed to the node radius on both ends', () => {
  const layout = layoutGraph([1, 2], [[1, 2]]);
  const a = nodeAt(layout, 1);
  const b = nodeAt(layout, 2);

  expect(layout.edges).toHaveLength(1);
  const [edge] = layout.edges;
  expect(edge.fromValue).toBe(1);
  expect(edge.toValue).toBe(2);

  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;

  expect(edge.x1).toBeCloseTo(a.x + ux * NODE_RADIUS);
  expect(edge.y1).toBeCloseTo(a.y + uy * NODE_RADIUS);
  expect(edge.x2).toBeCloseTo(b.x - ux * NODE_RADIUS);
  expect(edge.y2).toBeCloseTo(b.y - uy * NODE_RADIUS);

  // endpoints are strictly inside the node pair
  expect(Math.hypot(edge.x1 - a.x, edge.y1 - a.y)).toBeCloseTo(NODE_RADIUS);
  expect(Math.hypot(edge.x2 - b.x, edge.y2 - b.y)).toBeCloseTo(NODE_RADIUS);
});

test('bounds cover every node with padding', () => {
  const layout = layoutGraph([10, 20, 30, 40], [[10, 20], [30, 40]]);
  expect(layout.width).toBeGreaterThan(0);
  expect(layout.height).toBeGreaterThan(0);

  for (const n of layout.nodes) {
    expect(n.x).toBeGreaterThanOrEqual(CANVAS_PAD);
    expect(n.x).toBeLessThanOrEqual(layout.width - CANVAS_PAD);
    expect(n.y).toBeGreaterThanOrEqual(CANVAS_PAD);
    expect(n.y).toBeLessThanOrEqual(layout.height - CANVAS_PAD);
  }
});

test('radius grows with node count so circles stay apart', () => {
  const small = layoutGraph([1, 2], []);
  const large = layoutGraph(
    Array.from({ length: 12 }, (_, i) => i + 1),
    []
  );

  expect(large.width).toBeGreaterThan(small.width);
});
