// Pure Bellman-Ford step builder. Handles negative edge weights: relaxes
// every edge V−1 times, early-stops when a pass changes nothing, and flags
// negative cycles. Absolute-state actions. Edges = [[u, v, w], ...].

const fmtDist = (x) => (x === Infinity ? '∞' : x);
const signed = (n) => (n < 0 ? String(n) : `+${n}`);

export const buildBellmanFordSteps = (nodes, edges, start, ui) => {
  const dist = {};
  nodes.forEach((n) => {
    dist[n] = Infinity;
  });
  dist[start] = 0;
  const snapshot = () => ({ ...dist });
  const V = nodes.length;

  const steps = [
    {
      description: `Starting Bellman-Ford from node ${start}`,
      kind: 'move',
      line: 1,
      vars: { start },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setActiveEdge?.(null);
        ui.setDistances?.(snapshot());
      },
    },
    {
      description: `Initialize distances — node ${start}: 0, others: ∞`,
      kind: 'compare',
      line: 2,
      vars: { start },
      action: () => {
        ui.setDistances?.(snapshot());
      },
    },
  ];

  let improvedAny = false;
  for (let pass = 1; pass <= V - 1; pass += 1) {
    steps.push({
      description: `Relaxation pass ${pass} of ${V - 1} (V − 1 passes)`,
      kind: 'compare',
      line: 3,
      vars: { pass, total: V - 1 },
      action: () => {
        ui.setActiveEdge?.(null);
      },
    });

    let improved = false;
    for (const [u, v, w] of edges) {
      const current = dist[v];
      const candidate = dist[u] === Infinity ? Infinity : dist[u] + w;
      if (candidate < current) {
        dist[v] = candidate;
        improved = true;
        improvedAny = true;
        const snap = snapshot();
        steps.push({
          description: `Relaxing edge ${u}—${v} (weight ${w}): ${fmtDist(dist[u])}${signed(w)}=${fmtDist(candidate)} vs ${fmtDist(current)} → update`,
          kind: 'move',
          line: 5,
          vars: { from: u, to: v, weight: w, candidate, current },
          action: () => {
            ui.setActiveEdge?.([u, v]);
            ui.setActiveNode?.(v);
            ui.setDistances?.(snap);
          },
        });
      } else {
        steps.push({
          description: `Relaxing edge ${u}—${v} (weight ${w}): ${fmtDist(dist[u])}${signed(w)}=${fmtDist(candidate)} vs ${fmtDist(current)} (no change)`,
          kind: 'compare',
          line: 5,
          vars: { from: u, to: v, weight: w, candidate, current },
          action: () => {
            ui.setActiveEdge?.([u, v]);
          },
        });
      }
    }

    if (!improved) {
      steps.push({
        description: `Pass ${pass} — no distances improved, distances converged`,
        kind: 'found',
        line: 6,
        vars: { pass },
        action: () => {
          ui.setActiveNode?.(null);
          ui.setActiveEdge?.(null);
          ui.setDistances?.(snapshot());
        },
      });
      break;
    }
  }

  // Negative-cycle check: one extra full pass.
  if (improvedAny) {
    let cycle = false;
    for (const [u, v, w] of edges) {
      const candidate = dist[u] === Infinity ? Infinity : dist[u] + w;
      if (candidate < dist[v]) {
        cycle = true;
        break;
      }
    }
    if (cycle) {
      steps.push({
        description: 'Negative cycle detected — distances keep decreasing forever',
        kind: 'error',
        line: 8,
        vars: { cycle: true },
        action: () => {
          ui.setActiveNode?.(null);
          ui.setActiveEdge?.(null);
        },
      });
      return steps;
    }
  }

  const order = [...nodes].sort((a, b) => a - b);
  const summary = order.map((n) => `${n}→${fmtDist(dist[n])}`).join(' ');
  steps.push({
    description: `Shortest distances from ${start}: ${summary}`,
    kind: 'found',
    line: 7,
    vars: { distances: snapshot() },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setDistances?.(snapshot());
    },
  });

  return steps;
};
