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

// ---- Deque builders (double-ended queue) ----

export const buildPushFrontSteps = (items, value, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  const n = items.length;
  const steps = [
    {
      description: `Creating a new element with value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveElementIndex(null);
        setShiftingElements?.([]);
        setRemovingElementIndex?.(null);
      },
    },
    {
      description: 'Finding the front of the deque (index 0)',
      kind: 'compare',
      line: 2,
      vars: { n },
      action: () => {
        setActiveElementIndex(n > 0 ? 0 : null);
      },
    },
  ];

  for (let i = n - 1; i >= 0; i--) {
    steps.push({
      description: `Shifting element at index ${i} to index ${i + 1}`,
      kind: 'move',
      line: 4,
      vars: { i },
      action: () => {
        setShiftingElements?.([i]);
      },
    });
  }

  steps.push(
    {
      description: `Pushing ${value} at the front`,
      kind: 'move',
      line: 5,
      vars: { value },
      action: () => {
        setShiftingElements?.([]);
        setActiveElementIndex(0);
      },
    },
    {
      description: `Deque size is now ${n + 1}`,
      kind: 'found',
      line: 6,
      vars: { size: n + 1 },
      action: () => {
        setActiveElementIndex(0);
      },
    }
  );

  return steps;
};

export const buildPopFrontSteps = (items, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  const n = items.length;
  const steps = [
    {
      description: 'Finding the front of the deque (index 0)',
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
      description: `Popping ${items[0]} from the front`,
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
        setShiftingElements?.([i]);
      },
    });
  }

  steps.push({
    description: `Deque size is now ${n - 1}`,
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

export const buildPushRearSteps = (items, value, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  return [
    {
      description: `Creating a new element with value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveElementIndex(null);
        setShiftingElements?.([]);
        setRemovingElementIndex?.(null);
      },
    },
    {
      description: `Finding the rear of the deque (index ${items.length - 1})`,
      kind: 'compare',
      line: 2,
      vars: { n: items.length },
      action: () => {
        setActiveElementIndex(items.length > 0 ? items.length - 1 : null);
      },
    },
    {
      description: `Pushing ${value} at the rear`,
      kind: 'move',
      line: 3,
      vars: { value },
      action: () => {},
    },
    {
      description: `Deque size is now ${items.length + 1}`,
      kind: 'found',
      line: 4,
      vars: { size: items.length + 1 },
      action: () => {
        setActiveElementIndex(items.length);
      },
    },
  ];
};

export const buildPopRearSteps = (items, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  const n = items.length;
  return [
    {
      description: `Finding the rear of the deque (index ${n - 1})`,
      kind: 'compare',
      line: 2,
      vars: { n },
      action: () => {
        setActiveElementIndex(n - 1);
        setRemovingElementIndex?.(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Popping ${items[n - 1]} from the rear`,
      kind: 'move',
      line: 3,
      vars: { removed: items[n - 1] },
      action: () => {
        setRemovingElementIndex?.(n - 1);
      },
    },
    {
      description: `Deque size is now ${n - 1}`,
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

// ---- Circular queue builders (fixed-capacity ring buffer) ----

export const buildCircularEnqueueSteps = (state, value, ui) => {
  const { front, count, capacity } = state;
  const rear = (front + count) % capacity;
  return [
    {
      description: `Creating a new element with value ${value}`,
      line: 1,
      vars: { value },
      action: () => {},
    },
    {
      description: `Rear slot is index ${rear} ((front ${front} + count ${count}) mod ${capacity})`,
      kind: 'compare',
      line: 3,
      vars: { front, count, capacity, rear },
      action: () => {},
    },
    {
      description: `Writing ${value} at ring index ${rear}`,
      kind: 'move',
      line: 4,
      vars: { rear, value },
      action: () => {
        ui.setActiveSlot?.(rear);
        ui.setRemovingSlot?.(null);
      },
    },
    {
      description: `Circular queue now has ${count + 1} of ${capacity} slots filled`,
      kind: 'found',
      line: 5,
      vars: { count: count + 1, capacity },
      action: () => {
        ui.setActiveSlot?.(rear);
      },
    },
  ];
};

export const buildCircularDequeueSteps = (state, ui) => {
  const { slots, front, count, capacity } = state;
  const next = (front + 1) % capacity;
  return [
    {
      description: `Front slot is index ${front}`,
      kind: 'compare',
      line: 3,
      vars: { front, count, capacity },
      action: () => {
        ui.setActiveSlot?.(front);
        ui.setRemovingSlot?.(null);
      },
    },
    {
      description: `Dequeuing ${slots[front]} from ring index ${front}`,
      kind: 'move',
      line: 4,
      vars: { front, value: slots[front] },
      action: () => {
        ui.setRemovingSlot?.(front);
      },
    },
    {
      description: `Front advances to ${next} ((${front} + 1) mod ${capacity})`,
      kind: 'move',
      line: 5,
      vars: { front, capacity, next },
      action: () => {},
    },
    {
      description: `Circular queue now has ${count - 1} of ${capacity} slots filled`,
      kind: 'found',
      line: 6,
      vars: { count: count - 1, capacity },
      action: () => {
        ui.setActiveSlot?.(next);
        ui.setRemovingSlot?.(null);
      },
    },
  ];
};

export const buildCircularPeekSteps = (state, ui) => {
  const { slots, front, count, capacity } = state;
  return [
    {
      description: `Front slot is index ${front}`,
      kind: 'compare',
      line: 3,
      vars: { front, count, capacity },
      action: () => {
        ui.setActiveSlot?.(front);
      },
    },
    {
      description: `Front of the circular queue is ${slots[front]}`,
      kind: 'found',
      line: 4,
      vars: { value: slots[front] },
      action: () => {},
    },
  ];
};
