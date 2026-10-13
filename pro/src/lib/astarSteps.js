// Pure A* step builder for the weighted-graph algorithm page.
// `weightedEdges` is [[u, v, w], ...] (undirected). The heuristic is
// h(n) = min edge weight × fewest edges to the goal (BFS hop count) —
// admissible because every path to the goal needs at least that many
// edges and each edge costs at least the minimum weight. Returns
// [{ description, action, kind?, line, vars? }] with absolute state;
// `line` is 1-based into ASTAR_PSEUDOCODE.

const buildAdjacency = (nodes, edges) => {
  const adj = new Map(nodes.map((v) => [v, []]));
  edges.forEach(([a, b, w]) => {
    if (!adj.has(a) || !adj.has(b)) return;
    adj.get(a).push({ to: b, w });
    adj.get(b).push({ to: a, w });
  });
  adj.forEach((list) => list.sort((x, y) => x.to - y.to));
  return adj;
};

const fmt = (x) => (x === Infinity ? '∞' : x);

export const buildAstarSteps = (nodes, weightedEdges, start, goal, ui) => {
  const adj = buildAdjacency(nodes, weightedEdges);
  const steps = [
    {
      description: `Starting A* from node ${start} toward goal ${goal}`,
      kind: 'move',
      line: 1,
      vars: { start, goal },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setVisitedNodes?.([]);
        ui.setActiveEdge?.(null);
        ui.setDistances?.(Object.fromEntries(nodes.map((n) => [n, Infinity])));
        ui.setResult?.(null);
      },
    },
  ];

  if (!nodes.includes(start) || !nodes.includes(goal)) {
    steps.push({
      description: `Start ${start} / goal ${goal} must both be in the graph`,
      kind: 'error',
      line: 1,
      vars: { start, goal },
      action: () => {},
    });
    return steps;
  }

  // Admissible heuristic: min edge weight × BFS hops from the goal.
  const weights = weightedEdges.map(([, , w]) => w);
  const minWeight = weights.length > 0 ? Math.max(0, Math.min(...weights)) : 0;
  const hops = Object.fromEntries(nodes.map((n) => [n, Infinity]));
  hops[goal] = 0;
  const queue = [goal];
  while (queue.length > 0) {
    const u = queue.shift();
    for (const { to } of adj.get(u) ?? []) {
      if (hops[to] === Infinity && to !== goal) {
        hops[to] = hops[u] + 1;
        queue.push(to);
      }
    }
  }
  const h = {};
  nodes.forEach((n) => {
    h[n] = hops[n] === Infinity ? Infinity : minWeight * hops[n];
  });

  steps.push({
    description: `Heuristic h(n) = ${minWeight} × fewest edges to ${goal} (min edge weight × BFS hops) — admissible`,
    kind: 'compare',
    line: 2,
    vars: { minWeight, goal },
    action: () => {},
  });

  const g = Object.fromEntries(nodes.map((n) => [n, Infinity]));
  g[start] = 0;
  const parent = {};
  const gSnap = () => ({ ...g });
  steps.push({
    description: `g initialized — node ${start}: 0, others: ∞`,
    kind: 'compare',
    line: 3,
    vars: { start },
    action: () => {
      ui.setDistances?.(gSnap());
    },
  });

  const settled = new Set();
  let reached = false;
  while (settled.size < nodes.length) {
    let u = null;
    nodes.forEach((n) => {
      if (settled.has(n)) return;
      const f = g[n] + h[n];
      const fu = g[u] + h[u];
      if (u === null || f < fu) u = n;
    });
    if (u === null || g[u] === Infinity) break; // goal unreachable

    const f = g[u] + h[u];
    const currentNode = u;
    const settledSnap = [...settled, currentNode];
    steps.push({
      description: `Selecting node ${currentNode} with f = g + h = ${fmt(g[currentNode])} + ${fmt(h[currentNode])} = ${fmt(f)}`,
      kind: 'found',
      line: 5,
      vars: { node: currentNode, g: g[currentNode], h: h[currentNode], f },
      action: () => {
        ui.setActiveNode?.(currentNode);
        ui.setVisitedNodes?.(settledSnap);
      },
    });
    settled.add(currentNode);

    if (currentNode === goal) {
      reached = true;
      steps.push({
        description: `Goal ${goal} reached with g = ${fmt(g[goal])}`,
        kind: 'found',
        line: 6,
        vars: { goal, g: g[goal] },
        action: () => {
          ui.setActiveNode?.(goal);
        },
      });
      break;
    }

    for (const { to, w } of adj.get(currentNode) ?? []) {
      if (settled.has(to)) continue;
      const alt = g[currentNode] + w;
      steps.push({
        description: `Relaxing edge ${currentNode}—${to} (weight ${w}): ${fmt(g[currentNode])}+${w}=${fmt(alt)} vs ${fmt(g[to])}, f = ${fmt(alt + h[to])}`,
        kind: 'compare',
        line: 7,
        vars: { from: currentNode, to, weight: w, alt, current: g[to] },
        action: () => {
          ui.setActiveEdge?.([currentNode, to]);
          ui.setActiveNode?.(to);
        },
      });
      if (alt < g[to]) {
        g[to] = alt;
        parent[to] = currentNode;
        const updSnap = gSnap();
        steps.push({
          description: `Updating g of ${to} to ${alt} (f = ${fmt(alt + h[to])})`,
          kind: 'move',
          line: 8,
          vars: { node: to, g: alt },
          action: () => {
            ui.setDistances?.(updSnap);
            ui.setActiveEdge?.([currentNode, to]);
          },
        });
      }
    }
  }

  let result;
  let kind;
  if (reached) {
    const path = [goal];
    let cur = goal;
    while (parent[cur] !== undefined) {
      cur = parent[cur];
      path.unshift(cur);
    }
    result = `Path ${path.join(' → ')} costs ${fmt(g[goal])}`;
    kind = 'found';
  } else {
    result = `No path from ${start} to ${goal} — goal unreachable`;
    kind = 'error';
  }
  const finalSnap = gSnap();
  steps.push({
    description: result,
    kind,
    line: 9,
    vars: { start, goal, distances: finalSnap },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setVisitedNodes?.([...nodes]);
      ui.setDistances?.(finalSnap);
      ui.setResult?.(result);
    },
  });

  return steps;
};
