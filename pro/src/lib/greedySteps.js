// Pure step builders for the greedy page. Absolute-state actions only.

// ---- Activity selection (earliest finish) ----
export const buildActivitySteps = (intervals, ui) => {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const picked = [];
  const steps = [
    {
      description: `Starting activity selection with ${intervals.length} activities`,
      kind: 'move',
      line: 1,
      vars: { n: intervals.length },
      action: () => {
        ui.setActiveInterval?.(null);
        ui.setPicked?.([]);
      },
    },
    {
      description: `Sorting intervals by end time: ${sorted.map(([s, e]) => `[${s},${e}]`).join(' ')}`,
      kind: 'compare',
      line: 2,
      vars: { sorted },
      action: () => {
        ui.setPicked?.([]);
      },
    },
  ];

  let lastEnd = -Infinity;
  sorted.forEach(([start, end], i) => {
    steps.push({
      description: `Considering interval [${start},${end}]`,
      kind: 'compare',
      line: 3,
      vars: { start, end, lastEnd: lastEnd === -Infinity ? '-' : lastEnd },
      action: () => {
        ui.setActiveInterval?.(i);
      },
    });
    if (start >= lastEnd) {
      picked.push(i);
      steps.push({
        description:
          lastEnd === -Infinity
            ? `[${start},${end}] is the first pick `
            : `[${start},${end}] starts at ${start} ≥ ${lastEnd} → select`,
        kind: 'move',
        line: 4,
        vars: { start, end },
        action: () => {
          ui.setActiveInterval?.(i);
          ui.setPicked?.([...picked]);
        },
      });
      lastEnd = end;
    } else {
      steps.push({
        description: `[${start},${end}] overlaps the last selection (ends ${start} < ${lastEnd}) → skip`,
        kind: 'compare',
        line: 5,
        vars: { start, end, lastEnd },
        action: () => {
          ui.setActiveInterval?.(i);
        },
      });
    }
  });

  steps.push({
    description: `Selected ${picked.length} non-overlapping activities: ${picked.map((i) => `[${sorted[i][0]},${sorted[i][1]}]`).join(' ')}`,
    kind: 'found',
    line: 6,
    vars: { count: picked.length, picked },
    action: () => {
      ui.setPicked?.(picked);
    },
  });

  return steps;
};

// ---- Fractional knapsack (value/weight ratios) ----
export const buildFractionalKnapsackSteps = (items, capacity, ui) => {
  const indexed = items.map(([w, v], i) => ({ w, v, i, ratio: v / w }));
  const sorted = [...indexed].sort((a, b) => b.ratio - a.ratio);
  const steps = [
    {
      description: `Fractional knapsack — capacity ${capacity}`,
      kind: 'move',
      line: 1,
      vars: { capacity },
      action: () => {
        ui.setActiveKey?.(null);
        ui.setTaken?.(items.map(() => 0));
        ui.setTotalValue?.(0);
      },
    },
    {
      description: `Sorting by value/weight: ${sorted.map((x) => `item ${x.i} (${x.ratio.toFixed(1)})`).join(' ')}`,
      kind: 'compare',
      line: 2,
      vars: { order: sorted.map((x) => x.i) },
      action: () => {},
    },
  ];

  let remaining = capacity;
  let total = 0;
  const taken = items.map(() => 0);
  for (const { w, v, i } of sorted) {
    if (remaining <= 0) break;
    const amount = Math.min(w, remaining);
    const frac = amount / w;
    taken[i] = amount;
    total += amount * (v / w);
    remaining -= amount;
    const stepTotal = total;
    steps.push({
      description:
        amount === w
          ? `Take whole item ${i} (weight ${w}, value ${v}) — remaining ${remaining}`
          : `Take ${frac === 1 ? w : (frac * w).toFixed(frac * w % 1 ? 2 : 0)} of item ${i} (${amount}/${w}) — capacity full`,
      kind: amount === w ? 'move' : 'found',
      line: 3,
      vars: { item: i, amount, remaining },
      action: () => {
        ui.setActiveKey?.(i);
        ui.setTaken?.([...taken]);
        ui.setTotalValue?.(stepTotal);
      },
    });
  }

  steps.push({
    description: `Total value: ${Number(total.toFixed(2))} (capacity ${capacity}/${capacity})`,
    kind: 'found',
    line: 4,
    vars: { total: Number(total.toFixed(2)) },
    action: () => {
      ui.setTotalValue?.(Number(total.toFixed(2)));
    },
  });

  return steps;
};

// ---- Greedy coin change (largest denomination first) ----
export const buildGreedyCoinSteps = (target, coins, ui) => {
  const sorted = [...coins].sort((a, b) => b - a);
  const note = { 25: 'quarter', 10: 'dime', 5: 'nickel', 1: 'penny' }[sorted[0]] ? '' : '';
  const steps = [
    {
      description: `Greedy coin change for ${target} using denominations [${sorted.join(', ')}]`,
      kind: 'move',
      line: 1,
      vars: { target, coins: sorted },
      action: () => {
        ui.setActiveKey?.(null);
        ui.setHighlightedKeys?.([]);
        ui.setCoinCounts?.(sorted.map(() => 0));
      },
    },
  ];

  let remaining = target;
  const counts = sorted.map(() => 0);
  sorted.forEach((c, i) => {
    const q = Math.floor(remaining / c);
    if (q > 0) {
      counts[i] = q;
      remaining -= q * c;
      steps.push({
        description: `Use ${q} coin(s) of ${c} — takes ${q * c}${note}`,
        kind: 'move',
        line: 3,
        vars: { coin: c, count: q },
        action: () => {
          ui.setHighlightedKeys?.([c]);
          ui.setCoinCounts?.([...counts]);
        },
      });
      steps.push({
        description: `Remaining: ${remaining}`,
        kind: 'found',
        line: 4,
        vars: { remaining },
        action: () => {
          ui.setActiveKey?.(remaining);
        },
      });
    } else {
      steps.push({
        description: `Cannot use ${c} — remaining ${remaining} < ${c}`,
        kind: 'compare',
        line: 5,
        vars: { coin: c, remaining },
        action: () => {
          ui.setHighlightedKeys?.([c]);
        },
      });
    }
  });

  const totalCoins = counts.reduce((s, n) => s + n, 0);
  const denoms = sorted
    .map((c, i) => (counts[i] > 0 ? new Array(counts[i]).fill(c).join(' + ') : null))
    .filter(Boolean)
    .join(' + ');
  steps.push({
    description:
      remaining === 0
        ? `Greedy coins: ${totalCoins} piece(s) — ${denoms}`
        : `Greedy leaves ${remaining} — not exact with these denominations`,
    kind: 'found',
    line: 6,
    vars: { count: totalCoins, remaining },
    action: () => {
      ui.setActiveKey?.(null);
      ui.setHighlightedKeys?.([]);
    },
  });

  return steps;
};
