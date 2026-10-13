// Pure layout for the heap's complete-binary-tree view. Index i lives at
// depth floor(log2(i+1)); nodes on a level spread evenly across the width.
// Returns node positions plus parent→child edges. No React, no DOM.

export const CANVAS_W = 640;
export const V_GAP = 84;
export const CANVAS_PAD = 40;
export const NODE_RADIUS = 26;

export const layoutHeap = (size) => {
  if (!size || size <= 0) return { nodes: [], edges: [], width: CANVAS_W, height: 0 };

  const nodes = [];
  for (let i = 0; i < size; i += 1) {
    const depth = Math.floor(Math.log2(i + 1));
    const first = 2 ** depth - 1;
    const posInLevel = i - first;
    const levelCount = 2 ** depth;
    const slot = CANVAS_W / (levelCount + 1);
    nodes.push({
      index: i,
      depth,
      x: slot * (posInLevel + 1),
      y: CANVAS_PAD + depth * V_GAP,
    });
  }

  const edges = [];
  for (let i = 1; i < size; i += 1) {
    const parent = Math.floor((i - 1) / 2);
    edges.push({
      parentIndex: parent,
      childIndex: i,
      x1: nodes[parent].x,
      y1: nodes[parent].y + NODE_RADIUS,
      x2: nodes[i].x,
      y2: nodes[i].y - NODE_RADIUS,
    });
  }

  const maxDepth = nodes.reduce((max, n) => Math.max(max, n.depth), 0);
  const height = CANVAS_PAD * 2 + maxDepth * V_GAP;
  return { nodes, edges, width: CANVAS_W, height };
};
