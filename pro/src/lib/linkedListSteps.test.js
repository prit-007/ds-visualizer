import { buildAddSteps, buildInsertSteps, buildRemoveSteps } from './linkedListSteps';
import { LINKED_LIST_PSEUDOCODE } from './pseudocode';

const nodes = (values) => values.map((v, i) => ({ id: `n${i}`, value: v }));

const makeUi = () => ({
  setActiveNodeIndex: vi.fn(),
  setActivePointerIndex: vi.fn(),
  setRemovingNodeIndex: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const activeCalls = (ui) => ui.setActiveNodeIndex.mock.calls.map((c) => c[0]);
const pointerCalls = (ui) => ui.setActivePointerIndex.mock.calls.map((c) => c[0]);
const removingCalls = (ui) => ui.setRemovingNodeIndex.mock.calls.map((c) => c[0]);

describe('buildAddSteps', () => {
  test('walks node by node from the head to the tail', () => {
    const ui = makeUi();
    const steps = buildAddSteps(nodes([10, 20, 30]), 40, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new node with value 40',
      'Checking head node (position 0, value 10)',
      "Following the 'next' pointer to position 1 (value 20)",
      "Following the 'next' pointer to position 2 (value 30)",
      "Updating the 'next' pointer of the last node",
      'Linked list now has 4 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 0, 1, 2, null]);
    expect(pointerCalls(ui)).toEqual([null, 0, 1, 2, null]);
  });

  test('appending to an empty list announces the new head', () => {
    const ui = makeUi();
    const steps = buildAddSteps([], 7, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new node with value 7',
      'The list is empty, the new node becomes the head',
      'Linked list now has 1 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, null]);
    expect(() => runAll(steps)).not.toThrow();
  });
});

describe('buildInsertSteps', () => {
  test('inserting after the head links position 0 without extra hops', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(nodes([10, 20, 30]), 99, 1, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new node with value 99',
      'Checking head node (position 0, value 10)',
      "Updating the 'next' pointer of node at position 0",
      'Inserting the new node at position 1',
      'Linked list now has 4 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 0, 1, null]);
    expect(pointerCalls(ui)).toEqual([null, 0, null, null]);
  });

  test('inserting deeper walks the pointer hops to reach the predecessor', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(nodes([10, 20, 30]), 99, 2, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new node with value 99',
      'Checking head node (position 0, value 10)',
      "Following the 'next' pointer to position 1 (value 20)",
      "Updating the 'next' pointer of node at position 1",
      'Inserting the new node at position 2',
      'Linked list now has 4 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 0, 1, 2, null]);
    expect(pointerCalls(ui)).toEqual([null, 0, 1, null, null]);
  });

  test('inserting at head announces the new head', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(nodes([10, 20]), 99, 0, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new node with value 99',
      'This will be the new head of the list',
      "Setting the 'next' pointer of the new node to current head",
      'Inserting the new node at position 0',
      'Linked list now has 3 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 0, 0, null]);
    expect(pointerCalls(ui)).toEqual([null, 0, null, null]);
  });

  test('appending at the end walks to the current tail', () => {
    const ui = makeUi();
    const steps = buildInsertSteps(nodes([10, 20]), 99, 2, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new node with value 99',
      'Checking head node (position 0, value 10)',
      "Following the 'next' pointer to position 1 (value 20)",
      "Updating the 'next' pointer of node at position 1",
      'Inserting the new node at position 2',
      'Linked list now has 3 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 0, 1, 2, null]);
    expect(ui.setActiveNodeIndex).toHaveBeenLastCalledWith(null);
  });
});

describe('buildRemoveSteps', () => {
  test('removing in the middle walks, skips over, then removes', () => {
    const ui = makeUi();
    const steps = buildRemoveSteps(nodes([10, 20, 30, 40]), 1, ui);

    expect(descriptions(steps)).toEqual([
      'Starting removal of the node at position 1 (value 20)',
      'Checking head node (position 0, value 10)',
      'Advancing cur to position 0 (already there)',
      "Updating the 'next' pointer to skip the node at position 1",
      'Removing node at position 1 (value: 20)',
      'Linked list now has 3 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 0, 0, 1, null]);
    expect(removingCalls(ui)).toEqual([null, 1, null]);
  });

  test('removing deeper hops through the intermediate nodes first', () => {
    const ui = makeUi();
    const steps = buildRemoveSteps(nodes([10, 20, 30, 40]), 2, ui);

    expect(descriptions(steps)).toEqual([
      'Starting removal of the node at position 2 (value 30)',
      'Checking head node (position 0, value 10)',
      "Following the 'next' pointer to position 1 (value 20)",
      "Updating the 'next' pointer to skip the node at position 2",
      'Removing node at position 2 (value: 30)',
      'Linked list now has 3 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 0, 1, 2, null]);
    expect(pointerCalls(ui)).toEqual([null, 0, 1, null]);
    expect(removingCalls(ui)).toEqual([null, 2, null]);
  });

  test('removing the head promotes the second node', () => {
    const ui = makeUi();
    const steps = buildRemoveSteps(nodes([10, 20, 30]), 0, ui);

    expect(descriptions(steps)).toEqual([
      'Starting removal of the head node (value 10)',
      'Setting head to the second node',
      'Removing node at position 0 (value: 10)',
      'Linked list now has 2 nodes',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 1, 0, null]);
    expect(removingCalls(ui)).toEqual([null, 0, null]);
  });

  test('every step has a non-empty description', () => {
    [
      buildAddSteps(nodes([1, 2]), 3, makeUi()),
      buildInsertSteps(nodes([1, 2]), 3, 1, makeUi()),
      buildRemoveSteps(nodes([1, 2, 3]), 2, makeUi()),
    ].forEach((steps) =>
      steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0))
    );
  });
});

describe('semantic step kinds', () => {
  const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');

  test('add steps tag head check, hops and result', () => {
    expect(kinds(buildAddSteps(nodes([10, 20]), 30, makeUi()))).toEqual([
      'neutral',
      'compare',
      'move',
      'move',
      'found',
    ]);
  });

  test('insert steps tag walk and placement', () => {
    expect(kinds(buildInsertSteps(nodes([10, 20]), 30, 1, makeUi()))).toEqual([
      'neutral',
      'compare',
      'move',
      'move',
      'found',
    ]);
  });

  test('remove steps tag walk and removal', () => {
    expect(kinds(buildRemoveSteps(nodes([10, 20, 30]), 2, makeUi()))).toEqual([
      'neutral',
      'compare',
      'move',
      'move',
      'move',
      'found',
    ]);
  });
});

describe('pseudocode lines and variable watch', () => {
  test('add steps walk the listAdd pseudocode', () => {
    const steps = buildAddSteps(nodes([10, 20]), 30, makeUi());
    steps.forEach((s) => {
      expect(Number.isInteger(s.line)).toBe(true);
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(LINKED_LIST_PSEUDOCODE.add.length);
    });
    expect(steps[0].line).toBe(2);
    expect(steps[1].line).toBe(6);
    expect(steps[2].line).toBe(7);
    expect(steps[2].vars).toEqual({ position: 1 });
    expect(steps[3].line).toBe(8);
    expect(steps[steps.length - 1].line).toBe(9);
    expect(steps[0].vars).toEqual({ value: 30 });
  });

  test('appending to an empty list jumps to the head assignment', () => {
    const steps = buildAddSteps([], 7, makeUi());
    expect(steps[1].line).toBe(4);
  });

  test('insert steps carry value, position and length', () => {
    const headCase = buildInsertSteps(nodes([10]), 5, 0, makeUi());
    expect(headCase[0].line).toBe(2);
    expect(headCase[0].vars).toEqual({ value: 5, pos: 0 });
    expect(headCase[1].line).toBe(3);
    expect(headCase[2].line).toBe(4);
    expect(headCase[3].line).toBe(5);
    expect(headCase[4].line).toBe(11);
    expect(headCase[4].vars).toEqual({ length: 2 });

    const midCase = buildInsertSteps(nodes([10, 20, 30]), 99, 2, makeUi());
    expect(midCase[1].line).toBe(7);
    expect(midCase[2].line).toBe(8);
    expect(midCase[3].line).toBe(10);
    expect(midCase[3].vars).toEqual({ position: 1 });
    expect(midCase[4].line).toBe(10);
    expect(midCase[4].vars).toEqual({ position: 2 });
    expect(midCase[5].line).toBe(11);
    midCase.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(LINKED_LIST_PSEUDOCODE.insert.length)
    );
  });

  test('remove steps carry position, value and length', () => {
    const steps = buildRemoveSteps(nodes([10, 20, 30]), 1, makeUi());
    expect(steps[0].line).toBe(1);
    expect(steps[0].vars).toEqual({ position: 1, value: 20 });
    expect(steps[1].line).toBe(6);
    expect(steps[2].line).toBe(7);
    expect(steps[3].line).toBe(8);
    expect(steps[4].line).toBe(9);
    expect(steps[4].vars).toEqual({ position: 1, value: 20 });
    expect(steps[5].line).toBe(10);
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(LINKED_LIST_PSEUDOCODE.remove.length)
    );
  });
});
