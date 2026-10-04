import {
  buildAddNodeSteps,
  buildAddEdgeSteps,
  buildBFSSteps,
  buildDFSSteps,
} from './graphSteps';
import { GRAPH_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveValue: vi.fn(),
  setHighlightedEdge: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const activeCalls = (ui) => ui.setActiveValue.mock.calls.map((c) => c[0]);
const edgeCalls = (ui) => ui.setHighlightedEdge.mock.calls.map((c) => c[0]);

// Diamond graph: 1 → {2, 3}, 2 → 4.
const NODES = [1, 2, 3, 4];
const EDGES = [
  [1, 2],
  [1, 3],
  [2, 4],
];

describe('buildAddNodeSteps', () => {
  test('creates, places, then reports the node count', () => {
    const ui = makeUi();
    const steps = buildAddNodeSteps([1, 2], 3, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new node with value 3',
      'Placing node 3 on the canvas (position 2)',
      'Graph now has 3 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 3, 3]);
    expect(kinds(steps)).toEqual(['neutral', 'move', 'found']);
  });
});

describe('buildAddEdgeSteps', () => {
  test('locates both endpoints, connects them, then counts the edge', () => {
    const ui = makeUi();
    const steps = buildAddEdgeSteps([1, 2, 3], [[1, 2]], 2, 3, ui);

    expect(descriptions(steps)).toEqual([
      'Locating node 2',
      'Locating node 3',
      'Connecting 2 — 3',
      'Graph now has 2 edges',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([2, 3, null]);
    expect(edgeCalls(ui)).toEqual([null, [2, 3], null]);
    expect(kinds(steps)).toEqual(['compare', 'compare', 'move', 'found']);
  });
});

describe('buildBFSSteps', () => {
  test('walks breadth-first across the diamond graph', () => {
    const ui = makeUi();
    const steps = buildBFSSteps(NODES, EDGES, 1, ui);

    expect(descriptions(steps)).toEqual([
      'Starting BFS at node 1',
      'Visiting node 1',
      'Scanning edge 1 — 2',
      'Queuing node 2',
      'Scanning edge 1 — 3',
      'Queuing node 3',
      'Visiting node 2',
      'Scanning edge 2 — 1',
      'Node 1 already visited — skipping',
      'Scanning edge 2 — 4',
      'Queuing node 4',
      'Visiting node 3',
      'Scanning edge 3 — 1',
      'Node 1 already visited — skipping',
      'Visiting node 4',
      'Scanning edge 4 — 2',
      'Node 2 already visited — skipping',
      'BFS complete — visit order: 1, 2, 3, 4',
    ]);

    runAll(steps);
    expect(kinds(steps)).toEqual([
      'move',
      'found',
      'compare',
      'move',
      'compare',
      'move',
      'found',
      'compare',
      'compare',
      'compare',
      'move',
      'found',
      'compare',
      'compare',
      'found',
      'compare',
      'compare',
      'found',
    ]);
  });

  test('a disconnected start node still finishes with just itself', () => {
    const steps = buildBFSSteps([1, 2], [], 1, makeUi());
    expect(descriptions(steps)).toEqual([
      'Starting BFS at node 1',
      'Visiting node 1',
      'BFS complete — visit order: 1',
    ]);
  });
});

describe('buildDFSSteps', () => {
  test('walks depth-first across the diamond graph', () => {
    const ui = makeUi();
    const steps = buildDFSSteps(NODES, EDGES, 1, ui);

    expect(descriptions(steps)).toEqual([
      'Starting DFS at node 1',
      'Visiting node 1',
      'Scanning edge 1 — 2',
      'Descending into node 2',
      'Visiting node 2',
      'Scanning edge 2 — 1',
      'Node 1 already visited — skipping',
      'Scanning edge 2 — 4',
      'Descending into node 4',
      'Visiting node 4',
      'Scanning edge 4 — 2',
      'Node 2 already visited — skipping',
      'Scanning edge 1 — 3',
      'Descending into node 3',
      'Visiting node 3',
      'Scanning edge 3 — 1',
      'Node 1 already visited — skipping',
      'DFS complete — visit order: 1, 2, 4, 3',
    ]);

    runAll(steps);
    expect(kinds(steps)).toEqual([
      'move',
      'found',
      'compare',
      'move',
      'found',
      'compare',
      'compare',
      'compare',
      'move',
      'found',
      'compare',
      'compare',
      'compare',
      'move',
      'found',
      'compare',
      'compare',
      'found',
    ]);
  });
});

describe('every step has a non-empty description', () => {
  test('all four builders', () => {
    const ui = makeUi();
    [
      buildAddNodeSteps([1], 2, ui),
      buildAddEdgeSteps([1, 2], [], 1, 2, ui),
      buildBFSSteps(NODES, EDGES, 1, ui),
      buildDFSSteps(NODES, EDGES, 1, ui),
    ].forEach((steps) =>
      steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0))
    );
  });
});

describe('pseudocode lines and variable watch', () => {
  test('add-node steps line up with the graphAddNode listing', () => {
    const steps = buildAddNodeSteps([1], 2, makeUi());
    expect(steps.map((s) => s.line)).toEqual([1, 2, 3]);
    expect(steps[0].vars).toEqual({ value: 2 });
    expect(steps[1].vars).toEqual({ value: 2, pos: 1 });
    expect(steps[2].vars).toEqual({ nodes: 2 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(GRAPH_PSEUDOCODE.addNode.length)
    );
  });

  test('add-edge steps line up with the graphAddEdge listing', () => {
    const steps = buildAddEdgeSteps([1, 2], [], 1, 2, makeUi());
    expect(steps.map((s) => s.line)).toEqual([2, 2, 4, 5]);
    expect(steps[0].vars).toEqual({ value: 1 });
    expect(steps[1].vars).toEqual({ value: 2 });
    expect(steps[2].vars).toEqual({ from: 1, to: 2 });
    expect(steps[3].vars).toEqual({ edges: 1 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(GRAPH_PSEUDOCODE.addEdge.length)
    );
  });

  test('bfs steps pin start, scan, skip, queue and finale lines', () => {
    const steps = buildBFSSteps(NODES, EDGES, 1, makeUi());
    const lines = steps.map((s) => s.line);
    expect(lines).toEqual([
      2, 6, 7, 10, 7, 10, 6, 7, 8, 7, 10, 6, 7, 8, 6, 7, 8, 11,
    ]);
    expect(steps[0].vars).toEqual({ start: 1, queue: [1] });
    expect(steps[1].vars).toEqual({ cur: 1, order: [1] });
    expect(steps[2].vars).toEqual({ u: 1, v: 2 });
    expect(steps[3].vars).toEqual({ nb: 2, queue: [2] });
    expect(steps[8].vars).toEqual({ nb: 1 });
    expect(steps[steps.length - 1].vars).toEqual({ order: [1, 2, 3, 4] });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(GRAPH_PSEUDOCODE.bfs.length)
    );
  });

  test('dfs steps pin start, visit, scan, skip, descend and finale lines', () => {
    const steps = buildDFSSteps(NODES, EDGES, 1, makeUi());
    const lines = steps.map((s) => s.line);
    expect(lines).toEqual([
      2, 6, 7, 9, 6, 7, 8, 7, 9, 6, 7, 8, 7, 9, 6, 7, 8, 11,
    ]);
    expect(steps[0].vars).toEqual({ start: 1 });
    expect(steps[1].vars).toEqual({ cur: 1, order: [1] });
    expect(steps[3].vars).toEqual({ nb: 2 });
    expect(steps[17].vars).toEqual({ order: [1, 2, 4, 3] });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(GRAPH_PSEUDOCODE.dfs.length)
    );
  });
});
