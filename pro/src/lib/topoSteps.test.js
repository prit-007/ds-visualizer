import { buildTopoSteps } from './topoSteps';
import { TOPO_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setHighlightedNodes: vi.fn(),
  setIndegrees: vi.fn(),
  setOrder: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const runAll = (steps) => steps.forEach((s) => s.action && s.action());

const NODES = [1, 2, 3, 4];
const EDGES = [
  [1, 2],
  [1, 3],
  [2, 3],
  [3, 4],
];

describe('buildTopoSteps', () => {
  test('concatenates the Kahn frontier and the ordering', () => {
    const steps = buildTopoSteps(NODES, EDGES, makeUi());

    expect(descriptions(steps)).toEqual([
      'Starting topological sort (Kahn’s algorithm)',
      'Computing in-degrees — 1:0  2:1  3:2  4:1',
      'Starting frontier (in-degree 0): [1]',
      'Visiting node 1 — appending to the ordering',
      'Decrementing in-degree of 2 → 0',
      '2 joins the frontier — queue [2]',
      'Decrementing in-degree of 3 → 1',
      'Visiting node 2 — appending to the ordering',
      'Decrementing in-degree of 3 → 0',
      '3 joins the frontier — queue [3]',
      'Visiting node 3 — appending to the ordering',
      'Decrementing in-degree of 4 → 0',
      '4 joins the frontier — queue [4]',
      'Visiting node 4 — appending to the ordering',
      'Topological order: 1 → 2 → 3 → 4',
    ]);
  });

  test('order snapshots grow monotonically', () => {
    const ui = makeUi();
    const steps = buildTopoSteps(NODES, EDGES, ui);
    runAll(steps);

    const orders = ui.setOrder.mock.calls.map((c) => c[0]);
    // one snapshot per visit plus the finale echo
    expect(orders[0]).toEqual([1]);
    expect(orders[1]).toEqual([1, 2]);
    expect(orders[2]).toEqual([1, 2, 3]);
    expect(orders[3]).toEqual([1, 2, 3, 4]);
    expect(orders[4]).toEqual([1, 2, 3, 4]);
  });

  test('a cyclic graph reports no valid order', () => {
    const steps = buildTopoSteps([1, 2], [[1, 2], [2, 1]], makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Cycle detected — no topological order exists');
  });

  test('every step maps into the listing', () => {
    const steps = buildTopoSteps(NODES, EDGES, makeUi());
    steps.forEach((s) => {
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(TOPO_PSEUDOCODE.length);
    });
  });
});
