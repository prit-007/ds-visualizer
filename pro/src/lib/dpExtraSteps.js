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
