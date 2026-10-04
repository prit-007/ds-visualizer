// Pure coordinate layout for the graph visualizer canvas. Places each node
// on a circle (first node at the top, then clockwise), with the radius
// growing as nodes are added so circles stay apart. Edge endpoints are
// trimmed to the node radius on both ends so SVG lines can draw links.
// Returns plain data only — no React, no DOM.

export const NODE_RADIUS = 30;
export const CANVAS_PAD = 60;

export const layoutGraph = (values, edgePairs) => {
  if (!values || values.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const radius = Math.max(120, values.length * 28);
  const cx = CANVAS_PAD + radius;
  const cy = CANVAS_PAD + radius;
  const width = 2 * (CANVAS_PAD + radius);
  const height = width;

  const nodes = [];
  const byValue = new Map();
  values.forEach((value, i) => {
    // A single node sits at the center; larger graphs start at the top.
    const angle = values.length === 1 ? 0 : -Math.PI / 2 + (2 * Math.PI * i) / values.length;
    const entry = {
      value,
      x: cx + (values.length === 1 ? 0 : radius * Math.cos(angle)),
      y: cy + (values.length === 1 ? 0 : radius * Math.sin(angle)),
    };
    nodes.push(entry);
    byValue.set(value, entry);
  });

  const edges = [];
  (edgePairs ?? []).forEach(([from, to]) => {
    if (from === to) return;
    const a = byValue.get(from);
    const b = byValue.get(to);
    if (!a || !b) return;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len === 0) return;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    edges.push({
      fromValue: from,
      toValue: to,
      x1: a.x + ux * NODE_RADIUS,
      y1: a.y + uy * NODE_RADIUS,
      x2: b.x - ux * NODE_RADIUS,
      y2: b.y - uy * NODE_RADIUS,
    });
  });

  return { nodes, edges, width, height };
};
