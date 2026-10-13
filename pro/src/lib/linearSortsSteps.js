// Pure step builders for the linear-time (distribution) sorts.
// Counting sort: O(n + k); radix sort (LSD, base 10): O(d · n).
// Non-negative integers only — the page guards that. Actions use the same
// absolute-state ui contract as sortingSteps (setDisplayArray carries
// snapshots so slots really fill up as the run plays).

const withSlots = (out, width) =>
  out.map((v) => (v === null ? '-' : String(v)));

const snapshot = (arr) => [...arr];

export const buildCountingSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const k = Math.max(...arr);
  const tally = new Array(k + 1).fill(0);
  const out = new Array(n).fill(null);
  const steps = [];

  steps.push({
    description: `Starting counting sort on ${n} elements — max value ${k}`,
    kind: 'move',
    line: 1,
    vars: { n, k },
    action: () => {
      ui.setComparePair?.(null);
      ui.setSwapPair?.(null);
      ui.setActiveIndex?.(null);
      ui.setDisplayArray?.([...arr]);
    },
  });

  steps.push({
    description: `Tally array size k+1 = ${k + 1}, all zeroed`,
    kind: 'compare',
    line: 2,
    vars: { tallySize: k + 1 },
    action: () => {
      ui.setActiveIndex?.(null);
    },
  });

  for (let i = 0; i < n; i += 1) {
    const v = arr[i];
    tally[v] += 1;
    steps.push({
      description: `Counting ${v} — tally[${v}] becomes ${tally[v]}`,
      kind: 'move',
      line: 3,
      vars: { value: v, i, count: tally[v] },
      action: () => {
        ui.setActiveIndex?.(i);
      },
    });
  }

  steps.push({
    description: 'Running prefix sums converts the tally into end positions',
    kind: 'compare',
    line: 4,
    vars: {},
    action: () => {
      ui.setActiveIndex?.(null);
    },
  });

  let running = 0;
  for (let i = 0; i <= k; i += 1) {
    running += tally[i];
    tally[i] = running;
    steps.push({
      description: `Tally[${i}] now holds an end position of ${running}`,
      kind: 'compare',
      line: 5,
      vars: { value: i, end: running },
      action: () => {
        ui.setActiveIndex?.(null);
      },
    });
  }

  for (let i = n - 1; i >= 0; i -= 1) {
    const v = arr[i];
    const slot = tally[v] - 1;
    tally[v] -= 1;
    out[slot] = v;
    const snap = snapshot(out);
    steps.push({
      description: `Placing ${v} from index ${i} into slot ${slot}`,
      kind: 'move',
      line: 6,
      vars: { value: v, from: i, slot, out: snapSlice(snap) },
      action: () => {
        ui.setActiveIndex?.(i);
        ui.setDisplayArray?.(withSlots(snap, n));
      },
    });
  }

  steps.push({
    description: 'Output copied back — counting sort is stable and complete',
    kind: 'found',
    line: 7,
    vars: { sortedLength: n },
    action: () => {
      ui.setActiveIndex?.(null);
      ui.setDisplayArray?.([...out]);
    },
  });

  return steps;
};

const snapSlice = (snap) => snap.filter((v) => v !== null);

const digitAt = (value, place) => {
  for (let i = 1; i < place; i += 1) {
    value = Math.floor(value / 10);
  }
  return value % 10;
};

export const buildRadixSteps = (items, ui) => {
  const arr = [...items];
  const n = arr.length;
  const max = Math.max(...arr);
  const maxDigits = max === 0 ? 1 : String(max).length;

  const steps = [];

  steps.push({
    description: `Radix sort (LSD, base 10) on ${n} elements — ${maxDigits} digit passes`,
    kind: 'move',
    line: 1,
    vars: { n, maxDigits },
    action: () => {
      ui.setComparePair?.(null);
      ui.setSwapPair?.(null);
      ui.setActiveIndex?.(null);
      ui.setDisplayArray?.([...arr]);
    },
  });

  let working = [...arr];
  for (let place = 1; place <= maxDigits; place += 1) {
    const placeName =
      place === 1 ? '1s' : place === 2 ? '10s' : place === 3 ? '100s' : `10^${place - 1}s`;
    const buckets = {};
    const digitOf = {};
    working.forEach((v) => {
      const d = digitAt(v, place);
      digitOf[v] = d;
      if (!buckets[d]) buckets[d] = [];
      buckets[d].push(v);
    });

    const narration = working.map((v) => `${v} → bucket ${digitOf[v]}`).join(', ');
    steps.push({
      description: `Digit pass ${place} (${placeName} place): ${narration}`,
      kind: 'compare',
      line: 2,
      vars: { place, placeName, buckets: Object.keys(buckets) },
      action: () => {
        ui.setActiveIndex?.(null);
      },
    });

    const sortedKeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
    const regrouped = sortedKeys.flatMap((d) => buckets[d]);
    const snap = snapshot(regrouped);
    const temps = new Map();
    regrouped.forEach((v, idx) => {
      temps.set(v, idx);
    });
    working = regrouped;

    steps.push({
      description: `Concatenating buckets by digit — pass ${place} result: ${regrouped.join(', ')}`,
      kind: 'move',
      line: 4,
      vars: { place, result: regrouped },
      action: () => {
        ui.setDisplayArray?.(snap);
        ui.setActiveIndex?.(null);
      },
    });
  }

  steps.push({
    description: 'Radix sort complete — stable per-pass, sorted overall',
    kind: 'found',
    line: 6,
    vars: { sorted: working },
    action: () => {
      ui.setActiveIndex?.(null);
      ui.setDisplayArray?.([...working]);
    },
  });

  return steps;
};
