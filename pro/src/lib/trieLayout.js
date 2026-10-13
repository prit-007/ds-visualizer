// Pure trie coordinate layout — children fanned out under the parent,
// parents centered over their subtree, edges trimmed to the node radius.
import { TrieNode } from "./trie";

const NODE_RADIUS = 22;
const H_GAP = 56;
const V_GAP = 86;
const PAD = 34;

export { NODE_RADIUS };

const measure = (node) => {
  const keys = Object.keys(node.children);
  if (keys.length === 0) return { count: 1 };
  let count = 0;
  keys.forEach((c) => {
    count += measure(node.children[c]).count;
  });
  return { count };
};

export const buildTrieLayout = (root) => {
  const selfChildren = (n) => Object.keys(n.children);
  const nodes = [];
  const edges = [];

  const place = (node, x, depth) => {
    nodes.push({
      value: node.char || "·",
      char: node.char,
      x,
      y: PAD + depth * V_GAP,
      isRoot: node === root,
      isEnd: node.isEnd,
    });
    const kids = selfChildren(node);
    if (kids.length === 0) return;
    const total = kids.reduce((acc, c) => acc + measure(node.children[c]).count, 0);
    let cursor = x - (total * H_GAP) / 2 + H_GAP / 2;
    kids.forEach((c) => {
      const child = node.children[c];
      const span = measure(child).count;
      const childX = cursor + ((span - 1) * H_GAP) / 2;
      place(child, childX, depth + 1);
      edges.push({
        parentValue: node.char || "·",
        childValue: child.char,
        x1: x,
        y1: PAD + depth * V_GAP,
        x2: childX,
        y2: PAD + (depth + 1) * V_GAP,
      });
      cursor += span * H_GAP;
    });
  };

  const leaves = measure(root);
  const kwargs = { width: Math.max(leaves.count * H_GAP + PAD * 2, 120), height: PAD * 2 + V_GAP * depthOf(root) };
  function depthOf(node) {
    const keys = selfChildren(node);
    if (keys.length === 0) return 1;
    return 1 + Math.max(...keys.map((c) => depthOf(node.children[c])));
  }

  place(root, PAD + (leaves.count * H_GAP) / 2, 0);

  const trimmed = edges.map((e) => {
    const dx = e.x2 - e.x1;
    const dy = e.y2 - e.y1;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const t1 = NODE_RADIUS / dist;
    const t2 = NODE_RADIUS / dist;
    return {
      parentValue: e.parentValue,
      childValue: e.childValue,
      x1: e.x1 + dx * t1,
      y1: e.y1 + dy * t1,
      x2: e.x2 - dx * t2,
      y2: e.y2 - dy * t2,
    };
  });

  return {
    nodes,
    edges: trimmed,
    width: kwargs.width,
    height: kwargs.height,
  };
};
