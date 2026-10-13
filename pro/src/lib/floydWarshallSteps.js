// Pure step builder for Floyd–Warshall all-pairs shortest paths.
// Works on the same weighted (undirected) graphs as Dijkstra/Bellman-Ford,
// including negative weights; i→i diagonals are computed too so a negative
// cycle always shows up as dist[i][i] < 0 on the final pass.

const fmt = (x) => (x === Infinity ? '∞' : x);

export const buildFloydWarshallSteps = (nodes, edges, ui) => {
  const order = [...nodes].sort((a, b) => a - b);
  const idx = {};
  order.forEach((n, i) => {
    idx[n] = i;
  });

  const INF = Infinity;
  const mat = order.map(() => new Array(order.length).fill(INF));
  order.forEach((n, i) => {
    mat[i][i] = 0;
  });
  for (const [u, v, w] of edges) {
    mat[idx[u]][idx[v]] = w;
    mat[idx[v]][idx[u]] = w;
  }

  const steps = [];
  const snap = () => mat.map((row) => [...row]);

  steps.push({
    description: `Starting Floyd–Warshall on ${order.length} nodes`,
    kind: 'move',
    line: 1,
    vars: { nodes: order.length },
    action: () => {
      ui.setMatrix?.(snap());
      ui.setActiveCell?.(null);
    },
  });

  steps.push({
    description: 'Distance matrix built — ∞ for missing edges, 0 on the diagonal',
    kind: 'compare',
    line: 2,
    vars: { matrix: snap() },
    action: () => {
      ui.setMatrix?.(snap());
    },
  });

  const name = (i) => order[i];

  for (let k = 0; k < order.length; k += 1) {
    const K = name(k);
    steps.push({
      description: `Considering node ${K} as an intermediate (k = ${K})`,
      kind: 'compare',
      line: 3,
      vars: { k: K },
      action: () => {
        ui.setActiveCell?.([k, k]);
      },
    });

    for (let i = 0; i < order.length; i += 1) {
      const A = name(i);
      for (let j = 0; j < order.length; j += 1) {
        const B = name(j);
        const ik = mat[i][k];
        const kj = mat[k][j];
        const current = mat[i][j];
        const candidate = ik === INF || kj === INF ? INF : ik + kj;

        if (candidate === INF) {
          steps.push({
            description: `Via ${K}: dist[${A}][${B}] = ${fmt(ik)} + ${fmt(kj)} stays ${fmt(current)} — no route through ${K}`,
            kind: 'compare',
            line: 5,
            vars: { a: A, b: B, k: K },
            action: () => {
              ui.setActiveCell?.([i, j]);
            },
          });
        } else if (candidate < current) {
          const after = candidate;
          mat[i][j] = after;
          const s = snap();
          steps.push({
            description: `Via ${K}: dist[${A}][${B}] = ${fmt(ik)} + ${fmt(kj)} = ${fmt(candidate)} vs ${fmt(current)} → update`,
            kind: 'move',
            line: 7,
            vars: { a: A, b: B, k: K, from: current, to: candidate },
            action: () => {
              ui.setActiveCell?.([i, j]);
              ui.setMatrix?.(s);
            },
          });
        } else {
          steps.push({
            description: `Via ${K}: dist[${A}][${B}] = ${fmt(ik)} + ${fmt(kj)} = ${fmt(candidate)} vs ${fmt(current)} (no change)`,
            kind: 'compare',
            line: 5,
            vars: { a: A, b: B, k: K },
            action: () => {
              ui.setActiveCell?.([i, j]);
              ui.setMatrix?.(snap());
            },
          });
        }
      }
    }
  }

  let cycleNode = null;
  for (let i = 0; i < order.length; i += 1) {
    if (mat[i][i] < 0) {
      cycleNode = name(i);
      break;
    }
  }

  if (cycleNode !== null) {
    steps.push({
      description: `Negative cycle detected — dist[${cycleNode}][${cycleNode}] = ${mat[idx[cycleNode]][idx[cycleNode]]} keeps shrinking`,
      kind: 'error',
      line: 8,
      vars: { node: cycleNode },
      action: () => {
        ui.setActiveCell?.(null);
        ui.setMatrix?.(snap());
      },
    });
    return steps;
  }

  steps.push({
    description: 'Floyd–Warshall complete — all-pairs distances ready',
    kind: 'found',
    line: 8,
    vars: { matrix: snap() },
    action: () => {
      ui.setActiveCell?.(null);
      ui.setMatrix?.(snap());
    },
  });

  return steps;
};
