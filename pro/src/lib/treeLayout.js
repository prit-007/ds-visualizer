// Pure coordinate layout for the AVL visualizer canvas. Assigns each node
// an in-order slot on x and its depth on y, then derives edge endpoints
// trimmed to the node radius so SVG paths can draw parent → child links.
// Returns plain data only — no React, no DOM.

export const NODE_RADIUS = 30;
export const H_GAP = 110;
export const V_GAP = 110;
export const CANVAS_PAD = 60;
export const MIN_H_GAP = 72;

// Adaptive horizontal gap: small trees keep the comfortable H_GAP (test
// contracts + readability); wide trees compress so the canvas fits the
// viewport without horizontal scrolling. 72px keeps node circles apart
// (2 × NODE_RADIUS = 60).
export const hGapFor = (nodeCount) =>
  Math.max(MIN_H_GAP, Math.min(H_GAP, Math.floor(1300 / Math.max(nodeCount, 1))));

const countNodes = (node) => {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
};

export const layoutTree = (root) => {
  const nodes = [];
  const byNode = new Map();
  let slot = 0;
  const gap = hGapFor(countNodes(root));

  const assign = (node, depth) => {
    if (!node) return;
    assign(node.left, depth + 1);
    const entry = {
      value: node.value,
      depth,
      x: CANVAS_PAD + slot * gap,
      y: CANVAS_PAD + depth * V_GAP,
      height: node.height,
      balance: (node.left ? node.left.height : 0) - (node.right ? node.right.height : 0),
      node,
    };
    nodes.push(entry);
    byNode.set(node, entry);
    slot += 1;
    assign(node.right, depth + 1);
  };

  assign(root, 0);

  const edges = [];
  for (const entry of nodes) {
    const children = [
      { child: entry.node.left, side: 'left' },
      { child: entry.node.right, side: 'right' },
    ];
    for (const { child, side } of children) {
      if (!child) continue;
      const childEntry = byNode.get(child);
      edges.push({
        parentValue: entry.value,
        childValue: child.value,
        side,
        x1: entry.x,
        y1: entry.y + NODE_RADIUS,
        x2: childEntry.x,
        y2: childEntry.y - NODE_RADIUS,
      });
    }
  }

  const maxDepth = nodes.reduce((max, n) => Math.max(max, n.depth), 0);
  const width = nodes.length > 0 ? CANVAS_PAD * 2 + (nodes.length - 1) * gap : 0;
  const height = nodes.length > 0 ? CANVAS_PAD * 2 + maxDepth * V_GAP : 0;

  return { nodes, edges, width, height };
};
