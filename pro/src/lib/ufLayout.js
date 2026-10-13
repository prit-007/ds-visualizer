// Pure forest layout for the Union-Find canvas. Given a parent map and the
// set of values, lays each component as a tree (parent centered over its
// children) and offsets components side by side.

export const NODE_RADIUS = 26;
export const V_GAP = 84;
export const H_GAP = 96;
export const CANVAS_PAD = 44;

export const layoutUf = (parent, values) => {
  const children = new Map(values.map((v) => [v, []]));
  values.forEach((v) => {
    if (parent[v] !== undefined && parent[v] !== v) {
      (children.get(parent[v]) ?? children.get(v) ?? new Map()).push(v);
    }
  });

  const nodes = [];
  const edges = [];
  let cursor = CANVAS_PAD;
  let maxDepth = 0;

  const place = (value, depth, parentX) => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = (children.get(value) ?? []).sort((a, b) => a - b);
    let x;
    if (kids.length === 0) {
      x = cursor;
      cursor += H_GAP;
    } else {
      const childXs = kids.map((k) => place(k, depth + 1, null));
      x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }
    const me = {
      value,
      x,
      y: CANVAS_PAD + depth * V_GAP,
      depth,
      isRoot: parent[value] === value,
      rank: null,
    };
    nodes.push(me);
    kids.forEach((k) => {
      const kid = nodes.find((n) => n.value === k);
      edges.push({
        parentValue: value,
        childValue: k,
        x1: x,
        y1: me.y + NODE_RADIUS,
        x2: kid.x,
        y2: kid.y - NODE_RADIUS,
      });
    });
    return x;
  };

  values
    .filter((v) => parent[v] === undefined || parent[v] === v)
    .sort((a, b) => a - b)
    .forEach((root) => {
      cursor += 0; // reserve spacing via H_GAP inside place
      place(root, 0, null);
      cursor += H_GAP / 2;
    });

  // Recompute edges for parent-centered layout deterministically
  const byValue = Object.fromEntries(nodes.map((n) => [n.value, n]));
  edges.length = 0;
  values.forEach((v) => {
    if (parent[v] !== undefined && parent[v] !== v) {
      const from = byValue[parent[v]];
      const to = byValue[v];
      if (from && to) {
        edges.push({
          parentValue: parent[v],
          childValue: v,
          x1: from.x,
          y1: from.y + NODE_RADIUS,
          x2: to.x,
          y2: to.y - NODE_RADIUS,
        });
      }
    }
  });

  const width = cursor + CANVAS_PAD;
  const height = CANVAS_PAD * 2 + maxDepth * V_GAP;
  return { nodes, edges, width, height };
};
