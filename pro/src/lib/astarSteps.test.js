import { buildAstarSteps } from './astarSteps';
import { ASTAR_PSEUDOCODE } from './pseudocode';

const DEMO_NODES = [1, 2, 3, 4, 5, 6];
const DEMO_EDGES = [
  [1, 2, 7], [1, 3, 9], [1, 6, 14], [2, 3, 10],
  [2, 4, 15], [3, 4, 11], [3, 6, 2], [4, 5, 6], [6, 5, 9],
];

const runAll = (steps) => steps.forEach((s) => s.action());

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setVisitedNodes: vi.fn(),
  setActiveEdge: vi.fn(),
  setDistances: vi.fn(),
  setResult: vi.fn(),
});

describe('buildAstarSteps', () => {
  test('guides search with an admissible heuristic and stops at the goal', () => {
    const ui = makeUi();
    let steps = buildAstarSteps(DEMO_NODES, DEMO_EDGES, 1, 4, ui);
    const d = steps.map((s) => s.description);

    expect(d[0]).toBe('Starting A* from node 1 toward goal 4');
    expect(d).toContain(
      'Heuristic h(n) = 2 × fewest edges to 4 (min edge weight × BFS hops) — admissible'
    );
    expect(d).toContain('g initialized — node 1: 0, others: ∞');
    expect(d).toContain('Selecting node 1 with f = g + h = 0 + 4 = 4');
    expect(d).toContain('Goal 4 reached with g = 20');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(ASTAR_PSEUDOCODE.length);
    });

    runAll(steps);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Path 1 → 3 → 4 costs 20');
    expect(last.kind).toBe('found');
    expect(ui.setResult).toHaveBeenLastCalledWith('Path 1 → 3 → 4 costs 20');
  });

  test('a disconnected goal ends honestly as unreachable', () => {
    const ui = makeUi();
    let steps = buildAstarSteps([1, 2, 3], [[1, 2, 5]], 1, 3, ui);
    runAll(steps);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('No path from 1 to 3 — goal unreachable');
    expect(last.kind).toBe('error');
    expect(ui.setResult).toHaveBeenLastCalledWith('No path from 1 to 3 — goal unreachable');
  });
});
