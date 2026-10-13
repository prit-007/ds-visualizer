import { buildEditDistanceSteps, buildLISSteps, buildSubsetSumSteps, buildKadaneSteps, buildWordBreakSteps } from './dpExtraSteps';
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

describe('buildSubsetSumSteps', () => {
  test('narrates exclude/include reachability over the 2D table', () => {
    const ui = makeUi();
    const steps = buildSubsetSumSteps([3, 34, 4, 12, 5, 2], 9, ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Subset sum target 9 from [3, 34, 4, 12, 5, 2]');
    expect(d).toContain('t = 7 already reachable excluding nums[5] = 5');
    expect(d).toContain('include nums[5] = 5 → dp[4][4] = true → t = 9 reachable');
    expect(d).toContain('dp[5][6] stays false — neither exclude nor include reaches 6');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.subset.length);
    });

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Subset sum 9 is reachable from the given numbers');
    expect(last.kind).toBe('found');
    expect(last.vars.reachable).toBe(true);
    expect(last.vars.matrix['6,9']).toBe(true);
  });

  test('an impossible target ends honestly', () => {
    const ui = makeUi();
    const steps = buildSubsetSumSteps([2, 4], 7, ui);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Subset sum 7 is not reachable from the given numbers');
    expect(last.kind).toBe('error');
    expect(last.vars.reachable).toBe(false);
  });
});

describe('buildKadaneSteps', () => {
  test('extends while positive and restarts after a negative run', () => {
    const ui = makeUi();
    const steps = buildKadaneSteps([-2, 1, -3, 4, -1, 2, 1, -5, 4], ui);
    const d = descriptions(steps);

    expect(d[0]).toBe("Kadane's maximum subarray on [-2, 1, -3, 4, -1, 2, 1, -5, 4]");
    expect(d).toContain('dp[3] = a[3] = 4 (restart: dp[2] = -2 was negative)');
    expect(d).toContain('dp[6] = dp[5] + a[6] = 5 + 1 = 6 (extend)');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.kadane.length);
    });

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Maximum subarray sum: 6');
    expect(last.kind).toBe('found');
    expect(last.vars.value).toBe(6);
  });
});

describe('buildWordBreakSteps', () => {
  test('finds a segmentation and narrates each successful split', () => {
    const ui = makeUi();
    const steps = buildWordBreakSteps('leetcode', ['leet', 'code', 'le'], ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Word break for "leetcode" with [leet, code, le]');
    expect(d).toContain('dp[0] = true (empty string)');
    expect(d).toContain('split at 0: "leet" in dictionary (dp[0] = true) → dp[4] = true');
    expect(d).toContain('split at 4: "code" in dictionary (dp[4] = true) → dp[8] = true');

    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.wordbreak.length);
    });

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Word break: "leetcode" → leet | code');
    expect(last.kind).toBe('found');
    expect(last.vars.value).toBe(true);
  });

  test('an unsegmentable string ends honestly', () => {
    const ui = makeUi();
    const steps = buildWordBreakSteps('catsandog', ['cats', 'dog', 'sand', 'and', 'cat'], ui);
    const d = descriptions(steps);

    expect(d).toContain('no valid split reaches 8 → dp[8] = false');
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Word break: "catsandog" cannot be segmented');
    expect(last.kind).toBe('error');
    expect(last.vars.value).toBe(false);
  });
});
