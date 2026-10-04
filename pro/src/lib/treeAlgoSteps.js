// Pure step builders for tree algorithms: BST validation, mirroring and
// lowest common ancestor. Each returns [{ description, action, kind?, line,
// vars? }] where actions call the page's ui callbacks with absolute highlight
// state so the player can replay steps 0..k when scrubbing. Builders take
// plain { value, left, right } nodes (AVLNode satisfies this) and never
// mutate the tree — mirroring is narrated here and applied by the page on
// completion. `line` is 1-based into TREE_ALGO_PSEUDOCODE.

const fmtBound = (x) => (x === -Infinity ? '-∞' : x === Infinity ? '∞' : x);

export const buildValidateBSTSteps = (root, ui) => {
  const steps = [
    {
      description: 'Validating BST property with in-order bounds',
      kind: 'move',
      line: 1,
      action: () => {
        ui.setActiveNodeValue?.(null);
        ui.setHighlightedNodes?.([]);
      },
    },
  ];

  let valid = true;

  const walk = (node, lo, hi) => {
    if (!node) return true;
    const loText = fmtBound(lo);
    const hiText = fmtBound(hi);
    steps.push({
      description: `Visiting node ${node.value} (allowed ${loText}..${hiText})`,
      kind: 'compare',
      line: 2,
      vars: { v: node.value, lo, hi },
      action: () => {
        ui.setActiveNodeValue?.(node.value);
        ui.setHighlightedNodes?.([node.value]);
      },
    });
    if (node.value <= lo || node.value >= hi) {
      steps.push({
        description: `BST violation: ${node.value} is outside (${loText}..${hiText})`,
        kind: 'error',
        line: 3,
        vars: { v: node.value },
        action: () => {},
      });
      return false;
    }
    steps.push({
      description: `${node.value} is within (${loText}..${hiText})`,
      kind: 'compare',
      line: 3,
      vars: { v: node.value },
      action: () => {},
    });
    if (!walk(node.left, lo, node.value)) return false;
    return walk(node.right, node.value, hi);
  };

  if (root) {
    valid = walk(root, -Infinity, Infinity);
  }

  steps.push({
    description: valid ? 'Tree is a valid BST' : 'Tree violates the BST property',
    kind: valid ? 'found' : 'error',
    line: valid ? 6 : 3,
    vars: { valid },
    action: () => {
      ui.setActiveNodeValue?.(null);
      ui.setHighlightedNodes?.([]);
    },
  });

  return steps;
};

export const buildMirrorSteps = (root, ui) => {
  const steps = [
    {
      description: 'Mirroring the tree (swap every left/right child)',
      kind: 'move',
      line: 1,
      action: () => {
        ui.setActiveNodeValue?.(null);
        ui.setHighlightedNodes?.([]);
      },
    },
  ];

  const mirror = (node) => {
    if (!node) return;
    steps.push({
      description: `Visiting node ${node.value}`,
      kind: 'compare',
      line: 2,
      vars: { v: node.value },
      action: () => {
        ui.setActiveNodeValue?.(node.value);
        ui.setHighlightedNodes?.([node.value]);
      },
    });
    if (!node.left && !node.right) {
      steps.push({
        description: `Node ${node.value} is a leaf — nothing to swap`,
        kind: 'compare',
        line: 3,
        vars: { v: node.value },
        action: () => {},
      });
      return;
    }
    const leftVal = node.left ? node.left.value : 'null';
    const rightVal = node.right ? node.right.value : 'null';
    steps.push({
      description: `Swapping children of ${node.value} (left ${leftVal} ↔ right ${rightVal})`,
      kind: 'move',
      line: 4,
      vars: { v: node.value, left: node.left?.value ?? null, right: node.right?.value ?? null },
      action: () => {},
    });
    mirror(node.left);
    mirror(node.right);
  };

  mirror(root);

  steps.push({
    description: 'Tree mirrored',
    kind: 'found',
    line: 7,
    action: () => {
      ui.setActiveNodeValue?.(null);
      ui.setHighlightedNodes?.([]);
    },
  });

  return steps;
};

export const buildLCASteps = (root, a, b, ui) => {
  const steps = [
    {
      description: `Finding LCA of ${a} and ${b}`,
      kind: 'move',
      line: 1,
      vars: { a, b },
      action: () => {
        ui.setActiveNodeValue?.(null);
        ui.setHighlightedNodes?.([]);
      },
    },
  ];

  const findValue = (node, target, searchLine) => {
    if (!node) return false;
    steps.push({
      description: `Visiting node ${node.value} (looking for ${target})`,
      kind: 'compare',
      line: searchLine,
      vars: { v: node.value, target },
      action: () => {
        ui.setActiveNodeValue?.(node.value);
        ui.setHighlightedNodes?.([node.value]);
      },
    });
    if (node.value === target) {
      steps.push({
        description: `Value ${target} found in the tree`,
        kind: 'found',
        line: searchLine,
        vars: { target },
        action: () => {},
      });
      return true;
    }
    return findValue(node.left, target, searchLine) || findValue(node.right, target, searchLine);
  };

  steps.push({
    description: `Searching for ${a}`,
    kind: 'compare',
    line: 2,
    vars: { target: a },
    action: () => {},
  });
  if (!findValue(root, a, 2)) {
    steps.push({
      description: `Value ${a} is not in the tree`,
      kind: 'error',
      line: 2,
      vars: { target: a },
      action: () => {},
    });
    return steps;
  }

  steps.push({
    description: `Searching for ${b}`,
    kind: 'compare',
    line: 3,
    vars: { target: b },
    action: () => {},
  });
  if (!findValue(root, b, 3)) {
    steps.push({
      description: `Value ${b} is not in the tree`,
      kind: 'error',
      line: 3,
      vars: { target: b },
      action: () => {},
    });
    return steps;
  }

  let cur = root;
  while (cur) {
    const stepValue = cur.value;
    if (a < stepValue && b < stepValue) {
      steps.push({
        description: `At node ${stepValue}: ${a} and ${b} are both smaller → descend left`,
        kind: 'compare',
        line: 4,
        vars: { v: stepValue, a, b },
        action: () => {
          ui.setActiveNodeValue?.(stepValue);
          ui.setHighlightedNodes?.([stepValue]);
        },
      });
      cur = cur.left;
    } else if (a > stepValue && b > stepValue) {
      steps.push({
        description: `At node ${stepValue}: ${a} and ${b} are both larger → descend right`,
        kind: 'compare',
        line: 5,
        vars: { v: stepValue, a, b },
        action: () => {
          ui.setActiveNodeValue?.(stepValue);
          ui.setHighlightedNodes?.([stepValue]);
        },
      });
      cur = cur.right;
    } else {
      steps.push({
        description:
          a === stepValue || b === stepValue
            ? `At node ${stepValue}: ${stepValue} is one of the keys → LCA is ${stepValue}`
            : `At node ${stepValue}: ${a} < ${stepValue} but ${b} > ${stepValue} → LCA is ${stepValue}`,
        kind: 'found',
        line: 6,
        vars: { v: stepValue, a, b },
        action: () => {
          ui.setActiveNodeValue?.(stepValue);
          ui.setHighlightedNodes?.([stepValue]);
        },
      });
      steps.push({
        description: `Lowest common ancestor of ${a} and ${b} is ${stepValue}`,
        kind: 'found',
        line: 6,
        vars: { a, b, lca: stepValue },
        action: () => {
          ui.setActiveNodeValue?.(null);
          ui.setHighlightedNodes?.([]);
        },
      });
      return steps;
    }
  }

  return steps;
};
