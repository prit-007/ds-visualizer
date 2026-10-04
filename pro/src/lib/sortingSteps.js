// Pure step builders for the sorting visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks with absolute highlight state so the player can
// replay steps 0..k when scrubbing. `line` is the 1-based line into
// SORTING_PSEUDOCODE; `vars` feeds the variable watch. Builders simulate
// the sort on a copy and narrate compare/swap/sorted-boundary events.

const clearUi = (ui) => {
  ui.setComparePair?.(null);
  ui.setSwapPair?.(null);
  ui.setActiveIndex?.(null);
};

export const buildBubbleSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const sorted = [];
  const steps = [
    {
      description: `Starting bubble sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => clearUi(ui),
    },
  ];

  for (let pass = 1; pass <= n - 1; pass++) {
    const endIdx = n - pass;
    if (endIdx <= 0) break;
    steps.push({
      description: `Pass ${pass}: bubbling the largest unsorted value to the end`,
      kind: 'compare',
      line: 3,
      vars: { pass, end: endIdx },
      action: () => {
        ui.setComparePair?.(null);
        ui.setSwapPair?.(null);
      },
    });

    let passSwaps = 0;
    for (let i = 0; i < endIdx; i++) {
      const a = arr[i];
      const b = arr[i + 1];
      steps.push({
        description: `Comparing positions ${i} and ${i + 1} (${a} vs ${b})`,
        kind: 'compare',
        line: 4,
        vars: { i, a, b },
        action: () => {
          ui.setComparePair?.([i, i + 1]);
          ui.setSwapPair?.(null);
        },
      });
      if (a > b) {
        steps.push({
          description: `Swapping ${a} and ${b}`,
          kind: 'move',
          line: 5,
          vars: { i },
          action: () => {
            ui.setComparePair?.(null);
            ui.setSwapPair?.([i, i + 1]);
          },
        });
        arr[i] = b;
        arr[i + 1] = a;
        passSwaps += 1;
      } else {
        steps.push({
          description: `${a} ≤ ${b} — no swap needed`,
          kind: 'compare',
          line: 4,
          vars: { i },
          action: () => {
            ui.setComparePair?.(null);
          },
        });
      }
    }

    sorted.unshift(endIdx);
    const bubbleSortedSnapshot = [...sorted];
    steps.push({
      description: `Pass ${pass} complete — ${arr[endIdx]} is sorted at position ${endIdx}`,
      kind: 'found',
      line: 6,
      vars: { pos: endIdx, value: arr[endIdx] },
      action: () => {
        ui.setSwapPair?.(null);
        ui.setSortedIndexes?.(bubbleSortedSnapshot);
      },
    });

    if (passSwaps === 0) {
      steps.push({
        description: `No swaps in pass ${pass} — the array is already sorted`,
        kind: 'found',
        line: 7,
        vars: { pass },
        action: () => {
          ui.setSortedIndexes?.(arr.map((_, idx) => idx));
        },
      });
      break;
    }
  }

  steps.push({
    description: `Array is sorted: ${arr.join(', ')}`,
    kind: 'found',
    line: 8,
    vars: { sorted: [...arr] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(arr.map((_, idx) => idx));
    },
  });

  return steps;
};

export const buildSelectionSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const sorted = [];
  const steps = [
    {
      description: `Starting selection sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => clearUi(ui),
    },
  ];

  for (let pass = 1; pass <= n - 1; pass++) {
    const from = pass - 1;
    steps.push({
      description: `Pass ${pass}: selecting the minimum of positions ${from}..${n - 1}`,
      kind: 'compare',
      line: 3,
      vars: { pass },
      action: () => {
        ui.setComparePair?.(null);
        ui.setSwapPair?.(null);
      },
    });

    let min = from;
    steps.push({
      description: `Assuming position ${min} (${arr[min]}) is the minimum`,
      kind: 'compare',
      line: 4,
      vars: { min, value: arr[min] },
      action: () => {
        ui.setActiveIndex?.(min);
      },
    });

    for (let j = from + 1; j < n; j++) {
      const stepJ = j;
      const stepMinIndex = min;
      const stepMinVal = arr[min];
      steps.push({
        description: `Comparing ${arr[j]} with minimum ${arr[min]} (position ${j})`,
        kind: 'compare',
        line: 6,
        vars: { j, a: arr[j], min: arr[min] },
        action: () => {
          ui.setComparePair?.([stepJ, stepMinIndex]);
        },
      });
      if (arr[j] < arr[min]) {
        min = j;
        const stepNewMin = stepJ;
        const stepNewVal = arr[j];
        steps.push({
          description: `New minimum: ${stepNewVal} at position ${stepNewMin}`,
          kind: 'compare',
          line: 6,
          vars: { min: stepNewMin, value: stepNewVal },
          action: () => {
            ui.setActiveIndex?.(stepNewMin);
            ui.setComparePair?.(null);
          },
        });
      } else {
        steps.push({
          description: `${arr[j]} ≥ ${stepMinVal} — minimum unchanged`,
          kind: 'compare',
          line: 6,
          vars: { j, a: arr[j], min: stepMinVal },
          action: () => {
            ui.setComparePair?.(null);
          },
        });
      }
    }

    if (min !== from) {
      const leftVal = arr[from];
      const rightVal = arr[min];
      const swapFrom = from;
      const swapTo = min;
      const tmp = arr[from];
      arr[from] = arr[min];
      arr[min] = tmp;
      steps.push({
        description: `Swapping positions ${swapFrom} and ${swapTo} (${leftVal} ↔ ${rightVal})`,
        kind: 'move',
        line: 7,
        vars: { from: swapFrom, to: swapTo },
        action: () => {
          ui.setComparePair?.(null);
          ui.setSwapPair?.([swapFrom, swapTo]);
        },
      });
    }

    sorted.push(from);
    const selectionSortedSnapshot = [...sorted];
    steps.push({
      description:
        from === 0
          ? `Pass ${pass} complete — ${arr[from]} is sorted at the front`
          : `Pass ${pass} complete — ${arr[from]} is in place at position ${from}`,
      kind: 'found',
      line: 7,
      vars: { pos: from, value: arr[from] },
      action: () => {
        ui.setSwapPair?.(null);
        ui.setSortedIndexes?.(selectionSortedSnapshot);
      },
    });
  }

  steps.push({
    description: `Array is sorted: ${arr.join(', ')}`,
    kind: 'found',
    line: 8,
    vars: { sorted: [...arr] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(arr.map((_, idx) => idx));
    },
  });

  return steps;
};

