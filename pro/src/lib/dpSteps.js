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
            ui.setHighlightedCells?.([
              [r - 1, c],
              [r, c - 1],
            ]);
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
