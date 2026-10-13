// Pure Kahn's-algorithm step builder for topological sort on a directed
// graph (edges = [from, to]). Returns steps with absolute state for the
// player. `line` is 1-based into TOPO_PSEUDOCODE.

const buildAdjacency = (nodes, edges) => {
  const out = new Map(nodes.map((n) => [n, []]));
  const indegree = new Map(nodes.map((n) => [n, 0]));
  edges.forEach(([from, to]) => {
    if (!out.has(from) || !out.has(to)) return;
    out.get(from).push(to);
    indegree.set(to, indegree.get(to) + 1);
  });
  return { out, indegree };
};

const fmtIndegree = (indegree) =>
  [...indegree.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, d]) => `${n}:${d}`)
    .join('  ');

export const buildTopoSteps = (nodes, edges, ui) => {
  const { out, indegree } = buildAdjacency(nodes, edges);
  const indegreeSnapshot = () => new Map(indegree);

  const steps = [
    {
      description: 'Starting topological sort (Kahn’s algorithm)',
      kind: 'move',
      line: 1,
      vars: { n: nodes.length },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setHighlightedNodes?.([]);
        ui.setIndegrees?.(indegreeSnapshot());
      },
    },
  ];

  steps.push({
    description: `Computing in-degrees — ${fmtIndegree(indegree)}`,
    kind: 'compare',
    line: 2,
    vars: { indegrees: Object.fromEntries(indegree) },
    action: () => {
      ui.setIndegrees?.(indegreeSnapshot());
    },
  });

  const order = [];
  const queue = nodes.filter((n) => indegree.get(n) === 0).sort((a, b) => a - b);
  const queueText = () => `[${queue.join(', ')}]`;

  steps.push({
    description: `Starting frontier (in-degree 0): ${queueText()}`,
    kind: 'compare',
    line: 3,
    vars: { queue: [...queue] },
    action: () => {
      ui.setHighlightedNodes?.([...queue]);
    },
  });

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    const snapshot = [...order];
    steps.push({
      description: `Visiting node ${node} — appending to the ordering`,
      kind: 'found',
      line: 5,
      vars: { node, order: snapshot },
      action: () => {
        ui.setActiveNode?.(node);
        ui.setHighlightedNodes?.([]);
        ui.setOrder?.(snapshot);
      },
    });

    for (const next of out.get(node) ?? []) {
      indegree.set(next, indegree.get(next) - 1);
      const newDegree = indegree.get(next);
      steps.push({
        description: `Decrementing in-degree of ${next} → ${newDegree}`,
        kind: 'compare',
        line: 6,
        vars: { node: next, degree: newDegree },
        action: () => {
          ui.setActiveNode?.(next);
          ui.setIndegrees?.(indegreeSnapshot());
        },
      });
      if (newDegree === 0) {
        queue.push(next);
        queue.sort((a, b) => a - b);
        steps.push({
          description: `${next} joins the frontier — queue ${queueText()}`,
          kind: 'move',
          line: 7,
          vars: { node: next, queue: [...queue] },
          action: () => {
            ui.setHighlightedNodes?.([...queue]);
            ui.setIndegrees?.(indegreeSnapshot());
          },
        });
      }
    }
  }

  const finalOrder = [...order];
  if (order.length !== nodes.length) {
    steps.push({
      description: 'Cycle detected — no topological order exists',
      kind: 'error',
      line: 9,
      vars: { order: finalOrder },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setHighlightedNodes?.([]);
      },
    });
    return steps;
  }

  steps.push({
    description: `Topological order: ${finalOrder.join(' → ')}`,
    kind: 'found',
    line: 8,
    vars: { order: finalOrder },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setHighlightedNodes?.([]);
      ui.setOrder?.(finalOrder);
    },
  });

  return steps;
};
