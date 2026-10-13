import {
  buildActivitySteps,
  buildFractionalKnapsackSteps,
  buildGreedyCoinSteps,
} from './greedySteps';
import { GREEDY_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveInterval: vi.fn(),
  setActiveKey: vi.fn(),
  setPicked: vi.fn(),
  setHighlightedKeys: vi.fn(),
  setTaken: vi.fn(),
  setTotalValue: vi.fn(),
  setCoinCounts: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

describe('buildActivitySteps', () => {
  test('picks earliest-finish and skips overlaps', () => {
    const steps = buildActivitySteps(
      [
        [0, 2],
        [1, 3],
        [2, 4],
      ],
      makeUi()
    );
    const d = descriptions(steps);
    expect(d[0]).toContain('Starting activity selection with 3 activities');
    expect(d.some((x) => x.includes('[0,2] is the first pick'))).toBe(true);
    expect(d.some((x) => x.includes('[1,3] overlaps the last selection'))).toBe(true);
    expect(d.some((x) => x.includes('[2,4] starts at 2 ≥ 2 → select'))).toBe(true);
    expect(d[d.length - 1]).toBe('Selected 2 non-overlapping activities: [0,2] [2,4]');
  });

  test('every step maps into the listing', () => {
    buildActivitySteps([[0, 1], [1, 2]], makeUi()).forEach((s) => {
      expect(s.line).toBeLessThanOrEqual(GREEDY_PSEUDOCODE.activity.length);
    });
  });
});

describe('buildFractionalKnapsackSteps', () => {
  test('takes whole items then a fraction', () => {
    const steps = buildFractionalKnapsackSteps(
      [
        [5, 30],
        [10, 20],
        [3, 18],
      ],
      10,
      makeUi()
    );
    const d = descriptions(steps);
    expect(d.some((x) => x.includes('Take whole item'))).toBe(true);
    expect(d.some((x) => x.includes('Take 2 of item 1'))).toBe(true);
    expect(d[d.length - 1]).toBe('Total value: 52 (capacity 10/10)');
  });
});

describe('buildGreedyCoinSteps', () => {
  test('uses the largest denominations first (48 with [25,10,5,1])', () => {
    const steps = buildGreedyCoinSteps(48, [25, 10, 5, 1], makeUi());
    const d = descriptions(steps);
    expect(d.some((x) => x.includes('Use 1 coin(s) of 25'))).toBe(true);
    expect(d.some((x) => x.includes('Use 2 coin(s) of 10'))).toBe(true);
    expect(d.some((x) => x.includes('Cannot use 5'))).toBe(true);
    expect(d.some((x) => x.includes('Use 3 coin(s) of 1'))).toBe(true);
    expect(d[d.length - 1]).toContain('Greedy coins: 6 piece(s)');
  });
});
