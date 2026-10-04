// Pure step builders for the searching visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks with absolute highlight state so the player can
// replay steps 0..k when scrubbing. `line` is the 1-based line into
// SEARCHING_PSEUDOCODE; `vars` feeds the variable watch.

const clearUi = (ui) => {
  ui.setComparePair?.(null);
  ui.setActiveIndex?.(null);
};

export const buildLinearSteps = (items, target, ui) => {
  const n = items.length;
  const steps = [
    {
      description: `Starting linear search for ${target}`,
      kind: 'move',
      line: 1,
      vars: { target, n },
      action: () => clearUi(ui),
    },
  ];

  for (let i = 0; i < n; i += 1) {
    const value = items[i];
    steps.push({
      description: `Comparing ${target} with index ${i} (value ${value})`,
      kind: 'compare',
      line: 3,
      vars: { target, index: i, value },
      action: () => {
        ui.setComparePair?.([i, i]);
        ui.setActiveIndex?.(i);
      },
    });
    if (value === target) {
      steps.push({
        description: `Found ${target} at index ${i}`,
        kind: 'found',
        line: 4,
        vars: { target, index: i },
        action: () => {
          ui.setActiveIndex?.(i);
        },
      });
      return steps;
    }
  }

  steps.push({
    description: `${target} is not in the array`,
    kind: 'error',
    line: 5,
    vars: { target },
    action: () => clearUi(ui),
  });
  return steps;
};

export const buildBinarySteps = (items, target, ui) => {
  const n = items.length;
  const steps = [
    {
      description: `Starting binary search for ${target} on sorted array [${items.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { target, n },
      action: () => clearUi(ui),
    },
  ];

  let lo = 0;
  let hi = n - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = items[mid];
    const stepLo = lo;
    const stepHi = hi;
    const stepMid = mid;
    steps.push({
      description: `Comparing ${target} with mid ${value} (index ${mid})`,
      kind: 'compare',
      line: 3,
      vars: { target, mid, value, lo, hi },
      action: () => {
        ui.setComparePair?.([stepLo, stepHi]);
        ui.setActiveIndex?.(stepMid);
      },
    });
    if (value === target) {
      steps.push({
        description: `Found ${target} at index ${mid}`,
        kind: 'found',
        line: 4,
        vars: { target, index: mid },
        action: () => {
          ui.setActiveIndex?.(mid);
        },
      });
      return steps;
    }
    if (target < value) {
      const leftLo = stepLo;
      const leftHi = stepMid - 1;
      steps.push({
        description: `${target} < ${value} → search left [${leftLo}..${leftHi}]`,
        kind: 'compare',
        line: 5,
        vars: { target, value, lo: leftLo, hi: leftHi },
        action: () => {
          ui.setComparePair?.([leftLo, leftHi]);
        },
      });
      hi = stepMid - 1;
    } else {
      const rightLo = stepMid + 1;
      const rightHi = stepHi;
      steps.push({
        description: `${target} > ${value} → search right [${rightLo}..${rightHi}]`,
        kind: 'compare',
        line: 5,
        vars: { target, value, lo: rightLo, hi: rightHi },
        action: () => {
          ui.setComparePair?.([rightLo, rightHi]);
        },
      });
      lo = stepMid + 1;
    }
  }

  steps.push({
    description: `${target} is not in the sorted array`,
    kind: 'error',
    line: 6,
    vars: { target },
    action: () => clearUi(ui),
  });
  return steps;
};
