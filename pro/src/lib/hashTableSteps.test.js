import {
  HASH_BUCKETS,
  hashKey,
  totalKeys,
  buildInsertSteps,
  buildSearchSteps,
  buildDeleteSteps,
} from './hashTableSteps';
import { HASH_TABLE_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveBucket: vi.fn(),
  setActiveChainIndex: vi.fn(),
  setShiftingChain: vi.fn(),
  setRemovingCell: vi.fn(),
});

// Empty 11-bucket table with bucket 3 pre-filled.
const tableAt3 = (...keys) => {
  const buckets = Array.from({ length: HASH_BUCKETS }, () => []);
  buckets[3] = [...keys];
  return buckets;
};

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const activeBucketCalls = (ui) => ui.setActiveBucket.mock.calls.map((c) => c[0]);
const activeChainCalls = (ui) => ui.setActiveChainIndex.mock.calls.map((c) => c[0]);
const shiftingCalls = (ui) => ui.setShiftingChain.mock.calls.map((c) => c[0]);
const removingCalls = (ui) => ui.setRemovingCell.mock.calls.map((c) => c[0]);

describe('hashKey and totalKeys', () => {
  test('hashKey mods into range, including negative keys', () => {
    expect(hashKey(25)).toBe(3);
    expect(hashKey(0)).toBe(0);
    expect(hashKey(HASH_BUCKETS)).toBe(0);
    expect(hashKey(-1)).toBe(HASH_BUCKETS - 1);
  });

  test('totalKeys sums chain lengths', () => {
    expect(totalKeys([])).toBe(0);
    expect(totalKeys(tableAt3(14, 25, 36))).toBe(3);
    expect(totalKeys(tableAt3(14, 25))).toBe(2);
  });
});

describe('buildInsertSteps', () => {
  test('placing into an empty bucket heads the chain', () => {
    const ui = makeUi();
    const buckets = tableAt3();
    const steps = buildInsertSteps(buckets, 25, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new key to insert: 25',
      'Computing hash of 25 → bucket 3 (key mod 11)',
      'Bucket 3 is empty — placing 25 as the bucket head',
      'Table now has 1 keys',
    ]);

    runAll(steps);
    expect(activeBucketCalls(ui)).toEqual([null, 3, 3]);
    expect(activeChainCalls(ui)).toEqual([null, null, 0, 0]);
    expect(kinds(steps)).toEqual(['neutral', 'compare', 'move', 'found']);
  });

  test('appending onto a filled bucket narrates the chain length', () => {
    const ui = makeUi();
    const buckets = tableAt3(14, 25);
    const steps = buildInsertSteps(buckets, 36, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new key to insert: 36',
      'Computing hash of 36 → bucket 3 (key mod 11)',
      'Bucket 3 has 2 keys — appending 36 at position 2',
      'Table now has 3 keys',
    ]);

    runAll(steps);
    expect(activeBucketCalls(ui)).toEqual([null, 3, 3]);
    expect(activeChainCalls(ui)).toEqual([null, null, 2, 2]);
  });
});

describe('buildSearchSteps', () => {
  test('walks the chain and reports the found position', () => {
    const ui = makeUi();
    const buckets = tableAt3(14, 25, 36);
    const steps = buildSearchSteps(buckets, 25, ui);

    expect(descriptions(steps)).toEqual([
      'Computing hash of 25 → bucket 3 (key mod 11)',
      'Comparing 25 with 14 (bucket 3, position 0)',
      'Comparing 25 with 25 (bucket 3, position 1)',
      'Key 25 found in bucket 3 at position 1',
    ]);

    runAll(steps);
    expect(activeBucketCalls(ui)).toEqual([3, 3]);
    expect(activeChainCalls(ui)).toEqual([null, 0, 1, 1]);
    expect(kinds(steps)).toEqual(['compare', 'compare', 'compare', 'found']);
  });

  test('empty bucket reports not found without comparing', () => {
    const ui = makeUi();
    const steps = buildSearchSteps(tableAt3(), 25, ui);

    expect(descriptions(steps)).toEqual([
      'Computing hash of 25 → bucket 3 (key mod 11)',
      'Bucket 3 is empty — key 25 not found',
    ]);

    runAll(steps);
    expect(activeChainCalls(ui)).toEqual([null, null]);
    expect(kinds(steps)).toEqual(['compare', 'error']);
  });

  test('exhausting a chain reports not found', () => {
    const ui = makeUi();
    const steps = buildSearchSteps(tableAt3(14), 25, ui);

    expect(descriptions(steps)).toEqual([
      'Computing hash of 25 → bucket 3 (key mod 11)',
      'Comparing 25 with 14 (bucket 3, position 0)',
      'Key 25 not found in the table',
    ]);

    expect(kinds(steps)).toEqual(['compare', 'compare', 'error']);
  });
});

