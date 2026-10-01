import { buildAddSteps, buildInsertSteps, buildRemoveSteps } from './arraySteps';
import { ARRAY_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveElementIndex: vi.fn(),
  setShiftingElements: vi.fn(),
  setRemovingElementIndex: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const activeCalls = (ui) => ui.setActiveElementIndex.mock.calls.map((c) => c[0]);
const shiftingCalls = (ui) => ui.setShiftingElements.mock.calls.map((c) => c[0]);
const removingCalls = (ui) => ui.setRemovingElementIndex.mock.calls.map((c) => c[0]);

describe('buildAddSteps', () => {
  test('highlights the boundary then the new index', () => {
    const ui = makeUi();
    const steps = buildAddSteps([10, 20, 30], 40, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new element with value 40',
      'Finding the end of the array (index 3)',
      'Adding the element to the end of the array',
      'Array now has 4 elements',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 2, 3]);
  });

  test('every step has a non-empty description', () => {
    buildAddSteps([1], 2, makeUi()).forEach((s) =>
      expect(s.description.length).toBeGreaterThan(0)
    );
  });
});

describe('buildInsertSteps', () => {
  test('shifts each element one index at a time', () => {
    const ui = makeUi();
    const steps = buildInsertSteps([10, 20, 30], 99, 1, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a temporary space for value 99',
      'Finding insert position (index 1)',
      'Moving element at index 2 to index 3',
      'Moving element at index 1 to index 2',
      'Inserting new element at position 1',
      'Array now has 4 elements',
    ]);

    runAll(steps);
    expect(shiftingCalls(ui)).toEqual([[], [2], [1], []]);
    expect(activeCalls(ui)).toEqual([null, 0, 1]);
    expect(ui.setActiveElementIndex).toHaveBeenLastCalledWith(1);
  });

  test('inserting at position 0 shifts the whole array', () => {
    const ui = makeUi();
    const steps = buildInsertSteps([10, 20], 99, 0, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a temporary space for value 99',
      'Finding insert position (index 0)',
      'Moving element at index 1 to index 2',
      'Moving element at index 0 to index 1',
      'Inserting new element at position 0',
      'Array now has 3 elements',
    ]);

    runAll(steps);
    expect(shiftingCalls(ui)).toEqual([[], [1], [0], []]);
    expect(activeCalls(ui)).toEqual([null, 0, 0]);
  });

  test('appending at the end shifts nothing', () => {
    const ui = makeUi();
    const steps = buildInsertSteps([10, 20], 99, 2, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a temporary space for value 99',
      'Finding insert position (index 2)',
      'Inserting new element at position 2',
      'Array now has 3 elements',
    ]);
    runAll(steps);
    expect(shiftingCalls(ui)).toEqual([[], []]);
  });

  test('every step has a non-empty description', () => {
    buildInsertSteps([1], 2, 0, makeUi()).forEach((s) =>
      expect(s.description.length).toBeGreaterThan(0)
    );
  });
});

describe('buildRemoveSteps', () => {
  test('marks removal then shifts the tail one index at a time', () => {
    const ui = makeUi();
    const steps = buildRemoveSteps([10, 20, 30, 40], 1, ui);

    expect(descriptions(steps)).toEqual([
      'Finding element at position 1',
      'Marking element for removal (value: 20)',
      'Moving element at index 2 to index 1',
      'Moving element at index 3 to index 2',
      'Array now has 3 elements',
    ]);

    runAll(steps);
    expect(removingCalls(ui)).toEqual([null, 1, null]);
    expect(shiftingCalls(ui)).toEqual([[], [2], [3], []]);
    expect(activeCalls(ui)).toEqual([1, null]);
  });

  test('removing the last element shifts nothing', () => {
    const ui = makeUi();
    const steps = buildRemoveSteps([10, 20, 30], 2, ui);

    expect(descriptions(steps)).toEqual([
      'Finding element at position 2',
      'Marking element for removal (value: 30)',
      'Array now has 2 elements',
    ]);

    runAll(steps);
    expect(shiftingCalls(ui)).toEqual([[], []]);
    expect(removingCalls(ui)).toEqual([null, 2, null]);
  });

  test('every step has a non-empty description', () => {
    buildRemoveSteps([1, 2, 3], 0, makeUi()).forEach((s) =>
      expect(s.description.length).toBeGreaterThan(0)
    );
  });
});

describe('semantic step kinds', () => {
  const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');

  test('add steps: scan is compare, placement is move, result is found', () => {
    expect(kinds(buildAddSteps([10, 20], 30, makeUi()))).toEqual([
      'neutral',
      'compare',
      'move',
      'found',
    ]);
  });

  test('insert steps: shifts are move, result is found', () => {
    expect(kinds(buildInsertSteps([10, 20, 30], 99, 1, makeUi()))).toEqual([
      'neutral',
      'compare',
      'move',
      'move',
      'move',
      'found',
    ]);
  });

  test('remove steps: finding is compare, marking is found, shifts are move', () => {
    expect(kinds(buildRemoveSteps([10, 20, 30, 40], 1, makeUi()))).toEqual([
      'compare',
      'found',
      'move',
      'move',
      'found',
    ]);
  });
});

describe('pseudocode lines and variable watch', () => {
  test('add steps line up with the arrayAdd pseudocode', () => {
    const steps = buildAddSteps([10, 20], 30, makeUi());
    steps.forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(ARRAY_PSEUDOCODE.add.length);
    });
    expect(steps.map((s) => s.line)).toEqual([1, 2, 3, 4]);
    expect(steps[0].vars).toEqual({ value: 30 });
    expect(steps[1].vars).toEqual({ n: 2 });
    expect(steps[2].vars).toEqual({ value: 30 });
    expect(steps[3].vars).toEqual({ length: 3 });
  });

  test('insert steps carry pos, index and value variables', () => {
    const steps = buildInsertSteps([10, 20, 30], 99, 1, makeUi());
    expect(steps[0].line).toBe(1);
    expect(steps[1].line).toBe(2);
    expect(steps[2].line).toBe(4);
    expect(steps[2].vars).toEqual({ i: 2 });
    expect(steps[steps.length - 2].line).toBe(5);
    expect(steps[steps.length - 1].line).toBe(6);
    expect(steps[0].vars).toEqual({ value: 99, pos: 1 });
    expect(steps[steps.length - 1].vars).toEqual({ length: 4 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(ARRAY_PSEUDOCODE.insert.length)
    );
  });

  test('remove steps carry pos and the removed value', () => {
    const steps = buildRemoveSteps([10, 20, 30], 1, makeUi());
    expect(steps[0].line).toBe(2);
    expect(steps[1].line).toBe(3);
    expect(steps[1].vars).toEqual({ removed: 20, pos: 1 });
    expect(steps[2].line).toBe(5);
    expect(steps[2].vars).toEqual({ i: 2 });
    expect(steps[steps.length - 1].line).toBe(6);
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(ARRAY_PSEUDOCODE.remove.length)
    );
  });
});
