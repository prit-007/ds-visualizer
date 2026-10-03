import { CONCEPTS, layoutCurriculum, masteryFor } from './curriculum';

describe('CONCEPTS', () => {
  test('has unique ids and deps that resolve to existing concepts', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const idSet = new Set(ids);
    CONCEPTS.forEach((c) => {
      c.deps.forEach((dep) => expect(idSet.has(dep)).toBe(true));
    });
  });

  test('every concept links to a registered app route', () => {
    CONCEPTS.forEach((c) => {
      expect(c.href.startsWith('/')).toBe(true);
    });
  });
});

describe('layoutCurriculum', () => {
  const { nodes, edges, width, height } = layoutCurriculum(CONCEPTS);

  test('lays out every concept exactly once with coordinates', () => {
    expect(nodes).toHaveLength(CONCEPTS.length);
    nodes.forEach((node) => {
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    });
  });

  test('emits one edge per dependency, pointing dep → concept', () => {
    const totalDeps = CONCEPTS.reduce((n, c) => n + c.deps.length, 0);
    expect(edges).toHaveLength(totalDeps);
    edges.forEach((edge) => {
      const from = CONCEPTS.find((c) => c.id === edge.from);
      const to = CONCEPTS.find((c) => c.id === edge.to);
      expect(to.deps).toContain(edge.from);
      expect(from).toBeDefined();
    });
  });

  test('layers are longest-path: every dep sits in a strictly earlier layer', () => {
    const layerById = new Map(nodes.map((n) => [n.id, n.layer]));
    nodes.forEach((node) => {
      node.deps.forEach((dep) => {
        expect(layerById.get(dep)).toBeLessThan(node.layer);
      });
    });
    const roots = nodes.filter((n) => n.deps.length === 0);
    roots.forEach((n) => expect(n.layer).toBe(0));
  });

  test('x grows with layer; y grows with row index within a layer', () => {
    const xByLayer = new Map();
    nodes.forEach((node) => {
      if (!xByLayer.has(node.layer)) xByLayer.set(node.layer, node.x);
    });
    nodes.forEach((node) => {
      expect(node.x).toBe(xByLayer.get(node.layer));
    });
    const layers = [...xByLayer.keys()].sort((a, b) => a - b);
    const layerPairs = layers.slice(1).map((layer, i) => [layers[i], layer]);
    layerPairs.forEach(([prev, next]) => {
      expect(xByLayer.get(next)).toBeGreaterThan(xByLayer.get(prev));
    });

    const rowsByLayer = new Map();
    nodes.forEach((node) => {
      if (!rowsByLayer.has(node.layer)) rowsByLayer.set(node.layer, []);
      rowsByLayer.get(node.layer).push(node);
    });
    rowsByLayer.forEach((row) => {
      const sorted = [...row].sort((a, b) => a.y - b.y);
      const rowPairs = sorted.slice(1).map((node, i) => [sorted[i], node]);
      rowPairs.forEach(([prev, next]) => {
        expect(next.y).toBeGreaterThan(prev.y);
      });
    });
  });

  test('canvas bounds cover every node', () => {
    nodes.forEach((node) => {
      expect(node.x).toBeLessThan(width);
      expect(node.y).toBeLessThan(height);
    });
  });
});

describe('masteryFor', () => {
  test('a fresh learner sees every concept as new', () => {
    const progress = { lessons: {}, operations: {}, predictions: { correct: 0, total: 0 } };
    CONCEPTS.forEach((c) => expect(masteryFor(c, progress)).toBe('new'));
  });

  test('lesson completion alone marks the lesson concept started', () => {
    const concept = CONCEPTS.find((c) => c.id === 'array-basics');
    expect(masteryFor(concept, { lessons: { array: true }, operations: {} })).toBe('started');
  });

  test('lesson + operations together mark the concept mastered', () => {
    const concept = CONCEPTS.find((c) => c.id === 'array-basics');
    const progress = {
      lessons: { array: true },
      operations: { 'array:add': { count: 2, lastAt: null } },
    };
    expect(masteryFor(concept, progress)).toBe('mastered');
  });

  test('operations without the lesson stay at started', () => {
    const concept = CONCEPTS.find((c) => c.id === 'array-ops');
    const progress = {
      lessons: {},
      operations: { 'array:insert': { count: 1, lastAt: null } },
    };
    expect(masteryFor(concept, progress)).toBe('started');
  });

  test('the quiz concept masters once a prediction is answered correctly', () => {
    const concept = CONCEPTS.find((c) => c.id === 'prediction');
    expect(concept.quiz).toBe(true);
    expect(masteryFor(concept, { predictions: { correct: 1, total: 2 } })).toBe('mastered');
  });
});
