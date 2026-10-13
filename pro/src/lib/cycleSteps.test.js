import { buildCycleSteps } from './cycleSteps';
import { CYCLE_PSEUDOCODE } from './pseudocode';

const runAll = (steps) => steps.forEach((s) => s.action());

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setVisitedNodes: vi.fn(),
  setActiveEdge: vi.fn(),
  setResult: vi.fn(),
});

describe('buildCycleSteps', () => {
  test('a back edge reports the exact cycle path', () => {
    const ui = makeUi();
    let steps = buildCycleSteps([1, 2], [[1, 2, 0], [2, 1, 0]], ui);
    const d = steps.map((s) => s.description);

    expect(d[0]).toBe('Cycle detection — DFS with a recursion stack');
    expect(d).toContain('DFS from node 1');
    expect(d).toContain('Tree edge 1→2 — recursing');
    expect(d).toContain('Back edge 2→1 — 1 is still on the recursion stack → cycle!');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(CYCLE_PSEUDOCODE.length);
    });

    runAll(steps);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Cycle detected: 1 → 2 → 1');
    expect(last.kind).toBe('error');
    expect(ui.setResult).toHaveBeenLastCalledWith('Cycle detected: 1 → 2 → 1');
  });

  test('a DAG finishes every node with no cycle', () => {
    const ui = makeUi();
    let steps = buildCycleSteps(
      [1, 2, 3, 4, 5],
      [[1, 2, 0], [1, 3, 0], [2, 4, 0], [3, 4, 0], [4, 5, 0]],
      ui
    );
    const d = steps.map((s) => s.description);

    expect(d).toContain('Tree edge 4→5 — recursing');
    expect(d).toContain('Node 5 popped — no cycle through 5');
    expect(d).toContain('Edge 3→4 — 4 already finished, no back edge');

    runAll(steps);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('No cycle — the graph is a DAG');
    expect(last.kind).toBe('found');
    expect(ui.setResult).toHaveBeenLastCalledWith('No cycle — the graph is a DAG');
  });
});
