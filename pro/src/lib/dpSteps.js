// Pure step builders for the dynamic-programming page. Each returns
// [{ description, action, kind?, line, vars? }] with absolute state.

const clearUi = (ui) => {
  ui.setActiveKey?.(null);
  ui.setHighlightedKeys?.([]);
  ui.setActiveCell?.(null);
  ui.setHighlightedCells?.([]);
};

// ---- Bottom-up Fibonacci ----
export const buildFibSteps = (n, ui) => {
  const table = { 0: 0, 1: 1 };
  const tableSnap = () => ({ ...table });
  const steps = [
    {
      description: `Starting bottom-up Fibonacci for n=${n}`,
      kind: 'move',
      line: 1,
      vars: { n },
      action: () => {
        clearUi(ui);
        ui.setTable?.(tableSnap());
      },
    },
    {
      description: `Base cases: fib(0)=0, fib(1)=1`,
      kind: 'compare',
      line: 2,
      vars: { table: tableSnap() },
      action: () => {
        ui.setTable?.(tableSnap());
      },
    },
  ];

  for (let i = 2; i <= n; i += 1) {
    const a = table[i - 2];
    const b = table[i - 1];
    steps.push({
      description: `Computing fib(${i}) = fib(${i - 2}) + fib(${i - 1})`,
      kind: 'compare',
      line: 3,
      vars: { i, a: i - 2, b: i - 1 },
      action: () => {
        ui.setActiveKey?.(i);
        ui.setHighlightedKeys?.([i - 2, i - 1]);
      },
    });
    table[i] = a + b;
    const snap = tableSnap();
    steps.push({
      description: `fib(${i}) = ${a} + ${b} = ${a + b}`,
      kind: 'found',
      line: 4,
      vars: { i, value: a + b },
      action: () => {
        ui.setTable?.(snap);
        ui.setHighlightedKeys?.([i - 2, i - 1]);
      },
    });
  }

  steps.push({
    description: `Fibonacci: fib(${n}) = ${table[n]}`,
    kind: 'found',
    line: 6,
    vars: { n, value: table[n] },
    action: () => {
      clearUi(ui);
      ui.setTable?.(tableSnap());
    },
  });

  return steps;
};

// ---- Number of grid paths (right/down) ----
export const buildGridPathsSteps = (rows, cols, ui) => {
  const table = {};
  const snap = () => Object.fromEntries(Object.entries(table).map(([k, v]) => [k, v]));
  const steps = [
    {
      description: `Counting paths in a ${rows}×${cols} grid (right/down moves)`,
      kind: 'move',
      line: 1,
      vars: { rows, cols },
      action: () => clearUi(ui),
    },
    {
      description: 'Filling ways[r][c] row by row',
      kind: 'compare',
      line: 2,
      action: () => {},
    },
  ];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (r === 0 || c === 0) {
        table[`${r},${c}`] = 1;
        steps.push({
          description:
            r === 0 && c === 0
              ? `ways(0,0) = 1 (start)`
              : r === 0
                ? `ways(0,${c}) = 1 (only right moves)`
                : `ways(${r},0) = 1 (only down moves)`,
          kind: 'found',
          line: 3,
          vars: { r, c, value: 1 },
          action: () => {
            ui.setActiveCell?.([r, c]);
            ui.setTable?.(snap());
          },
        });
      } else {
        const a = table[`${r - 1},${c}`];
        const b = table[`${r},${c - 1}`];
        table[`${r},${c}`] = a + b;
        steps.push({
          description: `ways(${r},${c}) = ways(${r - 1},${c}) + ways(${r},${c - 1})`,
          kind: 'compare',
          line: 4,
          vars: { r, c, up: a, left: b },
          action: () => {
            ui.setActiveCell?.([r, c]);
            ui.setHighlightedCells?.([[r - 1, c], [r, c - 1]]);
          },
        });
        steps.push({
          description: `ways(${r},${c}) = ${a} + ${b} = ${a + b}`,
          kind: 'found',
          line: 5,
          vars: { r, c, value: a + b },
          action: () => {
            ui.setTable?.(snap());
          },
        });
      }
    }
  }

  const value = table[`${rows - 1},${cols - 1}`];
  steps.push({
    description: `Ways to reach (${rows - 1},${cols - 1}): ${value}`,
    kind: 'found',
    line: 5,
    vars: { rows, cols, value },
    action: () => {
      clearUi(ui);
      ui.setTable?.(snap());
    },
  });

  return steps;
};

