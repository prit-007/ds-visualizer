import { buildPrimSteps, buildKruskalSteps } from './mstSteps';
import { MST_PSEUDOCODE } from './pseudocode';

const NODES = [1, 2, 3, 4, 5];
const EDGES = [
  [1, 2, 4],
  [1, 3, 3],
  [2, 4, 2],
  [3, 4, 5],
  [3, 5, 1],
  [4, 5, 6],
];

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setVisitedNodes: vi.fn(),
  setActiveEdge: vi.fn(),
  setTreeEdges: vi.fn(),
});

describe('buildPrimSteps', () => {
  test('grows a minimum spanning tree from the start node', () => {
    const ui = makeUi();
    const steps = buildPrimSteps(NODES, EDGES, 1, ui);
    const d = steps.map((s) => s.description);

    expect(d[0]).toBe('Starting Prim from node 1 — tree grows one edge at a time');
    expect(d).toContain('Edge 3—5 (weight 1) is the cheapest from the tree → picked');
    expect(d).toContain('Edge 2—4 (weight 2) is the cheapest from the tree → picked');

    const last = steps[steps.length - 1];
    expect(last.description).toBe('MST complete — 4 edges, total weight 10');
    expect(last.kind).toBe('found');
  });

  test('every step maps into the listing', () => {
    buildPrimSteps(NODES, EDGES, 1, makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(MST_PSEUDOCODE.prim.length);
    });
  });
});

describe('buildKruskalSteps', () => {
  test('sorts edge weights ascending and skips cycle-forming edges', () => {
    const ui = makeUi();
    const steps = buildKruskalSteps(NODES, EDGES, ui);
    const d = steps.map((s) => s.description);

    expect(d[1]).toBe('Edges sorted by weight: 3—5(1), 2—4(2), 1—3(3), 1—2(4), 3—4(5), 4—5(6)');
    expect(d).toContain('Edge 3—4 (weight 5) would form a cycle → skip');

    const last = steps[steps.length - 1];
    expect(last.description).toBe('MST complete — 4 edges, total weight 10');
    expect(last.kind).toBe('found');
  });

  test('every step maps into the listing', () => {
    buildKruskalSteps(NODES, EDGES, makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(MST_PSEUDOCODE.kruskal.length);
    });
  });
});

describe('disconnected graphs', () => {
  test('Prim reports no spanning tree honestly', () => {
    const steps = buildPrimSteps([1, 2, 3], [[1, 2, 4]], 1, makeUi());
    expect(steps[steps.length - 1].description).toContain('disconnected');
    expect(steps[steps.length - 1].kind).toBe('error');
  });

  test('Kruskal reports no spanning tree honestly', () => {
    const steps = buildKruskalSteps([1, 2, 3], [[1, 2, 4]], makeUi());
    expect(steps[steps.length - 1].description).toContain('disconnected');
    expect(steps[steps.length - 1].kind).toBe('error');
  });
});
