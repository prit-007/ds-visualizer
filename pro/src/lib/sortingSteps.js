// Pure step builders for the sorting visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks with absolute highlight state so the player can
// replay steps 0..k when scrubbing. `line` is the 1-based line into
// SORTING_PSEUDOCODE; `vars` feeds the variable watch. Builders simulate
// the sort on a copy and narrate compare/swap/sorted-boundary events.
// Each step also carries a build-time snapshot of the working array via
// `ui.setDisplayArray` so the page can animate element positions (swaps
// actually move) instead of only highlighting.

const clearUi = (ui) => {
  ui.setComparePair?.(null);
  ui.setSwapPair?.(null);
  ui.setActiveIndex?.(null);
};

export const buildBubbleSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const sorted = [];
  const snapshot = () => [...arr];
  const steps = [
    {
      description: `Starting bubble sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.([...items]);
      },
    },
  ];

  for (let pass = 1; pass <= n - 1; pass++) {
    const endIdx = n - pass;
    if (endIdx <= 0) break;
    const passHeaderSnap = snapshot();
    steps.push({
      description: `Pass ${pass}: bubbling the largest unsorted value to the end`,
      kind: 'compare',
      line: 3,
      vars: { pass, end: endIdx },
      action: () => {
        ui.setComparePair?.(null);
        ui.setSwapPair?.(null);
        ui.setDisplayArray?.(passHeaderSnap);
      },
    });

    let passSwaps = 0;
    for (let i = 0; i < endIdx; i++) {
      const a = arr[i];
      const b = arr[i + 1];
      const cmpSnap = snapshot();
      steps.push({
        description: `Comparing positions ${i} and ${i + 1} (${a} vs ${b})`,
        kind: 'compare',
        line: 4,
        vars: { i, a, b },
        action: () => {
          ui.setComparePair?.([i, i + 1]);
          ui.setSwapPair?.(null);
          ui.setDisplayArray?.(cmpSnap);
        },
      });
      if (a > b) {
        arr[i] = b;
        arr[i + 1] = a;
        const swapSnap = snapshot();
        steps.push({
          description: `Swapping ${a} and ${b}`,
          kind: 'move',
          line: 5,
          vars: { i },
          action: () => {
            ui.setComparePair?.(null);
            ui.setSwapPair?.([i, i + 1]);
            ui.setDisplayArray?.(swapSnap);
          },
        });
        passSwaps += 1;
      } else {
        const noSwapSnap = snapshot();
        steps.push({
          description: `${a} ≤ ${b} — no swap needed`,
          kind: 'compare',
          line: 4,
          vars: { i },
          action: () => {
            ui.setComparePair?.(null);
            ui.setDisplayArray?.(noSwapSnap);
          },
        });
      }
    }

    sorted.unshift(endIdx);
    const bubbleSortedSnapshot = [...sorted];
    const passDoneSnap = snapshot();
    steps.push({
      description: `Pass ${pass} complete — ${arr[endIdx]} is sorted at position ${endIdx}`,
      kind: 'found',
      line: 6,
      vars: { pos: endIdx, value: arr[endIdx] },
      action: () => {
        ui.setSwapPair?.(null);
        ui.setSortedIndexes?.(bubbleSortedSnapshot);
        ui.setDisplayArray?.(passDoneSnap);
      },
    });

    if (passSwaps === 0) {
      const earlySnap = snapshot();
      steps.push({
        description: `No swaps in pass ${pass} — the array is already sorted`,
        kind: 'found',
        line: 7,
        vars: { pass },
        action: () => {
          ui.setSortedIndexes?.(arr.map((_, idx) => idx));
          ui.setDisplayArray?.(earlySnap);
        },
      });
      break;
    }
  }

  const finalSnap = snapshot();
  steps.push({
    description: `Array is sorted: ${arr.join(', ')}`,
    kind: 'found',
    line: 8,
    vars: { sorted: [...arr] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(arr.map((_, idx) => idx));
      ui.setDisplayArray?.(finalSnap);
    },
  });

  return steps;
};

export const buildSelectionSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const sorted = [];
  const snapshot = () => [...arr];
  const steps = [
    {
      description: `Starting selection sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.([...items]);
      },
    },
  ];

  for (let pass = 1; pass <= n - 1; pass++) {
    const from = pass - 1;
    const passHeaderSnap = snapshot();
    steps.push({
      description: `Pass ${pass}: selecting the minimum of positions ${from}..${n - 1}`,
      kind: 'compare',
      line: 3,
      vars: { pass },
      action: () => {
        ui.setComparePair?.(null);
        ui.setSwapPair?.(null);
        ui.setDisplayArray?.(passHeaderSnap);
      },
    });

    let min = from;
    const assumeSnap = snapshot();
    steps.push({
      description: `Assuming position ${min} (${arr[min]}) is the minimum`,
      kind: 'compare',
      line: 4,
      vars: { min, value: arr[min] },
      action: () => {
        ui.setActiveIndex?.(min);
        ui.setDisplayArray?.(assumeSnap);
      },
    });

    for (let j = from + 1; j < n; j++) {
      const stepJ = j;
      const stepMinIndex = min;
      const stepMinVal = arr[min];
      const cmpSnap = snapshot();
      steps.push({
        description: `Comparing ${arr[j]} with minimum ${arr[min]} (position ${j})`,
        kind: 'compare',
        line: 6,
        vars: { j, a: arr[j], min: arr[min] },
        action: () => {
          ui.setComparePair?.([stepJ, stepMinIndex]);
          ui.setDisplayArray?.(cmpSnap);
        },
      });
      if (arr[j] < arr[min]) {
        min = j;
        const stepNewMin = stepJ;
        const stepNewVal = arr[j];
        const newMinSnap = snapshot();
        steps.push({
          description: `New minimum: ${stepNewVal} at position ${stepNewMin}`,
          kind: 'compare',
          line: 6,
          vars: { min: stepNewMin, value: stepNewVal },
          action: () => {
            ui.setActiveIndex?.(stepNewMin);
            ui.setComparePair?.(null);
            ui.setDisplayArray?.(newMinSnap);
          },
        });
      } else {
        const unchangedSnap = snapshot();
        steps.push({
          description: `${arr[j]} ≥ ${stepMinVal} — minimum unchanged`,
          kind: 'compare',
          line: 6,
          vars: { j, a: arr[j], min: stepMinVal },
          action: () => {
            ui.setComparePair?.(null);
            ui.setDisplayArray?.(unchangedSnap);
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
      const swapSnap = snapshot();
      steps.push({
        description: `Swapping positions ${swapFrom} and ${swapTo} (${leftVal} ↔ ${rightVal})`,
        kind: 'move',
        line: 7,
        vars: { from: swapFrom, to: swapTo },
        action: () => {
          ui.setComparePair?.(null);
          ui.setSwapPair?.([swapFrom, swapTo]);
          ui.setDisplayArray?.(swapSnap);
        },
      });
    }

    sorted.push(from);
    const selectionSortedSnapshot = [...sorted];
    const passDoneSnap = snapshot();
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
        ui.setDisplayArray?.(passDoneSnap);
      },
    });
  }

  const finalSnap = snapshot();
  steps.push({
    description: `Array is sorted: ${arr.join(', ')}`,
    kind: 'found',
    line: 8,
    vars: { sorted: [...arr] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(arr.map((_, idx) => idx));
      ui.setDisplayArray?.(finalSnap);
    },
  });

  return steps;
};

