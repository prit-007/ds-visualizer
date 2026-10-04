// Pure step builders for the graph visualizer. Graphs are undirected:
// `nodes` is an array of unique integer values, `edges` is an array of
// [from, to] pairs. Each builder returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks with absolute state so the player can replay
// steps 0..k when scrubbing. `line` is the 1-based line into
// GRAPH_PSEUDOCODE; `vars` feeds the variable watch. Traversal builders
// assume `start` is a node in the graph — the page validates inputs.

const buildAdjacency = (nodes, edges) => {
  const adj = new Map(nodes.map((v) => [v, []]));
  (edges ?? []).forEach(([a, b]) => {
    if (adj.has(a) && adj.has(b)) {
      adj.get(a).push(b);
      adj.get(b).push(a);
    }
  });
  return adj;
};

export const buildAddNodeSteps = (nodes, value, ui) => {
  const { setActiveValue, setHighlightedEdge } = ui;
  return [
    {
      description: `Creating a new node with value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveValue?.(null);
        setHighlightedEdge?.(null);
      },
    },
    {
      description: `Placing node ${value} on the canvas (position ${nodes.length})`,
      kind: 'move',
      line: 2,
      vars: { value, pos: nodes.length },
      action: () => {
        setActiveValue?.(value);
      },
    },
    {
      description: `Graph now has ${nodes.length + 1} nodes`,
      kind: 'found',
      line: 3,
      vars: { nodes: nodes.length + 1 },
      action: () => {
        setActiveValue?.(value);
      },
    },
  ];
};

export const buildAddEdgeSteps = (nodes, edges, from, to, ui) => {
  const { setActiveValue, setHighlightedEdge } = ui;
  return [
    {
      description: `Locating node ${from}`,
      kind: 'compare',
      line: 2,
      vars: { value: from },
      action: () => {
        setActiveValue?.(from);
        setHighlightedEdge?.(null);
      },
    },
    {
      description: `Locating node ${to}`,
      kind: 'compare',
      line: 2,
      vars: { value: to },
      action: () => {
        setActiveValue?.(to);
      },
    },
    {
      description: `Connecting ${from} — ${to}`,
      kind: 'move',
      line: 4,
      vars: { from, to },
      action: () => {
        setHighlightedEdge?.([from, to]);
      },
    },
    {
      description: `Graph now has ${edges.length + 1} edges`,
      kind: 'found',
      line: 5,
      vars: { edges: edges.length + 1 },
      action: () => {
        setActiveValue?.(null);
        setHighlightedEdge?.(null);
      },
    },
  ];
};

export const buildBFSSteps = (nodes, edges, start, ui) => {
  const { setActiveValue, setHighlightedEdge } = ui;
  const adj = buildAdjacency(nodes, edges);
  const visited = new Set();
  const order = [];
  const queue = [start];
  visited.add(start);

  const steps = [
    {
      description: `Starting BFS at node ${start}`,
      kind: 'move',
      line: 2,
      vars: { start, queue: [...queue] },
      action: () => {
        setActiveValue?.(start);
        setHighlightedEdge?.(null);
      },
    },
  ];

  while (queue.length > 0) {
    const cur = queue.shift();
    order.push(cur);
    steps.push({
      description: `Visiting node ${cur}`,
      kind: 'found',
      line: 6,
      vars: { cur, order: [...order] },
      action: () => {
        setActiveValue?.(cur);
      },
    });

    for (const nb of adj.get(cur) ?? []) {
      steps.push({
        description: `Scanning edge ${cur} — ${nb}`,
        kind: 'compare',
        line: 7,
        vars: { u: cur, v: nb },
        action: () => {
          setHighlightedEdge?.([cur, nb]);
        },
      });
      if (visited.has(nb)) {
        steps.push({
          description: `Node ${nb} already visited — skipping`,
          kind: 'compare',
          line: 8,
          vars: { nb },
          action: () => {},
        });
      } else {
        visited.add(nb);
        queue.push(nb);
        steps.push({
          description: `Queuing node ${nb}`,
          kind: 'move',
          line: 10,
          vars: { nb, queue: [...queue] },
          action: () => {
            setActiveValue?.(nb);
          },
        });
      }
    }
  }

  steps.push({
    description: `BFS complete — visit order: ${order.join(', ')}`,
    kind: 'found',
    line: 11,
    vars: { order: [...order] },
    action: () => {
      setActiveValue?.(null);
      setHighlightedEdge?.(null);
    },
  });

  return steps;
};

export const buildDFSSteps = (nodes, edges, start, ui) => {
  const { setActiveValue, setHighlightedEdge } = ui;
  const adj = buildAdjacency(nodes, edges);
  const visited = new Set();
  const order = [];

  const steps = [
    {
      description: `Starting DFS at node ${start}`,
      kind: 'move',
      line: 2,
      vars: { start },
      action: () => {
        setActiveValue?.(start);
        setHighlightedEdge?.(null);
      },
    },
  ];

  const visit = (u) => {
    visited.add(u);
    order.push(u);
    steps.push({
      description: `Visiting node ${u}`,
      kind: 'found',
      line: 6,
      vars: { cur: u, order: [...order] },
      action: () => {
        setActiveValue?.(u);
      },
    });

    for (const nb of adj.get(u) ?? []) {
      steps.push({
        description: `Scanning edge ${u} — ${nb}`,
        kind: 'compare',
        line: 7,
        vars: { u, v: nb },
        action: () => {
          setHighlightedEdge?.([u, nb]);
        },
      });
      if (visited.has(nb)) {
        steps.push({
          description: `Node ${nb} already visited — skipping`,
          kind: 'compare',
          line: 8,
          vars: { nb },
          action: () => {},
        });
      } else {
        steps.push({
          description: `Descending into node ${nb}`,
          kind: 'move',
          line: 9,
          vars: { nb },
          action: () => {
            setActiveValue?.(nb);
          },
        });
        visit(nb);
      }
    }
  };

  visit(start);

  steps.push({
    description: `DFS complete — visit order: ${order.join(', ')}`,
    kind: 'found',
    line: 11,
    vars: { order: [...order] },
    action: () => {
      setActiveValue?.(null);
      setHighlightedEdge?.(null);
    },
  });

  return steps;
};
