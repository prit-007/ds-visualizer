import { buildEditDistanceSteps, buildLISSteps } from './dpExtraSteps';
import { DP_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setTable: vi.fn(),
  setActiveCell: vi.fn(),
  setHighlightedCells: vi.fn(),
  setHighlightedKeys: vi.fn(),
  setActiveKey: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

describe('buildEditDistanceSteps', () => {
  test('fills the table with keep vs min-edit recurrence', () => {
    const ui = makeUi();
    const steps = buildEditDistanceSteps('sit', 'sat', ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Edit distance between "sit" and "sat"');
    expect(d).toContain('s = s at dp[1][1] → diagonal (no edit needed)');
    expect(d).toContain('s ≠ a at dp[1][2] → 1 + min(2, 0, 1) = 1');
    expect(d).toContain('t = t at dp[3][3] → diagonal (no edit needed)');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.edit.length);
    });

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Edit distance between "sit" and "sat" is 1');
    expect(last.kind).toBe('found');
    expect(last.vars.matrix['3,3']).toBe(1);
  });
});

describe('buildLISSteps', () => {
  test('builds 1 + best-predecessor chains', () => {
    const ui = makeUi();
    const steps = buildLISSteps([1, 5, 2, 3, 4], ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('LIS of [1, 5, 2, 3, 4]');
    expect(d).toContain('dp[1] = 5 > 1 (dp[0] = 1) → 2');
    expect(d).toContain('dp[4] = 4 > 3 (dp[3] = 3) → 4');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.lis.length);
    });

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Longest increasing subsequence of [1, 5, 2, 3, 4] has length 4');
  });
});
