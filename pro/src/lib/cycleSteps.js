// Pure directed-cycle detection step builder: DFS with a recursion
// stack — a back edge (edge to a node still on the stack) closes a
// cycle and the search stops with the exact path. `edges` is
// [[u, v, w], ...] treated as directed (weights ignored). Returns
// [{ description, action, kind?, line, vars? }] with absolute state;
// `line` is 1-based into CYCLE_PSEUDOCODE.

const buildDirectedAdj = (nodes, edges) => {
  const adj = new Map(nodes.map((v) => [v, []]));
  edges.forEach(([a, b]) => {
    if (!adj.has(a) || !adj.has(b)) return;
    adj.get(a).push(b);
  });
  adj.forEach((list) => list.sort((x, y) => x - y));
  return adj;
};

export const buildCycleSteps = (nodes, edges, ui) => {
  const adj = buildDirectedAdj(nodes, edges);
  const steps = [
    {
      description: 'Cycle detection — DFS with a recursion stack',
      kind: 'move',
      line: 1,
      vars: { nodes: nodes.length },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setVisitedNodes?.([]);
        ui.setActiveEdge?.(null);
        ui.setResult?.(null);
      },
    },
  ];

  const visited = new Set();
  const onStack = new Set();
  const stack = [];
  const visitedList = [];
  let cycleResult = null;

  const dfs = (u) => {
    visited.add(u);
    onStack.add(u);
    stack.push(u);
    visitedList.push(u);

    for (const v of adj.get(u) ?? []) {
      if (cycleResult) return;
      if (onStack.has(v)) {
        const idx = stack.indexOf(v);
        const cycle = [...stack.slice(idx), v];
        const description = `Back edge ${u}→${v} — ${v} is still on the recursion stack → cycle!`;
        steps.push({
          description,
          kind: 'error',
          line: 9,
          vars: { from: u, to: v },
          action: () => {
            ui.setActiveNode?.(v);
            ui.setActiveEdge?.([u, v]);
            ui.setVisitedNodes?.([...visitedList]);
          },
        });
        cycleResult = `Cycle detected: ${cycle.join(' → ')}`;
        return;
      }
      if (visited.has(v)) {
        steps.push({
          description: `Edge ${u}→${v} — ${v} already finished, no back edge`,
          kind: 'compare',
          line: 8,
          vars: { from: u, to: v },
          action: () => {
            ui.setActiveNode?.(u);
            ui.setActiveEdge?.([u, v]);
            ui.setVisitedNodes?.([...visitedList]);
          },
        });
      } else {
        steps.push({
          description: `Tree edge ${u}→${v} — recursing`,
          kind: 'move',
          line: 10,
          vars: { from: u, to: v },
          action: () => {
            ui.setActiveNode?.(v);
            ui.setActiveEdge?.([u, v]);
            ui.setVisitedNodes?.([...visitedList]);
          },
        });
        dfs(v);
      }
    }

    stack.pop();
    onStack.delete(u);
    steps.push({
      description: `Node ${u} popped — no cycle through ${u}`,
      kind: 'move',
      line: 11,
      vars: { node: u },
      action: () => {
        ui.setActiveNode?.(u);
        ui.setActiveEdge?.(null);
      },
    });
  };

  for (const u of nodes) {
    if (cycleResult) break;
    if (visited.has(u)) continue;
    steps.push({
      description: `DFS from node ${u}`,
      kind: 'move',
      line: 3,
      vars: { node: u },
      action: () => {
        ui.setActiveNode?.(u);
        ui.setActiveEdge?.(null);
      },
    });
    dfs(u);
  }

  const result = cycleResult ?? 'No cycle — the graph is a DAG';
  steps.push({
    description: result,
    kind: cycleResult ? 'error' : 'found',
    line: 4,
    vars: { cycle: cycleResult },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setVisitedNodes?.([...visitedList]);
      ui.setResult?.(result);
    },
  });

  return steps;
};
