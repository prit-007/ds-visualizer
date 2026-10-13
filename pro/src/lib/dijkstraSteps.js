// Pure Dijkstra step builder for the weighted-graph algorithm page.
// `weightedEdges` is [[u, v, w], ...] (undirected). Returns
// [{ description, action, kind?, line, vars? }] with absolute state so the
// player can replay steps 0..k when scrubbing. `line` is 1-based into
// DIJKSTRA_PSEUDOCODE. Settled nodes are skipped during relaxation.

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

const fmtDist = (d) => (d === Infinity ? '∞' : d);

export const buildDijkstraSteps = (nodes, weightedEdges, start, ui) => {
  const adj = buildAdjacency(nodes, weightedEdges);
  const dist = {};
  nodes.forEach((n) => {
    dist[n] = Infinity;
  });
  const distSnapshot = () => ({ ...dist });

  const steps = [
    {
      description: `Starting Dijkstra from node ${start}`,
      kind: 'move',
      line: 1,
      vars: { start },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setVisitedNodes?.([]);
        ui.setActiveEdge?.(null);
        ui.setDistances?.(
          Object.fromEntries(nodes.map((n) => [n, Infinity]))
        );
      },
    },
  ];

  if (!nodes.includes(start)) {
    steps.push({
      description: `Start node ${start} is not in the graph`,
      kind: 'error',
      line: 1,
      vars: { start },
      action: () => {},
    });
    return steps;
  }

  dist[start] = 0;
  const initSnap = distSnapshot();
  steps.push({
    description: `Tentative distances initialized — node ${start}: 0, others: ∞`,
    kind: 'compare',
    line: 2,
    vars: { start },
    action: () => {
      ui.setDistances?.(initSnap);
    },
  });

  const settled = new Set();
  while (settled.size < nodes.length) {
    let u = null;
    nodes.forEach((n) => {
      if (settled.has(n)) return;
      if (u === null || dist[n] < dist[u]) u = n;
    });
    if (u === null || dist[u] === Infinity) break; // unreachable remainder

    const currentNode = u;
    const settledSnap = [...settled, currentNode];
    steps.push({
      description: `Selecting node ${currentNode} with distance ${fmtDist(dist[currentNode])}`,
      kind: 'found',
      line: 4,
      vars: { node: currentNode, distance: dist[currentNode] },
      action: () => {
        ui.setActiveNode?.(currentNode);
        ui.setVisitedNodes?.(settledSnap);
      },
    });
    settled.add(currentNode);

    for (const { to, w } of adj.get(currentNode) ?? []) {
      if (settled.has(to)) continue;
      const alt = dist[currentNode] + w;
      steps.push({
        description: `Relaxing edge ${currentNode}—${to} (weight ${w}): ${fmtDist(dist[currentNode])}+${w}=${fmtDist(alt)} vs ${fmtDist(dist[to])}`,
        kind: 'compare',
        line: 5,
        vars: { from: currentNode, to, weight: w, alt, current: dist[to] },
        action: () => {
          ui.setActiveEdge?.([currentNode, to]);
          ui.setActiveNode?.(to);
        },
      });
      if (alt < dist[to]) {
        dist[to] = alt;
        const updSnap = distSnapshot();
        steps.push({
          description: `Updating distance of ${to} to ${alt}`,
          kind: 'move',
          line: 6,
          vars: { node: to, distance: alt },
          action: () => {
            ui.setDistances?.(updSnap);
            ui.setActiveEdge?.([currentNode, to]);
          },
        });
      }
    }
  }

  const order = [...nodes].sort((a, b) => a - b);
  const summary = order.map((n) => `${n}→${fmtDist(dist[n])}`).join(', ');
  const finalSnap = distSnapshot();
  steps.push({
    description: `Dijkstra complete — shortest distances from ${start}: ${summary}`,
    kind: 'found',
    line: 7,
    vars: { distances: finalSnap },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setVisitedNodes?.(order);
      ui.setDistances?.(finalSnap);
    },
  });

  return steps;
};
