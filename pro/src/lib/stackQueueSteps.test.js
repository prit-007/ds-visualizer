import {
  buildPushSteps,
  buildPopSteps,
  buildStackPeekSteps,
  buildEnqueueSteps,
  buildDequeueSteps,
  buildQueuePeekSteps,
} from './stackQueueSteps';
import { STACK_PSEUDOCODE, QUEUE_PSEUDOCODE } from './pseudocode';

const makeUi = () => ({
  setActiveElementIndex: vi.fn(),
  setShiftingElements: vi.fn(),
  setRemovingElementIndex: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);
const kinds = (steps) => steps.map((s) => s.kind ?? 'neutral');
const runAll = (steps) => steps.forEach((s) => s.action && s.action());
const activeCalls = (ui) => ui.setActiveElementIndex.mock.calls.map((c) => c[0]);
const shiftingCalls = (ui) => ui.setShiftingElements.mock.calls.map((c) => c[0]);
const removingCalls = (ui) => ui.setRemovingElementIndex.mock.calls.map((c) => c[0]);

describe('buildPushSteps', () => {
  test('creates, finds the top, pushes, then reports the size', () => {
    const ui = makeUi();
    const steps = buildPushSteps([10, 20, 30], 40, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new element with value 40',
      'Finding the top of the stack (index 2)',
      'Pushing 40 onto the top',
      'Stack size is now 4',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 2, 3]);
    expect(shiftingCalls(ui)).toEqual([[]]);
    expect(kinds(steps)).toEqual(['neutral', 'compare', 'move', 'found']);
  });

  test('pushing onto an empty stack finds no top yet', () => {
    const ui = makeUi();
    const steps = buildPushSteps([], 7, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new element with value 7',
      'Finding the top of the stack (index -1)',
      'Pushing 7 onto the top',
      'Stack size is now 1',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, null, 0]);
  });
});

