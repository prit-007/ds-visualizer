import { buildKosarajuSteps } from './kosarajuSteps';
import { KOSARAJU_PSEUDOCODE } from './pseudocode';

const SCC_NODES = [1, 2, 3, 4, 5, 6];
const SCC_EDGES = [
  [1, 2, 0], [2, 3, 0], [3, 1, 0],
  [3, 4, 0], [4, 5, 0], [5, 6, 0], [6, 4, 0],
];

const runAll = (steps) => steps.forEach((s) => s.action());

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setVisitedNodes: vi.fn(),
  setActiveEdge: vi.fn(),
  setSccOf: vi.fn(),
  setResult: vi.fn(),
});

describe('buildKosarajuSteps', () => {
  test('two passes over original and reversed graphs group the components', () => {
    const ui = makeUi();
    let steps = buildKosarajuSteps(SCC_NODES, SCC_EDGES, ui);
    const d = steps.map((s) => s.description);

    expect(d[0]).toBe('Kosaraju SCC — pass 1: DFS on the original graph');
    expect(d).toContain('DFS from node 1');
    expect(d).toContain('Tree edge 1→2 — recursing into 2');
    expect(d).toContain('Edge 3→1 — 1 already visited');
    expect(d).toContain('Finished node 6 — post-order #1');
    expect(d).toContain('Pass 2: DFS on the reversed graph in decreasing finish order');
    expect(d).toContain('Reverse DFS from node 1 (post-order #6)');
    expect(d).toContain('Reverse edge 4→3 — 3 already visited');
    expect(d).toContain('Component 1: {1, 2, 3}');
    expect(d).toContain('Component 2: {4, 5, 6}');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(KOSARAJU_PSEUDOCODE.length);
    });

    runAll(steps);
    const last = steps[steps.length - 1];
    expect(last.description).toBe(
      'Kosaraju complete — 2 components: {1, 2, 3} {4, 5, 6}'
    );
    expect(last.kind).toBe('found');
    expect(ui.setSccOf).toHaveBeenLastCalledWith(
      expect.objectContaining({ 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2 })
    );
    expect(ui.setResult).toHaveBeenLastCalledWith(
      'Components: {1, 2, 3} {4, 5, 6}'
    );
  });

  test('an acyclic graph falls back to singleton components', () => {
    const ui = makeUi();
    let steps = buildKosarajuSteps(
      [1, 2, 3, 4],
      [[1, 2, 0], [1, 3, 0], [2, 4, 0], [3, 4, 0]],
      ui
    );
    runAll(steps);
    const last = steps[steps.length - 1];
    expect(last.description).toBe(
      'Kosaraju complete — 4 components: {1} {2} {3} {4}'
    );
    expect(ui.setResult).toHaveBeenLastCalledWith('Components: {1} {2} {3} {4}');
  });
});