export const buildInsertionSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const snapshot = () => [...arr];
  const steps = [
    {
      description: `Starting insertion sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.([...items]);
      },
    },
  ];

  for (let i = 1; i <= n - 1; i++) {
    const key = arr[i];
    const passHeaderSnap = snapshot();
    steps.push({
      description: `Pass ${i}: inserting position ${i} into the sorted prefix`,
      kind: 'compare',
      line: 3,
      vars: { i },
      action: () => {
        ui.setComparePair?.(null);
        ui.setSwapPair?.(null);
        ui.setDisplayArray?.(passHeaderSnap);
      },
    });
    const takeKeySnap = snapshot();
    steps.push({
      description: `Taking key ${key} from position ${i}`,
      kind: 'move',
      line: 4,
      vars: { key, i },
      action: () => {
        ui.setActiveIndex?.(i);
        ui.setDisplayArray?.(takeKeySnap);
      },
    });

    let j = i - 1;
    while (j >= 0) {
      const stepJ = j;
      const stepOther = arr[j];
      const cmpSnap = snapshot();
      steps.push({
        description: `Comparing key ${key} with ${stepOther} at position ${stepJ}`,
        kind: 'compare',
        line: 6,
        vars: { j: stepJ, a: stepOther, key },
        action: () => {
          ui.setComparePair?.([stepJ, stepJ + 1]);
          ui.setDisplayArray?.(cmpSnap);
        },
      });
      if (stepOther > key) {
        arr[stepJ + 1] = stepOther;
        const shiftSnap = snapshot();
        steps.push({
          description: `Shifting ${stepOther} right to position ${stepJ + 1}`,
          kind: 'move',
          line: 7,
          vars: { j: stepJ, value: stepOther },
          action: () => {
            ui.setComparePair?.(null);
            ui.setSwapPair?.([stepJ, stepJ + 1]);
            ui.setDisplayArray?.(shiftSnap);
          },
        });
        j -= 1;
      } else {
        const keyStaysSnap = snapshot();
        steps.push({
          description: `${key} ≥ ${stepOther} — key stays in place`,
          kind: 'compare',
          line: 6,
          vars: { j: stepJ, key },
          action: () => {
            ui.setComparePair?.(null);
            ui.setDisplayArray?.(keyStaysSnap);
          },
        });
        break;
      }
    }

    const placePos = j + 1;
    arr[placePos] = key;
    const placeSnap = snapshot();
    steps.push({
      description: `Placing key ${key} at position ${placePos}`,
      kind: 'move',
      line: 9,
      vars: { pos: placePos, key },
      action: () => {
        ui.setActiveIndex?.(placePos);
        ui.setSwapPair?.(null);
        ui.setDisplayArray?.(placeSnap);
      },
    });
  }

  const finalSnap = snapshot();
  steps.push({
    description: `Array is sorted: ${arr.join(', ')}`,
    kind: 'found',
    line: 10,
    vars: { sorted: [...arr] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(arr.map((_, idx) => idx));
      ui.setDisplayArray?.(finalSnap);
    },
  });

  return steps;
};

export const buildMergeSteps = (items, ui) => {
  const n = items.length;
  const snapshot = () => [...display];
  const display = [...items];
  const steps = [
    {
      description: `Starting merge sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.([...items]);
      },
    },
  ];

  const mergeSort = (arr, lo, hi) => {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const splitSnap = snapshot();
    steps.push({
      description: `Splitting [${arr.join(', ')}] into [${arr.slice(0, mid).join(', ')}] and [${arr.slice(mid).join(', ')}]`,
      kind: 'compare',
      line: 3,
      vars: { range: [lo, hi - 1], mid },
      action: () => {
        ui.setDisplayArray?.(splitSnap);
      },
    });
    const left = mergeSort(arr.slice(0, mid), lo, lo + mid);
    const right = mergeSort(arr.slice(mid), lo + mid, hi);

    const mergeHeaderSnap = snapshot();
    steps.push({
      description: `Merging [${left.join(', ')}] and [${right.join(', ')}]`,
      kind: 'compare',
      line: 6,
      vars: { left: [...left], right: [...right] },
      action: () => {
        ui.setDisplayArray?.(mergeHeaderSnap);
      },
    });

    const result = [];
    let i = 0;
    let j = 0;
    let out = lo;
    while (i < left.length && j < right.length) {
      const stepI = i;
      const stepJ = j;
      const cmpSnap = snapshot();
      const takeVal = left[stepI] <= right[stepJ] ? left[stepI] : right[stepJ];
      steps.push({
        description: `Comparing heads ${left[stepI]} and ${right[stepJ]} → take ${takeVal}`,
        kind: 'compare',
        line: 7,
        vars: { a: left[stepI], b: right[stepJ], take: takeVal },
        action: () => {
          ui.setComparePair?.([lo + stepI, lo + mid + stepJ]);
          ui.setDisplayArray?.(cmpSnap);
        },
      });
      if (left[stepI] <= right[stepJ]) {
        const takenVal = left[stepI];
        result.push(takenVal);
        display[out] = takenVal;
        const placedAt = out;
        out += 1;
        i += 1;
        const takeSnap = snapshot();
        steps.push({
          description: `Taking ${takenVal} from the left run`,
          kind: 'move',
          line: 7,
          vars: { value: takenVal },
          action: () => {
            ui.setComparePair?.(null);
            ui.setSwapPair?.([placedAt, placedAt]);
            ui.setDisplayArray?.(takeSnap);
          },
        });
      } else {
        const takenVal = right[stepJ];
        result.push(takenVal);
        display[out] = takenVal;
        const placedAt = out;
        out += 1;
        j += 1;
        const takeSnap = snapshot();
        steps.push({
          description: `Taking ${takenVal} from the right run`,
          kind: 'move',
          line: 7,
          vars: { value: takenVal },
          action: () => {
            ui.setComparePair?.(null);
            ui.setSwapPair?.([placedAt, placedAt]);
            ui.setDisplayArray?.(takeSnap);
          },
        });
      }
    }
    while (i < left.length) {
      const takenVal = left[i];
      result.push(takenVal);
      display[out] = takenVal;
      out += 1;
      i += 1;
      const takeSnap = snapshot();
      steps.push({
        description: `Taking ${takenVal} (leftover)`,
        kind: 'move',
        line: 8,
        vars: { value: takenVal },
        action: () => {
          ui.setDisplayArray?.(takeSnap);
        },
      });
    }
    while (j < right.length) {
      const takenVal = right[j];
      result.push(takenVal);
      display[out] = takenVal;
      out += 1;
      j += 1;
      const takeSnap = snapshot();
      steps.push({
        description: `Taking ${takenVal} (leftover)`,
        kind: 'move',
        line: 8,
        vars: { value: takenVal },
        action: () => {
          ui.setDisplayArray?.(takeSnap);
        },
      });
    }

    for (let k = 0; k < result.length; k += 1) {
      display[lo + k] = result[k];
    }
    const runSnap = snapshot();
    steps.push({
      description: `Merged run: ${result.join(', ')}`,
      kind: 'found',
      line: 9,
      vars: { run: [...result] },
      action: () => {
        ui.setSwapPair?.(null);
        ui.setDisplayArray?.(runSnap);
      },
    });
    return result;
  };

  const sortedArr = mergeSort([...items], 0, n);
  const finalSnap = [...sortedArr];
  steps.push({
    description: `Merge sort complete: ${sortedArr.join(', ')}`,
    kind: 'found',
    line: 10,
    vars: { sorted: [...sortedArr] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(sortedArr.map((_, idx) => idx));
      ui.setDisplayArray?.(finalSnap);
    },
  });

  return steps;
};

