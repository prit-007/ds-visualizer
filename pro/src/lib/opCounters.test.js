import { countKinds } from './opCounters';

describe('countKinds', () => {
  const steps = [
    { kind: 'compare' },
    { kind: 'move' },
    { kind: 'compare' },
    { kind: 'found' },
    { kind: 'error' },
    { description: 'no kind field' },
  ];

  test('counts kinds through the current step index (inclusive)', () => {
    expect(countKinds(steps, 0)).toEqual({ compare: 1, move: 0, found: 0, error: 0, total: 1 });
    expect(countKinds(steps, 3)).toEqual({ compare: 2, move: 1, found: 1, error: 0, total: 4 });
    expect(countKinds(steps, 5)).toEqual({ compare: 2, move: 1, found: 1, error: 1, total: 6 });
  });

  test('clamps out-of-range and negative indexes', () => {
    expect(countKinds(steps, 99)).toEqual({ compare: 2, move: 1, found: 1, error: 1, total: 6 });
    expect(countKinds(steps, -1)).toEqual({ compare: 0, move: 0, found: 0, error: 0, total: 0 });
  });

  test('unknown or missing kinds only count toward total', () => {
    expect(countKinds([{ kind: 'weird' }], 0)).toEqual({
      compare: 0,
      move: 0,
      found: 0,
      error: 0,
      total: 1,
    });
  });

  test('empty step list yields all zeroes', () => {
    expect(countKinds([], 0)).toEqual({ compare: 0, move: 0, found: 0, error: 0, total: 0 });
  });
});