// ---- Fewest coins for an amount ----
export const buildCoinChangeSteps = (target, coins, ui) => {
  const sorted = [...coins].sort((a, b) => a - b);
  const dp = { 0: 0 };
  const snap = () => ({ ...dp });
  const steps = [
    {
      description: `Fewest coins to make ${target} from [${sorted.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { target, coins: sorted },
      action: () => clearUi(ui),
    },
    {
      description: `dp[0]=0, every other amount starts ∞`,
      kind: 'compare',
      line: 2,
      vars: { dp: snap() },
      action: () => {
        ui.setTable?.(snap());
        ui.setHighlightedKeys?.(sorted);
      },
    },
  ];

  for (let amount = 1; amount <= target; amount += 1) {
    let best = Infinity;
    steps.push({
      description: `Considering amount ${amount}`,
      kind: 'compare',
      line: 3,
      vars: { amount },
      action: () => {
        ui.setActiveKey?.(amount);
      },
    });
    for (const c of sorted) {
      if (c > amount) break;
      const candidate = dp[amount - c] + 1;
      steps.push({
        description: `Coin ${c}: dp[${amount - c}]+1 = ${candidate}${candidate < best ? ' (better)' : ''}`,
        kind: 'compare',
        line: 4,
        vars: { coin: c, candidate },
        action: () => {
          ui.setHighlightedKeys?.([c]);
        },
      });
      if (candidate < best) best = candidate;
    }
    dp[amount] = best;
    steps.push({
      description:
        best === Infinity ? `dp[${amount}] stays ∞ (unreachable)` : `dp[${amount}] = ${best}`,
      kind: 'found',
      line: 5,
      vars: { amount, value: best },
      action: () => {
        ui.setTable?.(snap());
        ui.setHighlightedKeys?.(sorted);
      },
    });
  }

  const value = dp[target];
  steps.push({
    description:
      value === Infinity
        ? `Impossible — no coin combination makes ${target}`
        : `Fewest coins for ${target}: ${value}`,
    kind: 'found',
    line: 5,
    vars: { target, value },
    action: () => {
      clearUi(ui);
      ui.setTable?.(snap());
    },
  });

  return steps;
};


// ---- Longest Common Subsequence (2D table) ----
export const buildLCSSteps = (a, b, ui) => {
  const table = {};
  const snap = () => ({ ...table });
  const steps = [
    {
      description: `LCS of "${a}" and "${b}"`,
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
      description: 'Filling dp[i][j] row by row — match extends, else best of up/left',
      kind: 'compare',
      line: 2,
      action: () => {},
    },
  ];

  for (let i = 0; i <= a.length; i += 1) {
    for (let j = 0; j <= b.length; j += 1) {
      if (i === 0 || j === 0) {
        table[`${i},${j}`] = 0;
        continue;
      }
      const ca = a[i - 1];
      const cb = b[j - 1];
      if (ca === cb) {
        table[`${i},${j}`] = table[`${i - 1},${j - 1}`] + 1;
        steps.push({
          description: `${ca} = ${cb} at dp[${i}][${j}] → diagonal + 1`,
          kind: 'found',
          line: 3,
          vars: { i, j, ca, cb, value: table[`${i},${j}`] },
          action: () => {
            ui.setActiveCell?.([i, j]);
            ui.setHighlightedCells?.([[i - 1, j - 1]]);
          },
        });
      } else {
        const up = table[`${i - 1},${j}`];
        const left = table[`${i},${j - 1}`];
        table[`${i},${j}`] = Math.max(up, left);
        steps.push({
          description: `${ca} ≠ ${cb} → dp[${i}][${j}] = max(up, left) = ${Math.max(up, left)}`,
          kind: 'compare',
          line: 4,
          vars: { i, j, ca, cb, up, left, value: table[`${i},${j}`] },
          action: () => {
            ui.setActiveCell?.([i, j]);
            ui.setHighlightedCells?.([
              [i - 1, j],
              [i, j - 1],
            ]);
          },
        });
      }
    }
  }

  const value = table[`${a.length},${b.length}`];
  steps.push({
    description: `LCS length: ${value}`,
    kind: 'found',
    line: 6,
    vars: { a, b, value },
    action: () => {
      ui.setActiveCell?.(null);
      ui.setHighlightedCells?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};

// ---- 0/1 Knapsack (2D table over items × capacity) ----
export const buildZeroOneKnapsackSteps = (items, capacity, ui) => {
  // items = [weight, value]
  const table = {};
  const snap = () => ({ ...table });
  const steps = [
    {
      description: `0/1 knapsack — ${items.length} items, capacity ${capacity}`,
      kind: 'move',
      line: 1,
      vars: { n: items.length, capacity },
      action: () => {
        ui.setActiveCell?.(null);
        ui.setHighlightedCells?.([]);
        ui.setTable?.(snap());
      },
    },
    {
      description: 'dp[i][w] = best value using first i items within weight w',
      kind: 'compare',
      line: 2,
      action: () => {},
    },
  ];

  for (let i = 0; i <= items.length; i += 1) {
    for (let w = 0; w <= capacity; w += 1) {
      if (i === 0 || w === 0) {
        table[`${i},${w}`] = 0;
        continue;
      }
      const [wi, vi] = items[i - 1];
      const skip = table[`${i - 1},${w}`];
      if (wi > w) {
        table[`${i},${w}`] = skip;
        steps.push({
          description: `item ${i} (${wi}kg) too heavy for ${w}kg → keep ${skip}`,
          kind: 'compare',
          line: 3,
          vars: { item: i, weight: wi, w, value: skip },
          action: () => {
            ui.setActiveCell?.([i, w]);
            ui.setHighlightedCells?.([[i - 1, w]]);
            ui.setTable?.(snap());
          },
        });
      } else {
        const take = table[`${i - 1},${w - wi}`] + vi;
        table[`${i},${w}`] = Math.max(skip, take);
        steps.push({
          description: `item ${i} fits: max(skip ${skip}, take ${take}) = ${Math.max(skip, take)}`,
          kind: 'found',
          line: 4,
          vars: { item: i, weight: wi, w, skip, take, value: table[`${i},${w}`] },
          action: () => {
            ui.setActiveCell?.([i, w]);
            ui.setHighlightedCells?.([
              [i - 1, w],
              [i - 1, w - wi],
            ]);
            ui.setTable?.(snap());
          },
        });
      }
    }
  }

  const value = table[`${items.length},${capacity}`];
  steps.push({
    description: `Maximum value: ${value}`,
    kind: 'found',
    line: 6,
    vars: { value },
    action: () => {
      ui.setActiveCell?.(null);
      ui.setHighlightedCells?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};

// ---- House robber (max non-adjacent sum, 1D) ----
export const buildHouseRobberSteps = (values, ui) => {
  const dp = { 0: values[0] };
  const snap = () => ({ ...dp });
  const steps = [
    {
      description: `House robber on [${values.join(', ')}]`,
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
      description: values.length > 1 && values[1] > values[0]
        ? `dp[1] = max(houses 0..1) = ${values[1]}`
        : `dp[0] = house 0 = ${values[0]}`,
      kind: 'compare',
      line: 2,
      vars: { i: 0, value: values[0] },
      action: () => {
        ui.setTable?.(snap());
      },
    },
  ];

  if (values.length > 1) {
    dp[1] = Math.max(values[0], values[1]);
    steps.push({
      description: `dp[1] = max(houses 0..1) = ${dp[1]}`,
      kind: 'found',
      line: 3,
      vars: { i: 1, value: dp[1] },
      action: () => {
        ui.setActiveKey?.(1);
        ui.setTable?.(snap());
      },
    });
  }

  for (let i = 2; i < values.length; i += 1) {
    const skip = dp[i - 1];
    const take = dp[i - 2] + values[i];
    dp[i] = Math.max(skip, take);
    steps.push({
      description: `dp[${i}] = max(skip ${skip}, rob ${values[i]} + dp[${i - 2}] = ${take}) = ${dp[i]}`,
      kind: 'found',
      line: 4,
      vars: { i, skip, take, value: dp[i] },
      action: () => {
        ui.setActiveKey?.(i);
        ui.setHighlightedKeys?.([i - 2, i - 1]);
        ui.setTable?.(snap());
      },
    });
  }

  const value = dp[values.length - 1];
  steps.push({
    description: `Maximum loot without adjacent houses: ${value}`,
    kind: 'found',
    line: 6,
    vars: { value },
    action: () => {
      ui.setActiveKey?.(null);
      ui.setHighlightedKeys?.([]);
      ui.setTable?.(snap());
    },
  });

  return steps;
};
