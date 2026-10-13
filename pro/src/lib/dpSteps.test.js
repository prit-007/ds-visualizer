import {
  buildFibSteps,
  buildGridPathsSteps,
  buildCoinChangeSteps,
  buildLCSSteps,
  buildZeroOneKnapsackSteps,
  buildHouseRobberSteps,
} from './dpSteps';
import { DP_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveKey: vi.fn(),
  setHighlightedKeys: vi.fn(),
  setActiveCell: vi.fn(),
  setHighlightedCells: vi.fn(),
  setTable: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

describe('buildFibSteps', () => {
  test('fills the memo table bottom-up for n=5', () => {
    const steps = buildFibSteps(5, makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Starting bottom-up Fibonacci for n=5');
    expect(text).toContain('fib(2) = 0 + 1 = 1');
    expect(text).toContain('fib(3) = 1 + 1 = 2');
    expect(text).toContain('fib(5) = 2 + 3 = 5');
    expect(descriptions(steps)[steps.length - 1]).toBe('Fibonacci: fib(5) = 5');
  });

  test('pins the final value and line bounds', () => {
    const steps = buildFibSteps(6, makeUi());
    expect(descriptions(steps)[steps.length - 1]).toBe('Fibonacci: fib(6) = 8');
    steps.forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.fib.length);
    });
  });
});

describe('buildGridPathsSteps', () => {
  test('2x2 grid has 2 paths with edge and interior rows', () => {
    const steps = buildGridPathsSteps(2, 2, makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('ways(0,1) = 1 (only right moves)');
    expect(text).toContain('ways(1,0) = 1 (only down moves)');
    expect(text).toContain('ways(1,1) = ways(0,1) + ways(1,0)');
    expect(text).toContain('ways(1,1) = 1 + 1 = 2');
    expect(descriptions(steps)[steps.length - 1]).toBe('Ways to reach (1,1): 2');
  });

  test('final value maps to the listing', () => {
    const steps = buildGridPathsSteps(3, 3, makeUi());
    expect(descriptions(steps)[steps.length - 1]).toBe('Ways to reach (2,2): 6');
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.gridPaths.length)
    );
  });
});

describe('buildCoinChangeSteps', () => {
  test('coins [1,2,5] make 6 with two coins', () => {
    const steps = buildCoinChangeSteps(6, [1, 2, 5], makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('Coin 1: dp[5]+1 = 2 (better)');
    expect(descriptions(steps)[steps.length - 1]).toBe('Fewest coins for 6: 2');
  });

  test('unreachable amounts are honest', () => {
    const steps = buildCoinChangeSteps(3, [2], makeUi());
    expect(descriptions(steps)[steps.length - 1]).toBe(
      'Impossible — no coin combination makes 3'
    );
  });

  test('every step maps into the listing', () => {
    buildCoinChangeSteps(5, [1, 3], makeUi()).forEach((s) => {
      expect(s.line).toBeLessThanOrEqual(DP_PSEUDOCODE.coinChange.length);
    });
  });
});

describe('buildLCSSteps', () => {
  test('length-4 LCS for classic pair', () => {
    const steps = buildLCSSteps('ABCBDAB', 'BDCABA', makeUi());
    const text = descriptions(steps).join('\n');
    expect(text).toContain('LCS of "ABCBDAB" and "BDCABA"');
    expect(descriptions(steps)[steps.length - 1]).toBe('LCS length: 4');
  });
});

describe('buildZeroOneKnapsackSteps', () => {
  test('capacity 5 with [2,3],[3,4],[4,5],[5,6] yields 7', () => {
    const steps = buildZeroOneKnapsackSteps(
      [
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ],
      5,
      makeUi()
    );
    expect(descriptions(steps)[steps.length - 1]).toBe('Maximum value: 7');
  });
});

describe('buildHouseRobberSteps', () => {
  test('[2,7,9,3,1] robs 12 without adjacent houses', () => {
    const steps = buildHouseRobberSteps([2, 7, 9, 3, 1], makeUi());
    const d = descriptions(steps);
    expect(d[d.length - 1]).toBe('Maximum loot without adjacent houses: 12');
  });
});
