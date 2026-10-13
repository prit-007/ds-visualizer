// Pure step builders for the two extra DP programs (Edit Distance + LIS).
// Matches the house pattern: [{ description, action, kind?, line, vars? }]
// with absolute state so OperationPlayer scrubbing works.

// ---- Levenshtein edit distance (2D table, keep vs min-edit) ----
export const buildEditDistanceSteps = (a, b, ui) => {
  const table = {};
  const snap = () => ({ ...table });
  const steps = [
    {
      description: `Edit distance between "${a}" and "${b}"`,
      kind: 'move',
      line: 1,
      vars: { a, b },
      action: () => {
        ui.setActiveCell?.(null);
        ui.setHighlightedCells?.([]);
        ui.setTable?.(snap());
      },
    },
    {
      description: 'dp[i][j] = fewest edits to turn a[0..i) into b[0..j)',
      kind: 'compare',
      line: 2,
      action: () => {},
    },
  ];

  for (let i = 0; i <= a.length; i += 1) {
    for (let j = 0; j <= b.length; j += 1) {
      if (i === 0) {
        table[`${i},${j}`] = j;
        continue;
      }
      if (j === 0) {
        table[`${i},${j}`] = i;
        continue;
      }
      const ca = a[i - 1];
      const cb = b[j - 1];
      if (ca === cb) {
        table[`${i},${j}`] = table[`${i - 1},${j - 1}`];
        steps.push({
          description: `${ca} = ${cb} at dp[${i}][${j}] → diagonal (no edit needed)`,
          kind: 'found',
          line: 5,
          vars: { i, j, ca, cb, value: table[`${i},${j}`] },
          action: () => {
            ui.setActiveCell?.([i, j]);
            ui.setHighlightedCells?.([[i - 1, j - 1]]);
          },
        });
      } else {
        const up = table[`${i - 1},${j}`];
        const left = table[`${i},${j - 1}`];
        const diag = table[`${i - 1},${j - 1}`];
        table[`${i},${j}`] = 1 + Math.min(up, left, diag);
        steps.push({
          description: `${ca} ≠ ${cb} at dp[${i}][${j}] → 1 + min(${up}, ${left}, ${diag}) = ${table[`${i},${j}`]}`,
          kind: 'compare',
          line: 6,
          vars: { i, j, ca, cb, up, left, diag, value: table[`${i},${j}`] },
          action: () => {
            ui.setActiveCell?.([i, j]);
            ui.setHighlightedCells?.([
              [i - 1, j],
              [i, j - 1],
              [i - 1, j - 1],
            ]);
          },
        });
      }
    }
  }

  const value = table[`${a.length},${b.length}`];
  steps.push({
    description: `Edit distance between "${a}" and "${b}" is ${value}`,
    kind: 'found',
    line: 7,
    vars: { a, b, value, matrix: snap() },
    action: () => {
      ui.setActiveCell?.(null);
      ui.setHighlightedCells?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};

// ---- Longest increasing subsequence (1D, best predecessor) ----
export const buildLISSteps = (values, ui) => {
  const dp = { 0: 1 };
  const snap = () => ({ ...dp });
  const steps = [
    {
      description: `LIS of [${values.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { values },
      action: () => {
        ui.setActiveKey?.(null);
        ui.setHighlightedKeys?.([]);
        ui.setTable?.(snap());
      },
    },
    {
      description: 'dp[i] = length of longest increasing subsequence ending at i',
      kind: 'compare',
      line: 2,
      action: () => {
        ui.setActiveKey?.(0);
        ui.setTable?.(snap());
      },
    },
  ];

  for (let i = 1; i < values.length; i += 1) {
    let best = 1;
    let bestJ = -1;
    for (let j = 0; j < i; j += 1) {
      if (values[j] < values[i] && dp[j] + 1 > best) {
        best = dp[j] + 1;
        bestJ = j;
      }
    }
    dp[i] = best;
    if (bestJ === -1) {
      steps.push({
        description: `dp[${i}] = ${values[i]} is a new low → 1`,
        kind: 'compare',
        line: 4,
        vars: { i, value: dp[i] },
        action: () => {
          ui.setActiveKey?.(i);
          ui.setHighlightedKeys?.([]);
          ui.setTable?.(snap());
        },
      });
    } else {
      steps.push({
        description: `dp[${i}] = ${values[i]} > ${values[bestJ]} (dp[${bestJ}] = ${dp[bestJ]}) → ${dp[i]}`,
        kind: 'found',
        line: 5,
        vars: { i, j: bestJ, value: dp[i] },
        action: () => {
          ui.setActiveKey?.(i);
          ui.setHighlightedKeys?.([bestJ]);
          ui.setTable?.(snap());
        },
      });
    }
  }

  const value = Math.max(...Object.values(dp));
  steps.push({
    description: `Longest increasing subsequence of [${values.join(', ')}] has length ${value}`,
    kind: 'found',
    line: 6,
    vars: { values, value },
    action: () => {
      ui.setActiveKey?.(null);
      ui.setHighlightedKeys?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};

// ---- Subset sum (2D reachability table over numbers × target) ----
export const buildSubsetSumSteps = (nums, target, ui) => {
  const table = {};
  const snap = () => ({ ...table });
  const steps = [
    {
      description: `Subset sum target ${target} from [${nums.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { nums, target },
      action: () => {
        ui.setActiveCell?.(null);
        ui.setHighlightedCells?.([]);
        ui.setTable?.(snap());
      },
    },
    {
      description: 'dp[i][t] = can some subset of the first i numbers total t',
      kind: 'compare',
      line: 2,
      action: () => {},
    },
  ];

  table['0,0'] = true;
  steps.push({
    description: 'dp[0][0] = true (empty subset)',
    kind: 'found',
    line: 2,
    vars: { i: 0, t: 0, value: true },
    action: () => {
      ui.setActiveCell?.([0, 0]);
      ui.setHighlightedCells?.([]);
      ui.setTable?.(snap());
    },
  });

  for (let i = 1; i <= nums.length; i += 1) {
    const num = nums[i - 1];
    for (let t = 0; t <= target; t += 1) {
      if (t === 0) {
        table[`${i},0`] = true;
        continue;
      }
      const exclude = table[`${i - 1},${t}`] === true;
      const include = t >= num && table[`${i - 1},${t - num}`] === true;
      table[`${i},${t}`] = exclude || include;
      if (exclude) {
        steps.push({
          description: `t = ${t} already reachable excluding nums[${i}] = ${num}`,
          kind: 'found',
          line: 5,
          vars: { i, t, num, value: true },
          action: () => {
            ui.setActiveCell?.([i, t]);
            ui.setHighlightedCells?.([[i - 1, t]]);
          },
        });
      } else if (include) {
        steps.push({
          description: `include nums[${i}] = ${num} → dp[${i - 1}][${t - num}] = true → t = ${t} reachable`,
          kind: 'found',
          line: 5,
          vars: { i, t, num, value: true },
          action: () => {
            ui.setActiveCell?.([i, t]);
            ui.setHighlightedCells?.([[i - 1, t], [i - 1, t - num]]);
          },
        });
      } else {
        steps.push({
          description: `dp[${i}][${t}] stays false — neither exclude nor include reaches ${t}`,
          kind: 'compare',
          line: 5,
          vars: { i, t, num, value: false },
          action: () => {
            ui.setActiveCell?.([i, t]);
            ui.setHighlightedCells?.([[i - 1, t]]);
          },
        });
      }
    }
  }

  const reachable = table[`${nums.length},${target}`] === true;
  steps.push({
    description: `Subset sum ${target} is ${reachable ? 'reachable' : 'not reachable'} from the given numbers`,
    kind: reachable ? 'found' : 'error',
    line: 6,
    vars: { target, reachable, matrix: snap() },
    action: () => {
      ui.setActiveCell?.(null);
      ui.setHighlightedCells?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};

// ---- Kadane (best subarray sum ending at each index) ----
export const buildKadaneSteps = (values, ui) => {
  const dp = { 0: values[0] };
  const snap = () => ({ ...dp });
  const steps = [
    {
      description: `Kadane's maximum subarray on [${values.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { values },
      action: () => {
        ui.setActiveKey?.(null);
        ui.setHighlightedKeys?.([]);
        ui.setTable?.(snap());
      },
    },
    {
      description: 'dp[i] = best sum of a subarray ending at i',
      kind: 'compare',
      line: 2,
      action: () => {
        ui.setActiveKey?.(0);
        ui.setTable?.(snap());
      },
    },
  ];

  for (let i = 1; i < values.length; i += 1) {
    const prev = dp[i - 1];
    if (prev >= 0) {
      dp[i] = prev + values[i];
      steps.push({
        description: `dp[${i}] = dp[${i - 1}] + a[${i}] = ${prev} + ${values[i] < 0 ? `(${values[i]})` : values[i]} = ${dp[i]} (extend)`,
        kind: 'found',
        line: 4,
        vars: { i, prev, value: dp[i] },
        action: () => {
          ui.setActiveKey?.(i);
          ui.setHighlightedKeys?.([i - 1]);
          ui.setTable?.(snap());
        },
      });
    } else {
      dp[i] = values[i];
      steps.push({
        description: `dp[${i}] = a[${i}] = ${values[i]} (restart: dp[${i - 1}] = ${prev} was negative)`,
        kind: 'compare',
        line: 4,
        vars: { i, prev, value: dp[i] },
        action: () => {
          ui.setActiveKey?.(i);
          ui.setHighlightedKeys?.([i - 1]);
          ui.setTable?.(snap());
        },
      });
    }
  }

  const value = Math.max(...Object.values(dp));
  steps.push({
    description: `Maximum subarray sum: ${value}`,
    kind: 'found',
    line: 5,
    vars: { values, value },
    action: () => {
      ui.setActiveKey?.(null);
      ui.setHighlightedKeys?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};

// ---- Word break (1D reachability over string prefixes) ----
export const buildWordBreakSteps = (s, dictWords, ui) => {
  const dict = new Set(dictWords);
  const table = { 0: true };
  const prev = {};
  const snap = () => ({ ...table });
  const steps = [
    {
      description: `Word break for "${s}" with [${dictWords.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { s, dict: dictWords },
      action: () => {
        ui.setActiveKey?.(null);
        ui.setHighlightedKeys?.([]);
        ui.setTable?.(snap());
      },
    },
    {
      description: 'dp[i] = can s[0..i) be split into dictionary words',
      kind: 'compare',
      line: 2,
      action: () => {},
    },
    {
      description: 'dp[0] = true (empty string)',
      kind: 'found',
      line: 2,
      vars: { i: 0, value: true },
      action: () => {
        ui.setActiveKey?.(0);
        ui.setTable?.(snap());
      },
    },
  ];

  for (let i = 1; i <= s.length; i += 1) {
    let reached = false;
    for (let j = 0; j < i; j += 1) {
      if (!table[j]) continue;
      const word = s.slice(j, i);
      if (dict.has(word)) {
        table[i] = true;
        prev[i] = j;
        steps.push({
          description: `split at ${j}: "${word}" in dictionary (dp[${j}] = true) → dp[${i}] = true`,
          kind: 'found',
          line: 5,
          vars: { i, j, word, value: true },
          action: () => {
            ui.setActiveKey?.(i);
            ui.setHighlightedKeys?.([j]);
            ui.setTable?.(snap());
          },
        });
        reached = true;
        break;
      }
      steps.push({
        description: `split at ${j}: "${word}" not in dictionary`,
        kind: 'compare',
        line: 5,
        vars: { i, j, word },
        action: () => {
          ui.setActiveKey?.(i);
          ui.setHighlightedKeys?.([j]);
        },
      });
    }
    if (!reached) {
      table[i] = false;
      steps.push({
        description: `no valid split reaches ${i} → dp[${i}] = false`,
        kind: 'compare',
        line: 5,
        vars: { i, value: false },
        action: () => {
          ui.setActiveKey?.(i);
          ui.setHighlightedKeys?.([]);
          ui.setTable?.(snap());
        },
      });
    }
  }

  const value = table[s.length] === true;
  let description;
  if (value) {
    const segments = [];
    let at = s.length;
    while (at > 0) {
      segments.unshift(s.slice(prev[at], at));
      at = prev[at];
    }
    description = `Word break: "${s}" → ${segments.join(' | ')}`;
  } else {
    description = `Word break: "${s}" cannot be segmented`;
  }
  steps.push({
    description,
    kind: value ? 'found' : 'error',
    line: 6,
    vars: { s, value },
    action: () => {
      ui.setActiveKey?.(null);
      ui.setHighlightedKeys?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};
