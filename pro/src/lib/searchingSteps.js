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

export const buildTernarySteps = (items, target, ui) => {
  const n = items.length;
  const steps = [
    {
      description: `Starting ternary search for ${target} on sorted array [${items.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { target, n },
      action: () => clearUi(ui),
    },
  ];

  let lo = 0;
  let hi = n - 1;
  while (lo <= hi) {
    const third = Math.floor((hi - lo) / 3);
    const stepLo = lo;
    const stepHi = hi;
    const m1 = lo + third;
    const m2 = hi - third;
    const m1Value = items[m1];
    const m2Value = items[m2];

    steps.push({
      description: `Comparing ${target} with m1 ${m1Value} (index ${m1})`,
      kind: 'compare',
      line: 6,
      vars: { target, m1, value: m1Value, lo: stepLo, hi: stepHi },
      action: () => {
        ui.setComparePair?.([stepLo, stepHi]);
        ui.setActiveIndex?.(m1);
      },
    });
    if (target === m1Value) {
      steps.push({
        description: `Found ${target} at index ${m1}`,
        kind: 'found',
        line: 4,
        vars: { target, index: m1 },
        action: () => {
          ui.setActiveIndex?.(m1);
        },
      });
      return steps;
    }
    if (target < m1Value) {
      const leftLo = stepLo;
      const leftHi = m1 - 1;
      steps.push({
        description: `${target} < ${m1Value} → search left third [${leftLo}..${leftHi}]`,
        kind: 'compare',
        line: 7,
        vars: { target, value: m1Value, lo: leftLo, hi: leftHi },
        action: () => {
          ui.setComparePair?.([leftLo, leftHi]);
        },
      });
      hi = m1 - 1;
    } else {
      steps.push({
        description: `${target} > ${m1Value} → compare m2`,
        kind: 'compare',
        line: 8,
        vars: { target, value: m1Value, m1, lo: stepLo, hi: stepHi },
        action: () => {
          ui.setComparePair?.([stepLo, stepHi]);
        },
      });
      steps.push({
        description: `Comparing ${target} with m2 ${m2Value} (index ${m2})`,
        kind: 'compare',
        line: 8,
        vars: { target, m2, value: m2Value, lo: stepLo, hi: stepHi },
        action: () => {
          ui.setComparePair?.([stepLo, stepHi]);
          ui.setActiveIndex?.(m2);
        },
      });
      if (target === m2Value) {
        steps.push({
          description: `Found ${target} at index ${m2}`,
          kind: 'found',
          line: 8,
          vars: { target, index: m2 },
          action: () => {
            ui.setActiveIndex?.(m2);
          },
        });
        return steps;
      }
      if (target > m2Value) {
        const rightLo = m2 + 1;
        const rightHi = stepHi;
        steps.push({
          description: `${target} > ${m2Value} → search right third [${rightLo}..${rightHi}]`,
          kind: 'compare',
          line: 9,
          vars: { target, value: m2Value, lo: rightLo, hi: rightHi },
          action: () => {
            ui.setComparePair?.([rightLo, rightHi]);
          },
        });
        lo = m2 + 1;
      } else {
        const midLo = m1 + 1;
        const midHi = m2 - 1;
        steps.push({
          description: `${target} < ${m2Value} → search middle third [${midLo}..${midHi}]`,
          kind: 'compare',
          line: 10,
          vars: { target, value: m2Value, lo: midLo, hi: midHi },
          action: () => {
            ui.setComparePair?.([midLo, midHi]);
          },
        });
        lo = m1 + 1;
        hi = m2 - 1;
      }
    }
  }

  steps.push({
    description: `${target} is not in the sorted array`,
    kind: 'error',
    line: 11,
    vars: { target },
    action: () => clearUi(ui),
  });
  return steps;
};

export const buildJumpSteps = (items, target, ui) => {
  const n = items.length;
  const size = Math.max(1, Math.floor(Math.sqrt(n)));
  const steps = [
    {
      description: `Starting jump search for ${target} on sorted array [${items.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { target, n, step: size },
      action: () => clearUi(ui),
    },
    {
      description: `Jump size ⌊√${n}⌋ = ${size}`,
      kind: 'compare',
      line: 2,
      vars: { step: size, n },
      action: () => clearUi(ui),
    },
  ];

  let prev = 0;
  let step = size;
  for (;;) {
    const blockEnd = Math.min(step, n) - 1;
    const value = items[blockEnd];
    const stepBlockEnd = blockEnd;
    const blockLo = prev;
    steps.push({
      description: `Comparing ${target} with block end ${value} (index ${blockEnd})`,
      kind: 'compare',
      line: 3,
      vars: { target, index: blockEnd, value },
      action: () => {
        ui.setComparePair?.([blockLo, stepBlockEnd]);
        ui.setActiveIndex?.(stepBlockEnd);
      },
    });
    if (value < target) {
      const nextStart = step;
      if (nextStart >= n) {
        steps.push({
          description: `${target} > ${value} → next block starts past the end`,
          kind: 'compare',
          line: 6,
          vars: { target, value },
          action: () => {
            ui.setComparePair?.(null);
          },
        });
        break;
      }
      const jumpFrom = step;
      prev = step;
      step += size;
      const jumpTo = Math.min(step, n) - 1;
      steps.push({
        description: `${target} > ${value} → jump to next block starting at ${jumpFrom}`,
        kind: 'compare',
        line: 6,
        vars: { target, value, from: jumpFrom, to: jumpFrom },
        action: () => {
          ui.setComparePair?.([jumpFrom, jumpTo]);
        },
      });
    } else {
      const end = blockEnd;
      const scanLo = prev;
      steps.push({
        description: `${target} ≤ ${value} → scan block [${scanLo}..${end}]`,
        kind: 'compare',
        line: 7,
        vars: { target, lo: scanLo, hi: end, value },
        action: () => {
          ui.setComparePair?.([scanLo, end]);
        },
      });
      for (let i = prev; i <= end; i += 1) {
        const valueAt = items[i];
        const scanIndex = i;
        steps.push({
          description: `Comparing ${target} with index ${scanIndex} (value ${valueAt})`,
          kind: 'compare',
          line: 8,
          vars: { target, index: scanIndex, value: valueAt },
          action: () => {
            ui.setComparePair?.([scanIndex, scanIndex]);
            ui.setActiveIndex?.(scanIndex);
          },
        });
        if (valueAt === target) {
          steps.push({
            description: `Found ${target} at index ${scanIndex}`,
            kind: 'found',
            line: 8,
            vars: { target, index: scanIndex },
            action: () => {
              ui.setActiveIndex?.(scanIndex);
            },
          });
          return steps;
        }
      }
      break;
    }
  }

  steps.push({
    description: `${target} is not in the sorted array`,
    kind: 'error',
    line: 9,
    vars: { target },
    action: () => clearUi(ui),
  });
  return steps;
};

export const buildInterpolationSteps = (items, target, ui) => {
  const n = items.length;
  const steps = [
    {
      description: `Starting interpolation search for ${target} on sorted array [${items.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { target, n },
      action: () => clearUi(ui),
    },
  ];

  let lo = 0;
  let hi = n - 1;
  while (lo <= hi) {
    if (target < items[lo] || target > items[hi]) {
      steps.push({
        description: `${target} is outside the value range [${items[lo]}..${items[hi]}] — not in the array`,
        kind: 'error',
        line: 10,
        vars: { target, lo: items[lo], hi: items[hi] },
        action: () => clearUi(ui),
      });
      return steps;
    }

    let pos;
    const probeLo = lo;
    const probeHi = hi;
    if (items[lo] === items[hi]) {
      pos = lo;
      steps.push({
        description: `Window [${probeLo}..${probeHi}] holds only ${items[lo]} — probing index ${pos}`,
        kind: 'compare',
        line: 4,
        vars: { target, lo: probeLo, hi: probeHi, pos },
        action: () => {
          ui.setComparePair?.([probeLo, probeHi]);
        },
      });
    } else {
      const raw =
        lo +
        Math.floor(
          ((target - items[lo]) * (hi - lo)) / (items[hi] - items[lo])
        );
      pos = Math.min(hi, Math.max(lo, raw));
      const base = `Probing pos = ${lo} + ⌊(${target} − ${items[lo]}) × ${
        hi - lo
      } ÷ (${items[hi]} − ${items[lo]})⌋ = ${raw}`;
      steps.push({
        description: raw === pos ? base : `${base} → clamped to ${pos}`,
        kind: 'compare',
        line: 5,
        vars: { target, lo: probeLo, hi: probeHi, pos },
        action: () => {
          ui.setComparePair?.([probeLo, probeHi]);
        },
      });
    }

    const value = items[pos];
    const comparePos = pos;
    steps.push({
      description: `Comparing ${target} with array[${comparePos}] = ${value}`,
      kind: 'compare',
      line: 7,
      vars: { target, pos: comparePos, value },
      action: () => {
        ui.setActiveIndex?.(comparePos);
      },
    });
    if (target === value) {
      steps.push({
        description: `Found ${target} at index ${comparePos}`,
        kind: 'found',
        line: 7,
        vars: { target, index: comparePos },
        action: () => {
          ui.setActiveIndex?.(comparePos);
        },
      });
      return steps;
    }
    if (target < value) {
      const leftLo = lo;
      const leftHi = pos - 1;
      steps.push({
        description: `${target} < ${value} → search [${leftLo}..${leftHi}]`,
        kind: 'compare',
        line: 8,
        vars: { target, value, lo: leftLo, hi: leftHi },
        action: () => {
          ui.setComparePair?.([leftLo, leftHi]);
        },
      });
      hi = pos - 1;
    } else {
      const rightLo = pos + 1;
      const rightHi = hi;
      steps.push({
        description: `${target} > ${value} → search [${rightLo}..${rightHi}]`,
        kind: 'compare',
        line: 9,
        vars: { target, value, lo: rightLo, hi: rightHi },
        action: () => {
          ui.setComparePair?.([rightLo, rightHi]);
        },
      });
      lo = pos + 1;
    }
  }

  steps.push({
    description: `${target} is not in the sorted array`,
    kind: 'error',
    line: 10,
    vars: { target },
    action: () => clearUi(ui),
  });
  return steps;
};