export const buildInsertionSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const steps = [
    {
      description: `Starting insertion sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => clearUi(ui),
    },
  ];

  for (let i = 1; i <= n - 1; i++) {
    const key = arr[i];
    steps.push({
      description: `Pass ${i}: inserting position ${i} into the sorted prefix`,
      kind: 'compare',
      line: 3,
      vars: { i },
      action: () => {
        ui.setComparePair?.(null);
        ui.setSwapPair?.(null);
      },
    });
    steps.push({
      description: `Taking key ${key} from position ${i}`,
      kind: 'move',
      line: 4,
      vars: { key, i },
      action: () => {
        ui.setActiveIndex?.(i);
      },
    });

    let j = i - 1;
    let shifted = false;
    while (j >= 0) {
      const stepJ = j;
      const stepOther = arr[j];
      steps.push({
        description: `Comparing key ${key} with ${stepOther} at position ${stepJ}`,
        kind: 'compare',
        line: 6,
        vars: { j: stepJ, a: stepOther, key },
        action: () => {
          ui.setComparePair?.([stepJ, stepJ + 1]);
        },
      });
      if (stepOther > key) {
        arr[stepJ + 1] = stepOther;
        steps.push({
          description: `Shifting ${stepOther} right to position ${stepJ + 1}`,
          kind: 'move',
          line: 7,
          vars: { j: stepJ, value: stepOther },
          action: () => {
            ui.setComparePair?.(null);
            ui.setSwapPair?.([stepJ, stepJ + 1]);
          },
        });
        j -= 1;
        shifted = true;
      } else {
        steps.push({
          description: `${key} ≥ ${stepOther} — key stays in place`,
          kind: 'compare',
          line: 6,
          vars: { j: stepJ, key },
          action: () => {
            ui.setComparePair?.(null);
          },
        });
        break;
      }
    }

    const placePos = j + 1;
    arr[placePos] = key;
    steps.push({
      description: `Placing key ${key} at position ${placePos}`,
      kind: 'move',
      line: 9,
      vars: { pos: placePos, key },
      action: () => {
        ui.setActiveIndex?.(placePos);
        ui.setSwapPair?.(null);
      },
    });

    if (!shifted && j + 1 === i) {
      // key never moved — sorted prefix grew in place
    }
  }

  steps.push({
    description: `Array is sorted: ${arr.join(', ')}`,
    kind: 'found',
    line: 10,
    vars: { sorted: [...arr] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(arr.map((_, idx) => idx));
    },
  });

  return steps;
};
