import { UnionFind } from './uf';
import {
  buildUfMakeSteps,
  buildUfFindSteps,
  buildUfUnionSteps,
} from './ufSteps';
import { layoutUf } from './ufLayout';
import { UNION_FIND_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveValue: vi.fn(),
  setHighlightedValues: vi.fn(),
  setParents: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

describe('UnionFind core', () => {
  test('make creates singletons; find returns themselves', () => {
    const uf = new UnionFind();
    ['a', 'b', 'c'].forEach((v) => uf.make(v));
    expect(uf.size).toBe(3);
    expect(uf.find('a')).toBe('a');
    expect(uf.size).toBe(3);
  });

  test('union by rank keeps trees short', () => {
    const uf = new UnionFind();
    [1, 2, 3, 4].forEach((v) => uf.make(v));
    uf.union(1, 2);
    uf.union(2, 3);
    uf.union(3, 4);
    expect(uf.find(1)).toBe(1);
    expect(uf.find(2)).toBe(1);
    expect(uf.find(3)).toBe(1);
    expect(uf.find(4)).toBe(1);
    // heights stay <= 2 thanks to rank
    expect(uf.height(1)).toBeLessThanOrEqual(2);
  });

  test('union of the same root is a no-op narrating same set', () => {
    const uf = new UnionFind();
    [1, 2].forEach((v) => uf.make(v));
    uf.union(1, 2);
    const trace = [];
    uf.union(1, 2, trace);
    expect(trace[trace.length - 1].type).toBe('same');
  });

  test('union of missing values is refused with a trace event', () => {
    const uf = new UnionFind();
    uf.make(1);
    const trace = [];
    uf.union(1, 99, trace);
    expect(trace[0].type).toBe('missing');
  });

  test('find compresses a long parent chain', () => {
    const uf = new UnionFind();
    [1, 2, 3, 4].forEach((v) => uf.make(v));
    uf.parent = { 1: 2, 2: 3, 3: 4, 4: 4 };
    const trace = [];
    const rep = uf.find(1, trace);
    expect(rep).toBe(4);
    expect(uf.parent[1]).toBe(4);
    expect(uf.parent[2]).toBe(4);
    const types = trace.map((e) => e.type);
    expect(types).toEqual(['link', 'link', 'link', 'compress', 'compress', 'found']);
  });
});

describe('buildUfMakeSteps', () => {
  test('narrates a singleton root', () => {
    const steps = buildUfMakeSteps(7, makeUi());
    expect(descriptions(steps)).toEqual([
      'Creating a new singleton set for 7',
      'Root 7 — rank 0',
    ]);
    expect(steps.map((s) => s.line)).toEqual([1, 2]);
  });
});

describe('buildUfFindSteps', () => {
  test('walks and compresses a deep chain', () => {
    const uf = new UnionFind();
    [1, 2, 3, 4].forEach((v) => uf.make(v));
    uf.parent = { 1: 2, 2: 3, 3: 4, 4: 4 };
    const trace = [];
    uf.find(1, trace);

    const steps = buildUfFindSteps(1, trace, makeUi());
    expect(descriptions(steps)).toEqual([
      'Finding the root of 1',
      'Following parent of 1 → 2',
      'Following parent of 2 → 3',
      'Following parent of 3 → 4',
      'Compressing path: 1 now points straight to 4',
      'Compressing path: 2 now points straight to 4',
      'Root of 1 is 4',
    ]);
    expect(steps[steps.length - 1].vars).toEqual({ value: 1, rep: 4 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(UNION_FIND_PSEUDOCODE.find.length)
    );
  });
});

describe('buildUfUnionSteps', () => {
  test('narrates both finds and the attach', () => {
    const uf = new UnionFind();
    [1, 2].forEach((v) => uf.make(v));
    const trace = [];
    uf.union(1, 2, trace);

    const steps = buildUfUnionSteps(1, 2, trace, makeUi());
    const d = descriptions(steps);
    expect(d[0]).toBe('Union set of 1 with set of 2');
    expect(d.some((x) => x.includes('Root of 1 is 1'))).toBe(true);
    expect(d.some((x) => x.includes('Root of 2 is 2'))).toBe(true);
    expect(d.some((x) => x.includes('Attach root 2 under root 1'))).toBe(true);
  });

  test('same-set unions narrate the shared root', () => {
    const uf = new UnionFind();
    [1, 2].forEach((v) => uf.make(v));
    uf.union(1, 2);
    const trace = [];
    uf.union(1, 2, trace);
    const steps = buildUfUnionSteps(1, 2, trace, makeUi());
    expect(descriptions(steps)).toContain('Already in the same set — root 1');
  });
});

describe('layoutUf', () => {
  test('a forest places roots with their children beneath', () => {
    const parent = { 1: 1, 2: 1, 3: 1 };
    const layout = layoutUf(parent, [1, 2, 3]);

    expect(layout.nodes).toHaveLength(3);
    const root = layout.nodes.find((n) => n.value === 1);
    expect(root.isRoot).toBe(true);
    expect(root.depth).toBe(0);
    const child = layout.nodes.find((n) => n.value === 2);
    expect(child.depth).toBe(1);
    expect(layout.edges.length).toBe(2);
    const e = layout.edges[0];
    // parent sits above the child: parent bottom y < child top y
    expect(e.y2 - e.y1).toBeGreaterThan(0);
    expect(e.x1).toBeGreaterThan(0);
  });

  test('separate components sit side by side', () => {
    const layout = layoutUf({ 1: 1, 2: 2 }, [1, 2]);
    const [a, b] = layout.nodes;
    expect(b.x - a.x).toBeGreaterThan(0);
    expect(layout.edges).toEqual([]);
  });
});
