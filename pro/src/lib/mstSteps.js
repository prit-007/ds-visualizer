// Pure Prim + Kruskal (minimum spanning tree) step builders.
// Edges = [[u, v, w], ...]. Both build absolute-state actions.

const makeDs = (nodes) => {
  const parent = {};
  const rank = {};
  nodes.forEach((n) => {
    parent[n] = n;
    rank[n] = 0;
  });
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else {
      parent[rb] = ra;
      rank[ra] += 1;
    }
    return true;
  };
  return { find, union };
};

export const buildPrimSteps = (nodes, edges, start, ui) => {
  const inTree = new Set([start]);
  const treeEdges = [];
  const steps = [];
  let total = 0;

  steps.push({
    description: `Starting Prim from node ${start} — tree grows one edge at a time`,
    kind: 'move',
    line: 1,
    vars: { start },
    action: () => {
      ui.setTreeEdges?.([]);
      ui.setVisitedNodes?.([start]);
      ui.setActiveNode?.(start);
      ui.setActiveEdge?.(null);
    },
  });

  const snapshotTree = () => treeEdges.map((e) => [e[0], e[1]]);

  while (inTree.size < nodes.length) {
    let best = null;
    let bestW = Infinity;
    for (const [u, v, w] of edges) {
      const uIn = inTree.has(u);
      const vIn = inTree.has(v);
      if (uIn === vIn) {
        steps.push({
          description: `Edge ${u}—${v} (weight ${w}) connects tree nodes — skipped`,
          kind: 'compare',
          line: 4,
          vars: { from: u, to: v, weight: w },
          action: () => {
            ui.setActiveEdge?.([u, v]);
          },
        });
        continue;
      }
      const outside = uIn ? v : u;
      steps.push({
        description: `Edge ${u}—${v} (weight ${w}) reaches tree + outside — candidate`,
        kind: 'compare',
        line: 3,
        vars: { from: u, to: v, weight: w, outside },
        action: () => {
          ui.setActiveEdge?.([u, v]);
        },
      });
      if (w < bestW) {
        bestW = w;
        best = [u, v, w, outside];
      }
    }
    if (!best) break;
    const [u, v, w, outside] = best;
    if (!inTree.has(u) && !inTree.has(v)) continue;
    inTree.add(outside);
    treeEdges.push([u, v]);
    total += w;
    const snap = snapshotTree();
    steps.push({
      description: `Edge ${u}—${v} (weight ${w}) is the cheapest from the tree → picked`,
      kind: 'move',
      line: 5,
      vars: { from: u, to: v, weight: w, total },
      action: () => {
        ui.setActiveNode?.(outside);
        ui.setActiveEdge?.([u, v]);
        ui.setTreeEdges?.(snap);
      },
    });
  }

  if (inTree.size !== nodes.length) {
    steps.push({
      description: 'Graph disconnected — no single spanning tree covers every node',
      kind: 'error',
      line: 6,
      vars: { covered: inTree.size, total: nodes.length },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setActiveEdge?.(null);
      },
    });
    return steps;
  }

  steps.push({
    description: `MST complete — ${nodes.length - 1} edges, total weight ${total}`,
    kind: 'found',
    line: 6,
    vars: { total, edgeCount: nodes.length - 1 },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setTreeEdges?.(snapshotTree());
    },
  });

  return steps;
};

export const buildKruskalSteps = (nodes, edges, ui) => {
  const sorted = [...edges].sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
  const treeEdges = [];
  const steps = [];
  let total = 0;
  const ds = makeDs(nodes);

  steps.push({
    description: 'Kruskal grabs the cheapest safe edge each round (union-find to avoid cycles)',
    kind: 'move',
    line: 1,
    vars: {},
    action: () => {
      ui.setTreeEdges?.([]);
      ui.setActiveEdge?.(null);
      ui.setVisitedNodes?.([]);
    },
  });

  const orderText = sorted.map(([u, v, w]) => `${u}—${v}(${w})`).join(', ');
  steps.push({
    description: `Edges sorted by weight: ${orderText}`,
    kind: 'compare',
    line: 2,
    vars: { sorted: sorted.length },
    action: () => {
      ui.setActiveEdge?.(null);
    },
  });

  const snapshotTree = () => treeEdges.map((e) => [e[0], e[1]]);

  for (const [u, v, w] of sorted) {
    if (ds.union(u, v)) {
      treeEdges.push([u, v]);
      total += w;
      const snap = snapshotTree();
      steps.push({
        description: `Edge ${u}—${v} (weight ${w}) joins two components → picked`,
        kind: 'move',
        line: 6,
        vars: { from: u, to: v, weight: w, total },
        action: () => {
          ui.setActiveEdge?.([u, v]);
          ui.setTreeEdges?.(snap);
        },
      });
    } else {
      steps.push({
        description: `Edge ${u}—${v} (weight ${w}) would form a cycle → skip`,
        kind: 'error',
        line: 7,
        vars: { from: u, to: v, weight: w },
        action: () => {
          ui.setActiveEdge?.([u, v]);
        },
      });
    }
  }

  if (treeEdges.length !== nodes.length - 1) {
    steps.push({
      description: 'Graph disconnected — no single spanning tree covers every node',
      kind: 'error',
      line: 9,
      vars: { treeEdges: treeEdges.length, needed: nodes.length - 1 },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setActiveEdge?.(null);
      },
    });
    return steps;
  }

  steps.push({
    description: `MST complete — ${nodes.length - 1} edges, total weight ${total}`,
    kind: 'found',
    line: 9,
    vars: { total, edgeCount: nodes.length - 1 },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setTreeEdges?.(snapshotTree());
    },
  });

  return steps;
};