export const buildQuickSteps = (items, ui) => {
  const n = items.length;
  const display = [...items];
  const snapshot = () => [...display];
  const steps = [
    {
      description: `Starting quick sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.([...items]);
      },
    },
  ];

  const quickSort = (lo, hi) => {
    if (lo >= hi) {
      if (lo === hi) {
        const singleSnap = snapshot();
        steps.push({
          description: `Single element [${display[lo]}] at position ${lo} is in place`,
          kind: 'found',
          line: 6,
          vars: { pos: lo, value: display[lo] },
          action: () => {
            ui.setSortedIndexes?.((prev) => prev);
            ui.setDisplayArray?.(singleSnap);
          },
        });
      }
      return;
    }

    const pivot = display[hi];
    const pivotSnap = snapshot();
    steps.push({
      description: `Choosing pivot ${pivot} (last element of [${lo}..${hi}])`,
      kind: 'compare',
      line: 3,
      vars: { pivot, lo, hi },
      action: () => {
        ui.setActiveIndex?.(hi);
        ui.setDisplayArray?.(pivotSnap);
      },
    });

    let store = lo;
    for (let k = lo; k < hi; k += 1) {
      const value = display[k];
      const cmpSnap = snapshot();
      steps.push({
        description:
          value <= pivot
            ? `Comparing ${value} with pivot ${pivot} → left partition`
            : `Comparing ${value} with pivot ${pivot} → right partition`,
        kind: 'compare',
        line: 3,
        vars: { value, pivot, k },
        action: () => {
          ui.setComparePair?.([k, hi]);
          ui.setDisplayArray?.(cmpSnap);
        },
      });
      if (value <= pivot) {
        if (store !== k) {
          const tmp = display[store];
          display[store] = value;
          display[k] = tmp;
          const toPos = store;
          const fromPos = k;
          const swapSnap = snapshot();
          steps.push({
            description: `Swapping ${value} and ${tmp} to grow the left partition`,
            kind: 'move',
            line: 3,
            vars: { from: fromPos, to: toPos },
            action: () => {
              ui.setSwapPair?.([fromPos, toPos]);
              ui.setDisplayArray?.(swapSnap);
            },
          });
        }
        store += 1;
      }
    }

    if (store !== hi) {
      const tmp = display[store];
      display[store] = pivot;
      display[hi] = tmp;
    }
    const placeSnap = snapshot();
    steps.push({
      description: `Placing pivot ${pivot} at position ${store}`,
      kind: 'move',
      line: 3,
      vars: { pos: store, pivot },
      action: () => {
        ui.setActiveIndex?.(store);
        ui.setSwapPair?.(null);
        ui.setDisplayArray?.(placeSnap);
      },
    });

    const recurseSnap = snapshot();
    const leftSlice = display.slice(lo, store);
    const rightSlice = display.slice(store + 1, hi + 1);
    steps.push({
      description: `Recursing on left [${leftSlice.join(', ')}] and right [${rightSlice.join(', ')}]`,
      kind: 'compare',
      line: 5,
      vars: { lo, hi, p: store },
      action: () => {
        ui.setDisplayArray?.(recurseSnap);
      },
    });

    quickSort(lo, store - 1);
    quickSort(store + 1, hi);
  };

  quickSort(0, n - 1);
  const finalSnap = [...display];
  steps.push({
    description: `Quick sort complete: ${display.join(', ')}`,
    kind: 'found',
    line: 7,
    vars: { sorted: [...display] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(display.map((_, idx) => idx));
      ui.setDisplayArray?.(finalSnap);
    },
  });

  return steps;
};

export const buildHeapSteps = (items, ui) => {
  const n = items.length;
  const heap = [...items];
  const snapshot = () => [...heap];
  const steps = [
    {
      description: `Starting heap sort on ${n} elements`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => {
        clearUi(ui);
        ui.setDisplayArray?.([...items]);
      },
    },
  ];

  const siftDown = (start, end) => {
    let root = start;
    for (;;) {
      const left = 2 * root + 1;
      const right = 2 * root + 2;
      let largest = root;
      if (left <= end && heap[left] > heap[largest]) largest = left;
      if (right <= end && heap[right] > heap[largest]) largest = right;
      if (largest === root) return;
      const parentVal = heap[root];
      const childVal = heap[largest];
      const fromIdx = root;
      const toIdx = largest;
      const tmp = heap[root];
      heap[root] = heap[largest];
      heap[largest] = tmp;
      const swapSnap = snapshot();
      steps.push({
        description: `Sifting: swapping parent ${parentVal} with child ${childVal}`,
        kind: 'move',
        line: 4,
        vars: { parent: parentVal, child: childVal, root: fromIdx, largest: toIdx },
        action: () => {
          ui.setSwapPair?.([fromIdx, toIdx]);
          ui.setDisplayArray?.(swapSnap);
        },
      });
      root = largest;
    }
  };

  const buildSnap = snapshot();
  steps.push({
    description: 'Building max-heap',
    kind: 'compare',
    line: 3,
    vars: { n },
    action: () => {
      ui.setDisplayArray?.(buildSnap);
    },
  });
  for (let start = Math.floor(n / 2) - 1; start >= 0; start -= 1) {
    siftDown(start, n - 1);
  }

  for (let end = n - 1; end > 0; end -= 1) {
    const rootVal = heap[0];
    const lastVal = heap[end];
    const tmp = heap[0];
    heap[0] = heap[end];
    heap[end] = tmp;
    const extractSnap = snapshot();
    steps.push({
      description: `Extracting max: swapping root ${rootVal} with last ${lastVal}`,
      kind: 'move',
      line: 6,
      vars: { root: rootVal, last: lastVal },
      action: () => {
        ui.setSwapPair?.([0, end]);
        ui.setDisplayArray?.(extractSnap);
      },
    });
    const heapifySnap = snapshot();
    steps.push({
      description: `Heapifying the remaining heap [0..${end - 1}]`,
      kind: 'compare',
      line: 7,
      vars: { end },
      action: () => {
        ui.setDisplayArray?.(heapifySnap);
      },
    });
    siftDown(0, end - 1);
  }

  const finalSnap = [...heap];
  steps.push({
    description: `Heap sort complete: ${heap.join(', ')}`,
    kind: 'found',
    line: 9,
    vars: { sorted: [...heap] },
    action: () => {
      clearUi(ui);
      ui.setSortedIndexes?.(heap.map((_, idx) => idx));
      ui.setDisplayArray?.(finalSnap);
    },
  });

  return steps;
};
