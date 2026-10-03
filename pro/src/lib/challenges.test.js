import { evaluateChallenge, gradeAttempt, searchComparisons, maxComparisons, CHALLENGE } from './challenges';

describe('searchComparisons', () => {
  test('sorted input without rotations builds a chain (n comparisons)', () => {
    expect(searchComparisons({ values: [10, 20, 30], target: 30, rotations: false })).toBe(3);
  });

  test('rotations keep the same search cheap', () => {
    expect(searchComparisons({ values: [10, 20, 30], target: 30, rotations: true })).toBe(2);
  });

  test('absent targets still count the visited path', () => {
    expect(searchComparisons({ values: [20, 10, 30], target: 25, rotations: true })).toBe(2);
  });
});

describe('maxComparisons', () => {
  test('without rotations the sorted chain achieves the n upper bound', () => {
    expect(maxComparisons([10, 20, 30], 30, { rotations: false })).toBe(3);
  });

  test('with rotations the best order still only reaches the balanced height', () => {
    expect(maxComparisons([10, 20, 30], 30, { rotations: true })).toBe(2);
  });
});

describe('gradeAttempt', () => {
  test('perfect only at the maximum', () => {
    expect(gradeAttempt(5, 5)).toBe('perfect');
    expect(gradeAttempt(4, 5)).toBe('good');
    expect(gradeAttempt(3, 5)).toBe('poor');
    expect(gradeAttempt(1, 5)).toBe('poor');
  });
});

describe('evaluateChallenge', () => {
  test('grades a perfect sorted attempt with rotations off', () => {
    const result = evaluateChallenge({
      values: [10, 20, 30, 40, 50],
      target: 50,
      rotations: false,
    });

    expect(result).toMatchObject({
      ok: true,
      challenge: CHALLENGE.id,
      n: 5,
      comparisons: 5,
      max: 5,
      grade: 'perfect',
      rotations: false,
    });
  });

  test('with rotations the same input cannot reach n', () => {
    const result = evaluateChallenge({
      values: [10, 20, 30, 40, 50],
      target: 50,
      rotations: true,
    });

    expect(result.ok).toBe(true);
    expect(result.comparisons).toBe(3);
    expect(result.max).toBe(3);
    expect(result.max).toBeLessThan(5);
  });

  test('rejects malformed input with actionable errors', () => {
    expect(evaluateChallenge({ values: [], target: 1, rotations: true })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/between 2 and 6/),
    });
    expect(evaluateChallenge({ values: [1], target: 1, rotations: true }).ok).toBe(false);
    expect(
      evaluateChallenge({ values: [1, 2, 3, 4, 5, 6, 7], target: 1, rotations: true }).ok
    ).toBe(false);
    expect(evaluateChallenge({ values: [10, 10], target: 1, rotations: true })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/unique/),
    });
    expect(evaluateChallenge({ values: [1.5, 2], target: 1, rotations: true }).ok).toBe(false);
    expect(evaluateChallenge({ values: [1, 2], target: 1.5, rotations: true }).ok).toBe(false);
    expect(evaluateChallenge({ values: [1, 2], target: 'x', rotations: true }).ok).toBe(false);
  });
});
