// Pure Kosaraju SCC step builder: pass 1 DFS on the original directed
// graph records post-order finish times, pass 2 DFS on the reversed
// graph in decreasing finish order grows each strongly connected
// component. `edges` is [[u, v, w], ...] treated as directed (weights
// ignored). Returns [{ description, action, kind?, line, vars? }] with
// absolute state; `line` is 1-based into KOSARAJU_PSEUDOCODE.

const buildDirectedAdj = (nodes, edges) => {
  const adj = new Map(nodes.map((v) => [v, []]));
  edges.forEach(([a, b]) => {
    if (!adj.has(a) || !adj.has(b)) return;
    adj.get(a).push(b);
  });
  adj.forEach((list) => list.sort((x, y) => x - y));
  return adj;
};

export const buildKosarajuSteps = (nodes, edges, ui) => {
  const adj = buildDirectedAdj(nodes, edges);
  const rev = new Map(nodes.map((v) => [v, []]));
  edges.forEach(([a, b]) => {
    if (!rev.has(a) || !rev.has(b)) return;
    rev.get(b).push(a);
  });
  rev.forEach((list) => list.sort((x, y) => x - y));

  const steps = [
    {
      description: 'Kosaraju SCC — pass 1: DFS on the original graph',
      kind: 'move',
      line: 1,
      vars: { nodes: nodes.length },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setVisitedNodes?.([]);
        ui.setActiveEdge?.(null);
        ui.setSccOf?.({});
        ui.setResult?.(null);
      },
    },
  ];

  const visited = new Set();
  const post = [];
  const visitedList = [];

  const dfs1 = (u) => {
    visited.add(u);
    visitedList.push(u);
    for (const v of adj.get(u) ?? []) {
      if (visited.has(v)) {
        steps.push({
          description: `Edge ${u}→${v} — ${v} already visited`,
          kind: 'compare',
          line: 5,
          vars: { from: u, to: v },
          action: () => {
            ui.setActiveNode?.(u);
            ui.setActiveEdge?.([u, v]);
            ui.setVisitedNodes?.([...visitedList]);
          },
        });
      } else {
        steps.push({
          description: `Tree edge ${u}→${v} — recursing into ${v}`,
          kind: 'move',
          line: 6,
          vars: { from: u, to: v },
          action: () => {
            ui.setActiveNode?.(v);
            ui.setActiveEdge?.([u, v]);
            ui.setVisitedNodes?.([...visitedList]);
          },
        });
        dfs1(v);
      }
    }
    post.push(u);
    steps.push({
      description: `Finished node ${u} — post-order #${post.length}`,
      kind: 'found',
      line: 7,
      vars: { node: u, finish: post.length },
      action: () => {
        ui.setActiveNode?.(u);
        ui.setActiveEdge?.(null);
      },
    });
  };

  nodes.forEach((u) => {
    if (visited.has(u)) return;
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
    dfs1(u);
  });

  steps.push({
    description: 'Pass 2: DFS on the reversed graph in decreasing finish order',
    kind: 'move',
    line: 8,
    vars: { post },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setVisitedNodes?.([]);
    },
  });

  const sccOf = {};
  visited.clear(); // pass 2 starts fresh (line 8: visited ← ∅)
  const assigned = [];
  let componentId = 0;
  const components = [];

  const dfs2 = (u, members) => {
    visited.add(u);
    assigned.push(u);
    members.push(u);
    for (const v of rev.get(u) ?? []) {
      if (visited.has(v)) {
        steps.push({
          description: `Reverse edge ${u}→${v} — ${v} already visited`,
          kind: 'compare',
          line: 11,
          vars: { from: u, to: v },
          action: () => {
            ui.setActiveNode?.(u);
            ui.setActiveEdge?.([u, v]);
            ui.setVisitedNodes?.([...assigned]);
          },
        });
      } else {
        steps.push({
          description: `Reverse edge ${u}→${v} — ${v} joins the component`,
          kind: 'move',
          line: 12,
          vars: { from: u, to: v },
          action: () => {
            ui.setActiveNode?.(v);
            ui.setActiveEdge?.([u, v]);
            ui.setVisitedNodes?.([...assigned]);
          },
        });
        dfs2(v, members);
      }
    }
  };

  const order = [...post].reverse();
  order.forEach((u) => {
    if (visited.has(u)) return;
    const finishIndex = post.indexOf(u) + 1;
    steps.push({
      description: `Reverse DFS from node ${u} (post-order #${finishIndex})`,
      kind: 'move',
      line: 9,
      vars: { node: u, finish: finishIndex },
      action: () => {
        ui.setActiveNode?.(u);
        ui.setActiveEdge?.(null);
      },
    });
    const members = [];
    dfs2(u, members);
    componentId += 1;
    const sorted = [...members].sort((a, b) => a - b);
    components.push(sorted);
    sorted.forEach((m) => {
      sccOf[m] = componentId;
    });
    const sccSnap = { ...sccOf };
    steps.push({
      description: `Component ${componentId}: {${sorted.join(', ')}}`,
      kind: 'found',
      line: 13,
      vars: { component: componentId, members: sorted },
      action: () => {
        ui.setSccOf?.(sccSnap);
        ui.setVisitedNodes?.([...assigned]);
      },
    });
  });

  const fmtComponent = (c) => `{${[...c].sort((a, b) => a - b).join(', ')}}`;
  const display = [...components].sort((a, b) => a[0] - b[0]);
  const result = `Components: ${display.map(fmtComponent).join(' ')}`;
  const finalScc = { ...sccOf };
  steps.push({
    description: `Kosaraju complete — ${components.length} component${components.length === 1 ? '' : 's'}: ${display.map(fmtComponent).join(' ')}`,
    kind: 'found',
    line: 14,
    vars: { components },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setActiveEdge?.(null);
      ui.setVisitedNodes?.([...nodes]);
      ui.setSccOf?.(finalScc);
      ui.setResult?.(result);
    },
  });

  return steps;
};
