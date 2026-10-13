import { buildBellmanFordSteps } from './bellmanFordSteps';
import { BELLMAN_FORD_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setActiveEdge: vi.fn(),
  setDistances: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

const NODES = [1, 2, 3, 4];
const EDGES = [
  [1, 2, 4],
  [1, 3, 5],
  [2, 3, -2],
  [2, 4, 7],
  [3, 4, 1],
];

describe('buildBellmanFordSteps', () => {
  test('runs V-1 relax passes then reports the converged distances', () => {
    const ui = makeUi();
    const steps = buildBellmanFordSteps(NODES, EDGES, 1, ui);

    const d = descriptions(steps);
    expect(d[0]).toBe('Starting Bellman-Ford from node 1');
    expect(d[1]).toBe('Initialize distances — node 1: 0, others: ∞');
    expect(d[2]).toBe('Relaxation pass 1 of 3 (V − 1 passes)');

    expect(d).toContain('Relaxing edge 1—2 (weight 4): 0+4=4 vs ∞ → update');
    expect(d).toContain('Relaxing edge 2—3 (weight -2): 4-2=2 vs 5 → update');
    expect(d).toContain('Relaxing edge 3—4 (weight 1): 2+1=3 vs 11 → update');

    expect(d[d.length - 1]).toBe(
      'Shortest distances from 1: 1→0 2→4 3→2 4→3'
    );
  });

  test('an extra pass without changes confirms convergence', () => {
    const steps = buildBellmanFordSteps(NODES, EDGES, 1, makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Pass 2 — no distances improved, distances converged');
  });

  test('unreachable nodes stay ∞ honestly', () => {
    const steps = buildBellmanFordSteps([1, 2, 9], [[1, 2, 4]], 1, makeUi());
    expect(descriptions(steps)[descriptions(steps).length - 1]).toBe(
      'Shortest distances from 1: 1→0 2→4 9→∞'
    );
  });

  test('a negative cycle is detected on the final pass', () => {
    const steps = buildBellmanFordSteps([1, 2], [[1, 2, -1], [2, 1, -1]], 1, makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toContain('Negative cycle detected');
    expect(last.kind).toBe('error');
  });

  test('every step maps into the listing', () => {
    buildBellmanFordSteps(NODES, EDGES, 1, makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(BELLMAN_FORD_PSEUDOCODE.length);
    });
  });
});
