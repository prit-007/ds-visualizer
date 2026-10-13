// Pure step builders for the binary-heap visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks with absolute state so the player can replay steps
// 0..k when scrubbing. `line` is 1-based into HEAP_PSEUDOCODE. Builders
// replay the trace emitted by src/lib/heap.js on their own copy so every
// step carries a build-time display snapshot (animated swaps).

const clearUi = (ui) => {
  ui.setActiveIndex?.(null);
  ui.setComparePair?.(null);
  ui.setSwapPair?.(null);
};

export const buildInsertSteps = (items, value, trace, ui) => {
  const arr = [...items];
  const snap = () => [...arr];
  const steps = [
    {
      description: `Creating a new key ${value}`,
      kind: 'move',
      line: 1,
      vars: { value },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.([...items]);
      },
    },
  ];

  (trace ?? []).forEach((event) => {
    if (event.type === 'append') {
      arr.push(event.value);
      const index = event.index;
      const stepSnap = snap();
      steps.push({
        description:
          index === 0
            ? `Heap is empty — ${event.value} becomes the root`
            : `Appending ${event.value} at index ${index}`,
        kind: 'move',
        line: 2,
        vars: { index, value: event.value },
        action: () => {
          clearUi(ui);
          ui.setActiveIndex?.(index);
          ui.setDisplayArray?.(stepSnap);
        },
      });
    } else if (event.type === 'compare') {
      const stepSnap = snap();
      const { index, parent, value: v, parentValue } = event;
      steps.push({
        description: `Comparing ${v} with parent at index ${parent} (value ${parentValue})`,
        kind: 'compare',
        line: 4,
        vars: { index, parent, value: v, parentValue },
        action: () => {
          ui.setComparePair?.([index, parent]);
          ui.setDisplayArray?.(stepSnap);
        },
      });
    } else if (event.type === 'swap') {
      [arr[event.a], arr[event.b]] = [arr[event.b], arr[event.a]];
      const stepSnap = snap();
      const { a, b, aValue, bValue } = event;
      steps.push({
        description: `${aValue} < ${bValue} → swap with parent (bubble up)`,
        kind: 'move',
        line: 5,
        vars: { a, b },
        action: () => {
          ui.setComparePair?.(null);
          ui.setSwapPair?.([a, b]);
          ui.setDisplayArray?.(stepSnap);
        },
      });
    }
  });

  const finalSnap = snap();
  steps.push({
    description: `Heap property restored — heap now has ${items.length + 1} keys`,
    kind: 'found',
    line: 7,
    vars: { size: items.length + 1 },
    action: () => {
      clearUi(ui);
      ui.setDisplayArray?.(finalSnap);
    },
  });

  return steps;
};

export const buildExtractSteps = (items, trace, ui) => {
  const arr = [...items];
  const snap = () => [...arr];
  let min = null;
  const steps = [
    {
      description: `Heap has ${items.length} keys — extracting the minimum`,
      kind: 'move',
      line: 1,
      vars: { size: items.length },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.(snap());
      },
    },
  ];

  (trace ?? []).forEach((event) => {
    if (event.type === 'extract') {
      min = event.value;
      const stepSnap = snap();
      steps.push({
        description: `Minimum is ${event.value} at the root`,
        kind: 'found',
        line: 3,
        vars: { min: event.value },
        action: () => {
          ui.setActiveIndex?.(0);
          ui.setDisplayArray?.(stepSnap);
        },
      });
    } else if (event.type === 'move') {
      arr.pop();
      if (arr.length > 0) arr[0] = event.value;
      const stepSnap = snap();
      steps.push({
        description: `Moving last key ${event.value} to the root`,
        kind: 'move',
        line: 4,
        vars: { value: event.value },
        action: () => {
          clearUi(ui);
          ui.setActiveIndex?.(0);
          ui.setDisplayArray?.(stepSnap);
        },
      });
    } else if (event.type === 'compare-children') {
      const stepSnap = snap();
      const { index, value: v, left: l, right: r } = event;
      steps.push({
        description:
          r === null
            ? `Comparing ${v} with child ${l} at index ${index}`
            : `Comparing ${v} with children ${l} and ${r} at index ${index}`,
        kind: 'compare',
        line: 7,
        vars: { index, value: v, left: l, right: r },
        action: () => {
          ui.setComparePair?.([index, 2 * index + 1]);
          ui.setDisplayArray?.(stepSnap);
        },
      });
    } else if (event.type === 'swap') {
      [arr[event.a], arr[event.b]] = [arr[event.b], arr[event.a]];
      const stepSnap = snap();
      const { a, b, aValue, bValue } = event;
      steps.push({
        description: `${aValue} > smaller child ${bValue} → swap`,
        kind: 'move',
        line: 8,
        vars: { a, b },
        action: () => {
          ui.setComparePair?.(null);
          ui.setSwapPair?.([a, b]);
          ui.setDisplayArray?.(stepSnap);
        },
      });
    }
  });

  const restoredSnap = snap();
  steps.push({
    description: 'Heap property restored',
    kind: 'found',
    line: 6,
    action: () => {
      clearUi(ui);
      ui.setDisplayArray?.(restoredSnap);
    },
  });
  steps.push({
    description: `Extracted minimum: ${min}`,
    kind: 'found',
    line: 9,
    vars: { min },
    action: () => {
      clearUi(ui);
      ui.setDisplayArray?.(restoredSnap);
    },
  });

  return steps;
};

export const buildPeekSteps = (items, ui) => [
  {
    description: 'Finding the minimum (the root)',
    kind: 'move',
    line: 1,
    vars: { size: items.length },
    action: () => {
      clearUi(ui);
      ui.setDisplayArray?.([...items]);
    },
  },
  {
    description: `Minimum is ${items[0]}`,
    kind: 'found',
    line: 3,
    vars: { min: items[0] },
    action: () => {
      ui.setActiveIndex?.(0);
      ui.setDisplayArray?.([...items]);
    },
  },
];
