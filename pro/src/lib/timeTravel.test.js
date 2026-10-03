import { recordRun, listRuns, clearRuns, diffRuns } from './timeTravel';

const baseRun = (overrides = {}) => ({
  structure: 'tree',
  label: 'Insert 42',
  before: [30, 20, 40],
  after: [30, 20, 40, 42],
  steps: ['Comparing 42 with 30', 'Moving right', 'Inserted 42'],
  counters: { compare: 1, move: 1, found: 1, error: 0, total: 3 },
  meta: { rotations: true },
  ...overrides,
});

beforeEach(() => {
  clearRuns();
});

describe('recordRun / listRuns', () => {
  test('records runs with increasing ids and lists newest last', () => {
    const first = recordRun(baseRun({ label: 'Insert 10' }));
    const second = recordRun(baseRun({ label: 'Insert 20' }));

    expect(second.id).toBeGreaterThan(first.id);
    expect(listRuns().map((r) => r.label)).toEqual(['Insert 10', 'Insert 20']);
    expect(first.at).toBeGreaterThan(0);
  });

  test('filters by structure', () => {
    recordRun(baseRun({ structure: 'tree' }));
    recordRun(baseRun({ structure: 'array', label: 'Push 5' }));

    expect(listRuns('tree')).toHaveLength(1);
    expect(listRuns('array')).toHaveLength(1);
    expect(listRuns()).toHaveLength(2);
  });

  test('derives counters from step kinds when counters are omitted', () => {
    const run = recordRun(
      baseRun({
        counters: undefined,
        steps: [
          { description: 'a', kind: 'compare' },
          { description: 'b', kind: 'compare' },
          { description: 'c', kind: 'move' },
        ],
      })
    );

    expect(run.steps).toEqual(['a', 'b', 'c']);
    expect(run.counters).toEqual({ compare: 2, move: 1, found: 0, error: 0, total: 3 });
  });

  test('clearRuns empties the history', () => {
    recordRun(baseRun());
    expect(listRuns()).toHaveLength(1);
    clearRuns();
    expect(listRuns()).toHaveLength(0);
  });
});

describe('diffRuns', () => {
  test('finds the common prefix and both divergent tails', () => {
    const rotationsOn = recordRun(
      baseRun({
        label: 'Insert 42 (rotations on)',
        steps: ['Comparing 42 with 30', 'Rotating at 30', 'Inserted 42'],
        counters: { compare: 1, move: 2, found: 0, error: 0, total: 3 },
      })
    );
    const rotationsOff = recordRun(
      baseRun({
        label: 'Insert 42 (rotations off)',
        steps: ['Comparing 42 with 30', 'Skipping rotation at 30', 'Inserted 42'],
        counters: { compare: 1, move: 1, found: 0, error: 1, total: 3 },
        meta: { rotations: false },
      })
    );

    const diff = diffRuns(rotationsOn, rotationsOff);
    expect(diff.commonPrefix).toBe(1);
    expect(diff.onlyA).toEqual(['Rotating at 30', 'Inserted 42']);
    expect(diff.onlyB).toEqual(['Skipping rotation at 30', 'Inserted 42']);
    expect(diff.countersDelta).toEqual({ compare: 0, move: -1, found: 0, error: 1, total: 0 });
    expect(diff.metaEqual).toBe(false);
    expect(diff.beforeEqual).toBe(true);
  });

  test('identical runs share every step and report equality flags', () => {
    const a = recordRun(baseRun());
    const b = recordRun(baseRun({ meta: { rotations: true } }));

    const diff = diffRuns(a, b);
    expect(diff.commonPrefix).toBe(a.steps.length);
    expect(diff.onlyA).toEqual([]);
    expect(diff.onlyB).toEqual([]);
    expect(diff.countersDelta).toEqual({ compare: 0, move: 0, found: 0, error: 0, total: 0 });
    expect(diff.beforeEqual).toBe(true);
    expect(diff.afterEqual).toBe(true);
    expect(diff.metaEqual).toBe(true);
  });

  test('returns null when a side is missing', () => {
    const run = recordRun(baseRun());
    expect(diffRuns(run, null)).toBeNull();
    expect(diffRuns(null, run)).toBeNull();
  });
});
