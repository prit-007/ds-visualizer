// Pure step builders for the stack & queue visualizer. Stack is LIFO
// (top = last index), queue is FIFO (front = index 0, rear = last index).
// Each returns [{ description, action, kind?, line, vars? }] where actions
// call the page's ui callbacks with absolute state so the player can replay
// steps 0..k when scrubbing. `line` is the 1-based line into
// STACK_PSEUDOCODE / QUEUE_PSEUDOCODE; `vars` feeds the variable watch.
// Builders assume non-empty data for pop/dequeue/peek — the page validates.

const pushLikeSteps = (items, value, ui, labels) => {
  const { setActiveElementIndex, setShiftingElements } = ui;
  const n = items.length;
  return [
    {
      description: `Creating a new element with value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveElementIndex(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Finding the ${labels.end} of the ${labels.name} (index ${n - 1})`,
      kind: 'compare',
      line: 2,
      vars: { n },
      action: () => {
        setActiveElementIndex(n > 0 ? n - 1 : null);
      },
    },
    {
      description: `${labels.put} ${value} ${labels.where}`,
      kind: 'move',
      line: 3,
      vars: { value },
      action: () => {},
    },
    {
      description: `${labels.label} size is now ${n + 1}`,
      kind: 'found',
      line: 4,
      vars: { size: n + 1 },
      action: () => {
        setActiveElementIndex(n);
      },
    },
  ];
};

export const buildPushSteps = (items, value, ui) =>
  pushLikeSteps(items, value, ui, {
    name: 'stack',
    end: 'top',
    put: 'Pushing',
    where: 'onto the top',
    label: 'Stack',
  });

export const buildEnqueueSteps = (items, value, ui) =>
  pushLikeSteps(items, value, ui, {
    name: 'queue',
    end: 'rear',
    put: 'Enqueuing',
    where: 'at the rear',
    label: 'Queue',
  });

export const buildPopSteps = (items, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  const n = items.length;
  const top = n - 1;
  return [
    {
      description: `Finding the top of the stack (index ${top})`,
      kind: 'compare',
      line: 2,
      vars: { n },
      action: () => {
        setActiveElementIndex(top);
        setRemovingElementIndex?.(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Popping ${items[top]} from the top`,
      kind: 'move',
      line: 3,
      vars: { removed: items[top] },
      action: () => {
        setRemovingElementIndex?.(top);
      },
    },
    {
      description: `Stack size is now ${n - 1}`,
      kind: 'found',
      line: 4,
      vars: { size: n - 1 },
      action: () => {
        setActiveElementIndex(null);
        setRemovingElementIndex?.(null);
        setShiftingElements?.([]);
      },
    },
  ];
};

export const buildStackPeekSteps = (items, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  const n = items.length;
  const top = n - 1;
  return [
    {
      description: `Finding the top of the stack (index ${top})`,
      kind: 'compare',
      line: 2,
      vars: { n },
      action: () => {
        setActiveElementIndex(top);
        setRemovingElementIndex?.(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Top of the stack is ${items[top]}`,
      kind: 'found',
      line: 4,
      vars: { top: items[top] },
      action: () => {},
    },
  ];
};

export const buildDequeueSteps = (items, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  const n = items.length;
  const steps = [
    {
      description: 'Finding the front of the queue (index 0)',
      kind: 'compare',
      line: 2,
      vars: { n },
      action: () => {
        setActiveElementIndex(0);
        setRemovingElementIndex?.(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Dequeuing ${items[0]} from the front`,
      kind: 'move',
      line: 3,
      vars: { removed: items[0] },
      action: () => {
        setRemovingElementIndex?.(0);
      },
    },
  ];

  for (let i = 1; i < n; i++) {
    steps.push({
      description: `Shifting element at index ${i} to index ${i - 1}`,
      kind: 'move',
      line: 5,
      vars: { i },
      action: () => {
        setShiftingElements([i]);
      },
    });
  }

  steps.push({
    description: `Queue size is now ${n - 1}`,
    kind: 'found',
    line: 6,
    vars: { size: n - 1 },
    action: () => {
      setActiveElementIndex(null);
      setRemovingElementIndex?.(null);
      setShiftingElements?.([]);
    },
  });

  return steps;
};

export const buildQueuePeekSteps = (items, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  return [
    {
      description: 'Finding the front of the queue (index 0)',
      kind: 'compare',
      line: 2,
      vars: { n: items.length },
      action: () => {
        setActiveElementIndex(0);
        setRemovingElementIndex?.(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Front of the queue is ${items[0]}`,
      kind: 'found',
      line: 3,
      vars: { front: items[0] },
      action: () => {},
    },
  ];
};
