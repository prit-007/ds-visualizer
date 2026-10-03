// Empirical complexity lab: deterministic benchmarks count primitive
// operations at each input size, classifyGrowth picks the theoretical curve
// that best fits the measured series, buildPlot renders both series into an
// SVG box. Everything here is pure — the Web Worker is a thin wrapper.

import { AVLTree } from './avl';

export const DEFAULT_SIZES = [64, 128, 256, 512, 1024];

const mean = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export const THEORETICAL = {
  'O(1)': (n) => 1,
  'O(log n)': (n) => Math.log2(Math.max(n, 2)),
  'O(n)': (n) => n,
  'O(n log n)': (n) => n * Math.log2(Math.max(n, 2)),
  'O(n^2)': (n) => n * n,
};

const buildNaiveBst = (n) => {
  const root = { value: 0, left: null, right: null };
  for (let i = 1; i < n; i++) {
    let node = root;
    for (;;) {
      if (i < node.value) {
        if (!node.left) {
          node.left = { value: i, left: null, right: null };
          break;
        }
        node = node.left;
      } else {
        if (!node.right) {
          node.right = { value: i, left: null, right: null };
          break;
        }
        node = node.right;
      }
    }
  }
  return root;
};

const naiveInsertComparisons = (root, value) => {
  let node = root;
  let comparisons = 0;
  for (;;) {
    comparisons += 1;
    if (value < node.value) {
      if (!node.left) return comparisons;
      node = node.left;
    } else {
      if (!node.right) return comparisons;
      node = node.right;
    }
  }
};

const buildSinglyList = (n) => {
  const head = { next: null };
  let tail = head;
  for (let i = 1; i < n; i++) {
    tail.next = { next: null };
    tail = tail.next;
  }
  return head;
};

export const BENCHMARKS = {
  'array-index-access': {
    label: 'Array random access',
    theory: 'O(1)',
    run: (n) => {
      const array = Array.from({ length: n }, (_, i) => i);
      // read the middle cell — one step regardless of n
      const value = array[Math.floor(n / 2)];
      return value === undefined ? 0 : 1;
    },
  },
  'array-binary-search': {
    label: 'Binary search (sorted array)',
    theory: 'O(log n)',
    run: (n) => {
      const array = Array.from({ length: n }, (_, i) => i);
      let lo = 0;
      let hi = n - 1;
      let comparisons = 0;
      const target = n - 1; // worst-case path: keep probing the upper half
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        comparisons += 1;
        if (array[mid] === target) return comparisons;
        if (array[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      return comparisons;
    },
  },
  'array-insert-front': {
    label: 'Array insert at front (unshift)',
    theory: 'O(n)',
    run: (n) => {
      const array = Array.from({ length: n }, (_, i) => i);
      let moves = 0;
      for (let i = n; i > 0; i--) {
        array[i] = array[i - 1];
        moves += 1;
      }
      array[0] = -1;
      return moves;
    },
  },
  'list-insert-front': {
    label: 'Linked-list insert at front',
    theory: 'O(1)',
    run: (n) => {
      const head = buildSinglyList(n);
      const node = { next: head };
      // one pointer write: new node becomes the head
      return node.next === head ? 1 : 0;
    },
  },
  'list-find-mid': {
    label: 'Linked-list find middle',
    theory: 'O(n)',
    run: (n) => {
      let node = buildSinglyList(n);
      const hops = Math.ceil(n / 2);
      let steps = 0;
      for (let i = 0; i < hops; i++) {
        node = node.next;
        steps += 1;
      }
      return steps;
    },
  },
  'bst-insert-sorted': {
    label: 'Naive BST insert (sorted input)',
    theory: 'O(n)',
    run: (n) => {
      const root = buildNaiveBst(n);
      return naiveInsertComparisons(root, n);
    },
  },
  'avl-insert-sorted': {
    label: 'AVL insert (sorted input)',
    theory: 'O(log n)',
    run: (n) => {
      const tree = new AVLTree();
      for (let i = 0; i < n; i++) {
        tree.root = tree.insert(tree.root, i);
      }
      const trace = [];
      tree.root = tree.insert(tree.root, n, trace);
      return trace.filter((event) => event.type === 'compare').length;
    },
  },
};

export const runBenchmark = (key, sizes = DEFAULT_SIZES) => {
  const benchmark = BENCHMARKS[key];
  if (!benchmark) throw new Error(`Unknown benchmark: ${key}`);
  return sizes.map((n) => {
    const start = performance.now();
    const ops = benchmark.run(n);
    const ms = performance.now() - start;
    return { n, ops, ms };
  });
};

const CURVES = [
  ['O(1)', THEORETICAL['O(1)']],
  ['O(log n)', THEORETICAL['O(log n)']],
  ['O(n)', THEORETICAL['O(n)']],
  ['O(n log n)', THEORETICAL['O(n log n)']],
  ['O(n^2)', THEORETICAL['O(n^2)']],
];

// Best-fit (mean-relative error) between the measured series and each
// theoretical curve; the smallest error wins.
export const classifyGrowth = (samples) => {
  if (!samples || samples.length < 2) return null;
  const opsMean = mean(samples.map((s) => s.ops));
  let best = null;
  for (const [label, fn] of CURVES) {
    const predicted = samples.map((s) => fn(s.n));
    const scale = opsMean / (mean(predicted) || 1);
    const error = mean(
      samples.map((s, i) => {
        const expected = scale * predicted[i];
        return Math.abs(s.ops - expected) / Math.max(s.ops, expected, 1);
      })
    );
    if (!best || error < best.error) best = { label, error };
  }
  return { label: best.label, error: best.error };
};

const PLOT_WIDTH = 320;
const PLOT_HEIGHT = 160;
const PLOT_PAD = 12;

// Maps both series into the same box (theory scaled by mean ratio) as
// space-separated "x,y" polyline point strings.
export const buildPlot = (samples, theoryFn) => {
  const n0 = samples[0].n;
  const nLast = samples[samples.length - 1].n;
  const maxOps = Math.max(...samples.map((s) => s.ops), 1);
  const theoryRaw = samples.map((s) => theoryFn(s.n));
  const scale = mean(samples.map((s) => s.ops)) / (mean(theoryRaw) || 1);

  const xFor = (n) =>
    samples.length === 1
      ? PLOT_WIDTH / 2
      : PLOT_PAD + ((n - n0) / ((nLast - n0) || 1)) * (PLOT_WIDTH - 2 * PLOT_PAD);
  const yFor = (ops) => {
    const y = PLOT_HEIGHT - PLOT_PAD - (ops / maxOps) * (PLOT_HEIGHT - 2 * PLOT_PAD);
    return Math.max(0, Math.min(PLOT_HEIGHT, y));
  };
  const points = (values) =>
    samples
      .map((s, i) => `${xFor(s.n).toFixed(1)},${yFor(values[i]).toFixed(1)}`)
      .join(' ');

  return {
    width: PLOT_WIDTH,
    height: PLOT_HEIGHT,
    measured: points(samples.map((s) => s.ops)),
    theory: points(theoryRaw.map((value) => value * scale)),
  };
};