describe('buildPopSteps', () => {
  test('marks the top for removal then clears highlights', () => {
    const ui = makeUi();
    const steps = buildPopSteps([10, 20, 30], ui);

    expect(descriptions(steps)).toEqual([
      'Finding the top of the stack (index 2)',
      'Popping 30 from the top',
      'Stack size is now 2',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([2, null]);
    expect(removingCalls(ui)).toEqual([null, 2, null]);
    expect(kinds(steps)).toEqual(['compare', 'move', 'found']);
  });
});

describe('buildStackPeekSteps', () => {
  test('highlights the top without removing anything', () => {
    const ui = makeUi();
    const steps = buildStackPeekSteps([10, 20, 30], ui);

    expect(descriptions(steps)).toEqual([
      'Finding the top of the stack (index 2)',
      'Top of the stack is 30',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([2]);
    expect(removingCalls(ui)).toEqual([null]);
    expect(shiftingCalls(ui)).toEqual([[]]);
    expect(kinds(steps)).toEqual(['compare', 'found']);
  });
});

describe('buildEnqueueSteps', () => {
  test('creates, finds the rear, enqueues, then reports the size', () => {
    const ui = makeUi();
    const steps = buildEnqueueSteps([10, 20], 30, ui);

    expect(descriptions(steps)).toEqual([
      'Creating a new element with value 30',
      'Finding the rear of the queue (index 1)',
      'Enqueuing 30 at the rear',
      'Queue size is now 3',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([null, 1, 2]);
    expect(kinds(steps)).toEqual(['neutral', 'compare', 'move', 'found']);
  });
});

describe('buildDequeueSteps', () => {
  test('removes the front then shifts each remaining element', () => {
    const ui = makeUi();
    const steps = buildDequeueSteps([10, 20, 30], ui);

    expect(descriptions(steps)).toEqual([
      'Finding the front of the queue (index 0)',
      'Dequeuing 10 from the front',
      'Shifting element at index 1 to index 0',
      'Shifting element at index 2 to index 1',
      'Queue size is now 2',
    ]);

    runAll(steps);
    expect(removingCalls(ui)).toEqual([null, 0, null]);
    expect(shiftingCalls(ui)).toEqual([[], [1], [2], []]);
    expect(activeCalls(ui)).toEqual([0, null]);
    expect(kinds(steps)).toEqual(['compare', 'move', 'move', 'move', 'found']);
  });

  test('dequeuing the only element shifts nothing', () => {
    const ui = makeUi();
    const steps = buildDequeueSteps([42], ui);

    expect(descriptions(steps)).toEqual([
      'Finding the front of the queue (index 0)',
      'Dequeuing 42 from the front',
      'Queue size is now 0',
    ]);

    runAll(steps);
    expect(shiftingCalls(ui)).toEqual([[], []]);
  });
});

describe('buildQueuePeekSteps', () => {
  test('highlights the front without removing anything', () => {
    const ui = makeUi();
    const steps = buildQueuePeekSteps([10, 20], ui);

    expect(descriptions(steps)).toEqual([
      'Finding the front of the queue (index 0)',
      'Front of the queue is 10',
    ]);

    runAll(steps);
    expect(activeCalls(ui)).toEqual([0]);
    expect(removingCalls(ui)).toEqual([null]);
    expect(kinds(steps)).toEqual(['compare', 'found']);
  });
});

describe('every step has a non-empty description', () => {
  test('all six builders', () => {
    const ui = makeUi();
    [
      buildPushSteps([1], 2, ui),
      buildPopSteps([1], ui),
      buildStackPeekSteps([1], ui),
      buildEnqueueSteps([1], 2, ui),
      buildDequeueSteps([1], ui),
      buildQueuePeekSteps([1], ui),
    ].forEach((steps) =>
      steps.forEach((s) => expect(s.description.length).toBeGreaterThan(0))
    );
  });
});

describe('pseudocode lines and variable watch', () => {
  test('push steps line up with the stackPush listing', () => {
    const steps = buildPushSteps([10, 20], 30, makeUi());
    expect(steps.map((s) => s.line)).toEqual([1, 2, 3, 4]);
    expect(steps[0].vars).toEqual({ value: 30 });
    expect(steps[1].vars).toEqual({ n: 2 });
    expect(steps[3].vars).toEqual({ size: 3 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(STACK_PSEUDOCODE.push.length)
    );
  });

  test('pop steps line up with the stackPop listing', () => {
    const steps = buildPopSteps([10, 20, 30], makeUi());
    expect(steps.map((s) => s.line)).toEqual([2, 3, 4]);
    expect(steps[1].vars).toEqual({ removed: 30 });
    expect(steps[2].vars).toEqual({ size: 2 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(STACK_PSEUDOCODE.pop.length)
    );
  });

  test('stack peek steps line up with the stackPeek listing', () => {
    const steps = buildStackPeekSteps([10, 20], makeUi());
    expect(steps.map((s) => s.line)).toEqual([2, 4]);
    expect(steps[1].vars).toEqual({ top: 20 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(STACK_PSEUDOCODE.peek.length)
    );
  });

  test('enqueue steps line up with the queueEnqueue listing', () => {
    const steps = buildEnqueueSteps([10], 20, makeUi());
    expect(steps.map((s) => s.line)).toEqual([1, 2, 3, 4]);
    expect(steps[1].vars).toEqual({ n: 1 });
    expect(steps[3].vars).toEqual({ size: 2 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(QUEUE_PSEUDOCODE.enqueue.length)
    );
  });

  test('dequeue steps carry the front value and shift indices', () => {
    const steps = buildDequeueSteps([10, 20, 30], makeUi());
    expect(steps.map((s) => s.line)).toEqual([2, 3, 5, 5, 6]);
    expect(steps[1].vars).toEqual({ removed: 10 });
    expect(steps[2].vars).toEqual({ i: 1 });
    expect(steps[3].vars).toEqual({ i: 2 });
    expect(steps[4].vars).toEqual({ size: 2 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(QUEUE_PSEUDOCODE.dequeue.length)
    );
  });

  test('queue peek steps line up with the queuePeek listing', () => {
    const steps = buildQueuePeekSteps([10, 20], makeUi());
    expect(steps.map((s) => s.line)).toEqual([2, 3]);
    expect(steps[1].vars).toEqual({ front: 10 });
    steps.forEach((s) =>
      expect(s.line).toBeLessThanOrEqual(QUEUE_PSEUDOCODE.peek.length)
    );
  });
});
