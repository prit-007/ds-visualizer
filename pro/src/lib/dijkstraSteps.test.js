import { buildDijkstraSteps } from './dijkstraSteps';
import { DIJKSTRA_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setVisitedNodes: vi.fn(),
  setDistances: vi.fn(),
  setActiveEdge: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const dists = (ui) => ui.setDistances.mock.calls.map((c) => c[0]);

const NODES = [1, 2, 3];
const EDGES = [
  [1, 2, 4],
  [1, 3, 1],
  [3, 2, 1],
];

describe('buildDijkstraSteps', () => {
  test('settles nodes in distance order and relaxes each edge', () => {
    const ui = makeUi();
    const steps = buildDijkstraSteps(NODES, EDGES, 1, ui);

    expect(descriptions(steps)).toEqual([
      'Starting Dijkstra from node 1',
      'Tentative distances initialized — node 1: 0, others: ∞',
      'Selecting node 1 with distance 0',
      'Relaxing edge 1—2 (weight 4): 0+4=4 vs ∞',
      'Updating distance of 2 to 4',
      'Relaxing edge 1—3 (weight 1): 0+1=1 vs ∞',
      'Updating distance of 3 to 1',
      'Selecting node 3 with distance 1',
      'Relaxing edge 3—2 (weight 1): 1+1=2 vs 4',
      'Updating distance of 2 to 2',
      'Selecting node 2 with distance 2',
      'Dijkstra complete — shortest distances from 1: 1→0, 2→2, 3→1',
    ]);

    expect(kinds(steps)).toEqual([
      'move',
      'compare',
      'found',
      'compare',
      'move',
      'compare',
      'move',
      'found',
      'compare',
      'move',
      'found',
      'found',
    ]);
    expect(steps.map((s) => s.line)).toEqual([1, 2, 4, 5, 6, 5, 6, 4, 5, 6, 4, 7]);
  });

  test('distance snapshots update monotonically', () => {
    const ui = makeUi();
    const steps = buildDijkstraSteps(NODES, EDGES, 1, ui);
    runAll(steps);

    const calls = dists(ui);
    expect(calls[0]).toEqual({ 1: Infinity, 2: Infinity, 3: Infinity });
    expect(calls[1]).toEqual({ 1: 0, 2: Infinity, 3: Infinity });
    expect(calls[calls.length - 1]).toEqual({ 1: 0, 2: 2, 3: 1 });
  });

  test('keeps already-settled neighbors out of relaxation narration', () => {
    const steps = buildDijkstraSteps(NODES, EDGES, 1, makeUi());
    const text = descriptions(steps).join('\n');
    // 3—1 and 2—1 edges must not produce "Relaxing edge 3—1" noise
    expect(text).not.toContain('Relaxing edge 3—1');
    expect(text).not.toContain('Relaxing edge 2—1');
  });

  test('unreachable nodes keep ∞ in the finale', () => {
    const steps = buildDijkstraSteps([1, 2, 9], [[1, 2, 3]], 1, makeUi());
    expect(descriptions(steps)[steps.length - 1]).toBe(
      'Dijkstra complete — shortest distances from 1: 1→0, 2→3, 9→∞'
    );
  });

  test('a missing start node errors out', () => {
    const steps = buildDijkstraSteps(NODES, EDGES, 99, makeUi());
    expect(descriptions(steps)[1]).toBe('Start node 99 is not in the graph');
    expect(kinds(steps)[1]).toBe('error');
  });

  test('every step maps into the listing', () => {
    const steps = buildDijkstraSteps(NODES, EDGES, 1, makeUi());
    steps.forEach((s) => {
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(DIJKSTRA_PSEUDOCODE.length);
    });
  });
});