describe('buildDeleteSteps', () => {
  test('removes a mid-chain key and shifts the tail', () => {
    const ui = makeUi();
    const buckets = tableAt3(14, 25, 36);
    const steps = buildDeleteSteps(buckets, 25, ui);

    expect(descriptions(steps)).toEqual([
      'Computing hash of 25 → bucket 3 (key mod 11)',
      'Comparing 25 with 14 (bucket 3, position 0)',
      'Comparing 25 with 25 (bucket 3, position 1)',
      'Removing key 25 from bucket 3 (position 1)',
      'Shifting key 36 from position 2 to position 1',
      'Bucket 3 now has 2 keys',
    ]);

    runAll(steps);
    expect(removingCalls(ui)).toEqual([null, { bucket: 3, index: 1 }, null]);
    expect(shiftingCalls(ui)).toEqual([[], [{ bucket: 3, index: 2 }], []]);
    expect(kinds(steps)).toEqual([
      'compare',
      'compare',
      'compare',
      'move',
      'move',
      'found',
    ]);
  });

  test('removing the last chain element shifts nothing', () => {
    const ui = makeUi();
    const steps = buildDeleteSteps(tableAt3(14), 14, ui);

    expect(descriptions(steps)).toEqual([
      'Computing hash of 14 → bucket 3 (key mod 11)',
      'Comparing 14 with 14 (bucket 3, position 0)',
      'Removing key 14 from bucket 3 (position 0)',
      'Bucket 3 now has 0 keys',
    ]);

    runAll(steps);
    expect(shiftingCalls(ui)).toEqual([[], []]);
    expect(removingCalls(ui)).toEqual([null, { bucket: 3, index: 0 }, null]);
  });

  test('empty bucket and missing key report an error', () => {
    const empty = buildDeleteSteps(tableAt3(), 25, makeUi());
    expect(descriptions(empty)).toEqual([
      'Computing hash of 25 → bucket 3 (key mod 11)',
      'Bucket 3 is empty — key 25 not present',
    ]);
    expect(kinds(empty)).toEqual(['compare', 'error']);

    const missing = buildDeleteSteps(tableAt3(14), 25, makeUi());
    expect(descriptions(missing)).toEqual([
      'Computing hash of 25 → bucket 3 (key mod 11)',
      'Comparing 25 with 14 (bucket 3, position 0)',
      'Key 25 not present in the table',
    ]);
    expect(kinds(missing)).toEqual(['compare', 'compare', 'error']);
  });
});

describe('every step has a non-empty description', () => {
  test('all three builders', () => {
    const ui = makeUi();
    const buckets = tableAt3(14, 25);
    [
      buildInsertSteps(buckets, 36, ui),
      buildSearchSteps(buckets, 25, ui),
      buildDeleteSteps(buckets, 14, ui),
    ].forEach((steps) =>
      steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0))
    );
  });
});

describe('pseudocode lines and variable watch', () => {
  test('insert steps line up with the hashInsert listing', () => {
    const empty = buildInsertSteps(tableAt3(), 25, makeUi());
    expect(empty.map((s) => s.line)).toEqual([1, 2, 5, 8]);
    expect(empty[1].vars).toEqual({ key: 25, bucket: 3 });
    expect(empty[2].vars).toEqual({ key: 25 });
    expect(empty[3].vars).toEqual({ total: 1 });
    empty.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(HASH_TABLE_PSEUDOCODE.insert.length)
    );

    const full = buildInsertSteps(tableAt3(14, 25), 36, makeUi());
    expect(full[2].line).toBe(7);
    expect(full[2].vars).toEqual({ key: 36, pos: 2 });
  });

  test('search steps line up with the hashSearch listing', () => {
    const found = buildSearchSteps(tableAt3(14, 25), 25, makeUi());
    expect(found.map((s) => s.line)).toEqual([2, 7, 7, 8]);
    expect(found[1].vars).toEqual({ key: 25, other: 14, pos: 0 });
    expect(found[3].vars).toEqual({ key: 25, bucket: 3, pos: 1 });
    found.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(HASH_TABLE_PSEUDOCODE.search.length)
    );

    const missing = buildSearchSteps(tableAt3(14), 25, makeUi());
    expect(missing[missing.length - 1].line).toBe(9);
    expect(missing[missing.length - 1].vars).toEqual({ key: 25 });
  });

  test('delete steps line up with the hashDelete listing', () => {
    const steps = buildDeleteSteps(tableAt3(14, 25, 36), 25, makeUi());
    expect(steps.map((s) => s.line)).toEqual([2, 7, 7, 9, 9, 10]);
    expect(steps[3].vars).toEqual({ key: 25, bucket: 3, pos: 1 });
    expect(steps[4].vars).toEqual({ i: 2, key: 36 });
    expect(steps[5].vars).toEqual({ bucket: 3, size: 2 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(HASH_TABLE_PSEUDOCODE.delete.length)
    );
  });
});
