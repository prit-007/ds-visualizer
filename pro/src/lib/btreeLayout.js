// Pure coordinate layout for the B-tree canvas. Leaves claim horizontal
// slots left-to-right; each internal node is centered over its children
// (simple tidy layout — no overlap for order-3 demo trees). Nodes render
// as horizontal key boxes; edges run parent-bottom → child-top.
// Returns plain data only — no React, no DOM.

export const NODE_PAD = 12;
export const KEY_W = 44;
export const KEY_H = 40;
export const LEVEL_GAP = 110;
export const SIB_GAP = 28;
export const CANVAS_PAD = 60;

export const nodeWidth = (keys) => keys.length * KEY_W + NODE_PAD * 2;

export const layoutBTree = (root) => {
  if (!root) return { nodes: [], edges: [], width: 0, height: 0 };

  const nodes = [];
  const edges = [];
  let cursor = CANVAS_PAD;
  let maxDepth = 0;

  const mkEdge = (parent, child) => ({
    fromKeys: [...parent.keys],
    toKeys: [...child.keys],
    x1: parent.x,
    y1: parent.y + KEY_H / 2 + 4,
    x2: child.x,
    y2: child.y - KEY_H / 2 - 4,
  });

  const place = (node, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const width = nodeWidth(node.keys);
    const y = CANVAS_PAD + depth * LEVEL_GAP;

    if (!node.children || node.children.length === 0) {
      const x = cursor + width / 2;
      cursor += width + SIB_GAP;
      const entry = { keys: [...node.keys], x, y, depth, width, node };
      nodes.push(entry);
      return { entry, x };
    }

    const kids = node.children.map((child) => place(child, depth + 1));
    const x = (kids[0].x + kids[kids.length - 1].x) / 2;
    const entry = { keys: [...node.keys], x, y, depth, width, node };
    nodes.push(entry);
    kids.forEach((kid) => edges.push(mkEdge(entry, kid.entry)));
    return { entry, x };
  };

  place(root, 0);

  const width = cursor - SIB_GAP + CANVAS_PAD;
  const height = CANVAS_PAD * 2 + maxDepth * LEVEL_GAP;
  return { nodes, edges, width, height };
};
