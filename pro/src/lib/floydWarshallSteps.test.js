import { buildFloydWarshallSteps } from './floydWarshallSteps';
import { FLOYD_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setMatrix: vi.fn(),
  setActiveCell: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

const NODES = [1, 2, 3, 4];
const EDGES = [
  [1, 2, 4],
  [1, 3, 5],
  [2, 3, 2],
  [2, 4, 7],
  [3, 4, 1],
];

describe('buildFloydWarshallSteps', () => {
  test('runs every k-intermediate triple loop and converges', () => {
    const ui = makeUi();
    const steps = buildFloydWarshallSteps(NODES, EDGES, ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Starting Floyd–Warshall on 4 nodes');
    expect(d).toContain('Considering node 1 as an intermediate (k = 1)');
    expect(d).toContain('Via 2: dist[1][3] = 4 + 2 = 6 vs 5 (no change)');
    expect(d).toContain('Via 2: dist[1][4] = 4 + 7 = 11 vs ∞ → update');
    expect(d).toContain('Via 3: dist[1][4] = 5 + 1 = 6 vs 11 → update');

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Floyd–Warshall complete — all-pairs distances ready');
    expect(last.kind).toBe('found');
  });

  test('end matrix carries the true pair distances', () => {
    const steps = buildFloydWarshallSteps(NODES, EDGES, makeUi());
    const m = steps[steps.length - 1].vars.matrix;

    expect(m[0][1]).toBe(4); // 1->2
    expect(m[0][2]).toBe(5); // 1->3
    expect(m[0][3]).toBe(6); // 1->4 via 3
    expect(m[1][3]).toBe(3); // 2->4 via 3
  });

  test('a negative cycle is flagged', () => {
    const steps = buildFloydWarshallSteps([1, 2], [[1, 2, -2], [2, 1, -2]], makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toContain('Negative cycle detected');
    expect(last.kind).toBe('error');
  });

  test('every step maps into the listing', () => {
    buildFloydWarshallSteps(NODES, EDGES, makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(FLOYD_PSEUDOCODE.length);
    });
  });
});
