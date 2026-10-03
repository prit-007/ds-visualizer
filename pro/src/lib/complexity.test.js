import { runBenchmark, classifyGrowth, buildPlot, BENCHMARKS, DEFAULT_SIZES } from './complexity';

const series = (f, sizes = DEFAULT_SIZES) => sizes.map((n) => ({ n, ops: f(n), ms: 0 }));

describe('runBenchmark', () => {
  test('array-insert-front costs n element moves', () => {
    const samples = runBenchmark('array-insert-front', [8, 16, 32]);
    expect(samples.map((s) => [s.n, s.ops])).toEqual([
      [8, 8],
      [16, 16],
      [32, 32],
    ]);
  });

  test('array-index-access is a single operation at any size', () => {
    const samples = runBenchmark('array-index-access', [8, 1024]);
    expect(samples.map((s) => s.ops)).toEqual([1, 1]);
  });

  test('array-binary-search costs floor(log2 n)+1 comparisons', () => {
    const samples = runBenchmark('array-binary-search', [8, 16, 1000]);
    expect(samples.map((s) => [s.n, s.ops])).toEqual([
      [8, 4],
      [16, 5],
      [1000, 10],
    ]);
  });

  test('list-find-mid walks about half the list', () => {
    const samples = runBenchmark('list-find-mid', [8, 16]);
    expect(samples.map((s) => [s.n, s.ops])).toEqual([
      [8, 4],
      [16, 8],
    ]);
  });

  test('bst-insert-sorted degenerates to n comparisons', () => {
    const samples = runBenchmark('bst-insert-sorted', [8, 16]);
    expect(samples.map((s) => [s.n, s.ops])).toEqual([
      [8, 8],
      [16, 16],
    ]);
  });

  test('avl-insert-sorted stays logarithmic', () => {
    const samples = runBenchmark('avl-insert-sorted', [64, 1024]);
    expect(samples[0].ops).toBeLessThan(12);
    expect(samples[1].ops).toBeLessThan(20);
  });

  test('every benchmark is declared and runnable at the default sizes', () => {
    Object.keys(BENCHMARKS).forEach((key) => {
      const samples = runBenchmark(key, DEFAULT_SIZES);
      expect(samples).toHaveLength(DEFAULT_SIZES.length);
      samples.forEach((s) => {
        expect(s.n).toBeGreaterThan(0);
        expect(s.ops).toBeGreaterThan(0);
        expect(s.ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  test('unknown keys throw a helpful error', () => {
    expect(() => runBenchmark('nope', [8])).toThrow(/unknown/i);
  });
});

describe('classifyGrowth', () => {
  test('identifies constant, logarithmic, linear, n-log-n and quadratic series', () => {
    expect(classifyGrowth(series(() => 10)).label).toBe('O(1)');
    expect(classifyGrowth(series((n) => Math.log2(n))).label).toBe('O(log n)');
    expect(classifyGrowth(series((n) => 3 * n + 7)).label).toBe('O(n)');
    expect(classifyGrowth(series((n) => n * Math.log2(n))).label).toBe('O(n log n)');
    expect(classifyGrowth(series((n) => n * n)).label).toBe('O(n^2)');
  });

  test('returns null when there is not enough data', () => {
    expect(classifyGrowth([])).toBeNull();
    expect(classifyGrowth([{ n: 64, ops: 1, ms: 0 }])).toBeNull();
  });
});

describe('buildPlot', () => {
  test('produces in-bounds polyline strings for both series', () => {
    const samples = series((n) => n);
    const plot = buildPlot(samples, (n) => n);

    expect(plot.measured.split(' ')).toHaveLength(samples.length);
    expect(plot.theory.split(' ')).toHaveLength(samples.length);

    const points = `${plot.measured} ${plot.theory}`.split(' ').map((pair) => pair.split(',').map(Number));
    points.forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(plot.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(plot.height);
    });
  });

  test('handles a flat series without dividing by zero', () => {
    const plot = buildPlot(series(() => 1), (n) => n);
    const ys = plot.measured.split(' ').map((pair) => Number(pair.split(',')[1]));
    expect(new Set(ys).size).toBe(1);
    expect(ys.every((y) => Number.isFinite(y))).toBe(true);
  });
});
