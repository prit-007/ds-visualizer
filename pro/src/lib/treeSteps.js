// Pure step builders for the AVL tree visualizer.
// Each returns [{ description, action, kind?, line, vars? }] where actions
// call the page's ui callbacks. Insert/delete consume the event traces
// emitted by avl.js (insert/deleteNode with a `trace` array) so every height
// update and rotation narrated here was produced by the real algorithm.
// Search has no mutation and remains a pre-state walk. Actions assign
// absolute state so a step player can safely replay steps 0..k when
// scrubbing. `line` is a 1-based line in TREE_PSEUDOCODE; `vars` feeds the
// variable watch.

const rotationStep = (event, ui, line) => {
  const { node, child } = event;
  const descriptions = {
    LL: `Left-left case at ${node}: rotate right (${child} moves up)`,
    RR: `Right-right case at ${node}: rotate left (${child} moves up)`,
    LR: `Left-right case at ${node}: rotate left at ${child}, then rotate right at ${node}`,
    RL: `Right-left case at ${node}: rotate right at ${child}, then rotate left at ${node}`,
  };
  return {
    description: descriptions[event.case] || `Rebalance at ${node}`,
    kind: 'move',
    line,
    vars: { case: event.case, node },
    action: () => {
      ui.setHighlightedNodes(child === undefined ? [node] : [node, child]);
    },
  };
};

const recheckStep = (event, ui, line) => {
  const { node, height, balance } = event;
  const verdict = Math.abs(balance) > 1 ? 'unbalanced' : 'balanced';
  return {
    description: `Node ${node}: height ${height}, balance factor ${balance} (${verdict})`,
    kind: 'compare',
    line,
    vars: { height, balance },
    action: () => {
      ui.setHighlightedNodes([node]);
    },
  };
};

// Counterfactual mode (rotations off): narrate the rotation that would have
// run so learners see exactly what the toggle suppressed.
const rotationSkippedStep = (event, ui, line) => {
  const { case: caseName, node, child } = event;
  return {
    description: `Rotations disabled — skipping ${caseName} rotation at ${node} (${child} stays below)`,
    kind: 'error',
    line,
    vars: { case: caseName, node },
    action: () => {
      ui.setHighlightedNodes(child === undefined ? [node] : [node, child]);
    },
  };
};

const moveStep = (event, ui, target, line) => {
  const { node, dir } = event;
  const relation = dir === 'left' ? '<' : '>';
  return {
    description: `${target} ${relation} ${node}, moving to ${dir} subtree`,
    kind: 'move',
    line,
    vars: { target, node },
    action: () => {
      ui.setHighlightedNodes([node]);
    },
  };
};

export const buildInsertSteps = (trace, value, ui) => {
  const { setActiveNodeValue, setHighlightedNodes } = ui;
  const steps = [
    {
      description: `Starting insertion of value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveNodeValue(null);
        setHighlightedNodes([]);
      },
    },
  ];

  let lastMove = null;
  let skippedRotation = false;

  for (const event of trace) {
    if (event.type === 'compare') {
      steps.push({
        description: `Comparing with node ${event.node}`,
        kind: 'compare',
        line: 3,
        vars: { target: value, node: event.node },
        action: () => {
          setActiveNodeValue(event.node);
        },
      });
    } else if (event.type === 'move') {
      lastMove = event;
      steps.push(moveStep(event, ui, value, event.dir === 'left' ? 4 : 6));
    } else if (event.type === 'created') {
      const parent = lastMove ? lastMove.node : null;
      const dir = lastMove ? lastMove.dir : null;
      const description = parent === null
        ? `Tree is empty, ${event.value} becomes the root`
        : `${dir === 'left' ? 'Left' : 'Right'} child of ${parent} is empty, inserting ${event.value} here`;
      steps.push({
        description,
        kind: 'found',
        line: 2,
        vars: { value: event.value },
        action: () => {
          setActiveNodeValue(null);
          setHighlightedNodes([]);
        },
      });
    } else if (event.type === 'recheck') {
      steps.push(recheckStep(event, ui, 9));
    } else if (event.type === 'rotate') {
      steps.push(
        rotationStep(
          event,
          ui,
          event.case === 'LL' || event.case === 'LR' ? 10 : 11
        )
      );
    } else if (event.type === 'rotate-skipped') {
      skippedRotation = true;
      steps.push(
        rotationSkippedStep(
          event,
          ui,
          event.case === 'LL' || event.case === 'LR' ? 10 : 11
        )
      );
    } else if (event.type === 'duplicate') {
      steps.push({
        description: `${value} already exists in the tree, insertion skipped`,
        kind: 'error',
        line: 7,
        vars: { value },
        action: () => {
          setActiveNodeValue(null);
          setHighlightedNodes([]);
        },
      });
      return steps;
    }
  }

  steps.push({
    description: skippedRotation
      ? 'Insertion complete — tree left unbalanced (rotations disabled)'
      : 'Insertion complete, tree is balanced',
    kind: 'found',
    line: 13,
    vars: { value },
    action: () => {
      setActiveNodeValue(value);
      setHighlightedNodes([]);
    },
  });

  return steps;
};

export const buildDeleteSteps = (trace, value, ui) => {
  const { setActiveNodeValue, setHighlightedNodes, setRemovingNodeValue } = ui;
  const steps = [
    {
      description: `Starting deletion of value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveNodeValue(null);
        setHighlightedNodes([]);
        setRemovingNodeValue(null);
      },
    },
  ];

  let target = value;
  let skippedRotation = false;

  for (let i = 0; i < trace.length; i++) {
    const event = trace[i];

    if (event.type === 'compare') {
      const isMatch = event.node === event.value;
      steps.push({
        description: `Checking node ${event.node}`,
        kind: 'compare',
        line: 3,
        vars: { target, node: event.node },
        action: () => {
          setActiveNodeValue(event.node);
        },
      });
      if (isMatch) {
        const next = trace[i + 1];
        const targetKept = next && next.type === 'two-children';
        steps.push({
          description: `Found node ${event.value} to delete`,
          kind: 'found',
          line: 5,
          vars: { value: event.value },
          action: () => {
            setActiveNodeValue(null);
            setHighlightedNodes([event.value]);
            if (!targetKept) {
              setRemovingNodeValue(event.value);
            }
          },
        });
      }
    } else if (event.type === 'move') {
      steps.push(moveStep(event, ui, target, event.dir === 'left' ? 3 : 4));
    } else if (event.type === 'two-children') {
      steps.push({
        description: 'Node has two children, finding inorder successor',
        kind: 'compare',
        line: 6,
        vars: { value: event.node },
        action: () => {
          setHighlightedNodes([]);
        },
      });
    } else if (event.type === 'successor-descend') {
      steps.push({
        description: `Inorder successor: go left from ${event.from} to ${event.to}`,
        kind: 'move',
        line: 7,
        vars: { from: event.from, to: event.to },
        action: () => {
          setHighlightedNodes([event.to]);
        },
      });
    } else if (event.type === 'successor-found') {
      steps.push({
        description: `Inorder successor is ${event.value}`,
        kind: 'found',
        line: 7,
        vars: { value: event.value },
        action: () => {
          setHighlightedNodes([event.value]);
        },
      });
    } else if (event.type === 'copy-successor') {
      target = event.to;
      steps.push({
        description: `Replacing ${event.from} with ${event.to}`,
        kind: 'move',
        line: 8,
        vars: { from: event.from, to: event.to },
        action: () => {
          setActiveNodeValue(event.to);
          setHighlightedNodes([event.to]);
        },
      });
      steps.push({
        description: `Now need to delete ${event.to} from right subtree`,
        kind: 'move',
        line: 9,
        vars: { from: event.from, to: event.to },
        action: () => {
          setHighlightedNodes([event.to]);
        },
      });
    } else if (event.type === 'replace') {
      let description;
      if (event.replacement === null) {
        description = 'Node has no children, simply removing it';
      } else if (event.side === 'left') {
        description = `Node has only left child, replacing with left child ${event.replacement}`;
      } else {
        description = `Node has only right child, replacing with right child ${event.replacement}`;
      }
      steps.push({
        description,
        kind: 'move',
        line: event.replacement === null ? 11 : 10,
        vars: { replacement: event.replacement, side: event.side },
        action: event.replacement === null
          ? () => {}
          : () => {
              setHighlightedNodes([event.replacement]);
            },
      });
    } else if (event.type === 'recheck') {
      steps.push(recheckStep(event, ui, 12));
    } else if (event.type === 'rotate') {
      steps.push(rotationStep(event, ui, 12));
    } else if (event.type === 'rotate-skipped') {
      skippedRotation = true;
      steps.push(rotationSkippedStep(event, ui, 12));
    } else if (event.type === 'missing') {
      steps.push({
        description: `${event.value} does not exist in the tree`,
        kind: 'error',
        line: 2,
        vars: { value: event.value },
        action: () => {
          setHighlightedNodes([]);
        },
      });
    }
  }

  steps.push({
    description: skippedRotation
      ? 'Deletion complete — tree left unbalanced (rotations disabled)'
      : 'Deletion complete, tree is balanced',
    kind: 'found',
    line: 13,
    vars: { value },
    action: () => {
      setActiveNodeValue(null);
      setHighlightedNodes([]);
    },
  });

  return steps;
};

export const buildTraversalSteps = (root, type, ui) => {
  const { setActiveNodeValue, setHighlightedNodes, setTraversalResult } = ui;
  const steps = [];
  const visits = [];

  // Per-variant line maps: descend/back share the recursive-call line (or the
  // enqueue lines for level-order), visits point at `visit(node)`.
  const DESCEND_LINES = {
    preOrder: { left: 4, right: 5 },
    inOrder: { left: 3, right: 5 },
    postOrder: { left: 3, right: 4 },
    levelOrder: { left: 6, right: 7 },
  };
  const VISIT_LINES = { preOrder: 3, inOrder: 4, postOrder: 5, levelOrder: 5 };
  const FINAL_LINES = { preOrder: 6, inOrder: 6, postOrder: 6, levelOrder: 8 };

  steps.push({
    description: `Starting ${type} traversal`,
    line: 1,
    vars: { type },
    action: () => {
      setActiveNodeValue(null);
      setHighlightedNodes([]);
      setTraversalResult([]);
    },
  });

  const descend = (parent, child, side) => {
    const description =
      type === 'levelOrder'
        ? `Enqueue ${side} child ${child} of ${parent}`
        : `Moving to ${side} child of ${parent}`;
    steps.push({
      description,
      kind: 'move',
      line: DESCEND_LINES[type][side],
      vars: { parent, child },
      action: () => {
        setHighlightedNodes([child]);
      },
    });
  };

  const back = (node, side) => {
    steps.push({
      description: `Back at ${node} after ${side} subtree`,
      kind: 'move',
      line: DESCEND_LINES[type][side],
      vars: { node, side },
      action: () => {
        setActiveNodeValue(node);
        setHighlightedNodes([node]);
      },
    });
  };

  const visit = (node) => {
    visits.push(node);
    const snapshot = [...visits];
    steps.push({
      description: `Visit node ${node}`,
      kind: 'found',
      line: VISIT_LINES[type],
      vars: { node },
      action: () => {
        setActiveNodeValue(node);
        setHighlightedNodes([node]);
        setTraversalResult(snapshot);
      },
    });
  };

  const walk = (node) => {
    if (!node) return;
    const nodeValue = node.value;

    if (type === 'preOrder') visit(nodeValue);

    if (node.left) {
      descend(nodeValue, node.left.value, 'left');
      walk(node.left);
      back(nodeValue, 'left');
    }

    if (type === 'inOrder') visit(nodeValue);

    if (node.right) {
      descend(nodeValue, node.right.value, 'right');
      walk(node.right);
      back(nodeValue, 'right');
    }

    if (type === 'postOrder') visit(nodeValue);
  };

  const walkLevelOrder = (node) => {
    if (!node) return;
    const queue = [node];
    while (queue.length > 0) {
      const current = queue.shift();
      visit(current.value);
      if (current.left) {
        descend(current.value, current.left.value, 'left');
        queue.push(current.left);
      }
      if (current.right) {
        descend(current.value, current.right.value, 'right');
        queue.push(current.right);
      }
    }
  };

  if (type === 'levelOrder') {
    walkLevelOrder(root);
  } else {
    walk(root);
  }

  steps.push({
    description: `${type} traversal complete`,
    kind: 'found',
    line: FINAL_LINES[type],
    vars: { type },
    action: () => {
      setActiveNodeValue(null);
      setHighlightedNodes([]);
    },
  });

  return steps;
};

export const buildSearchSteps = (root, value, ui) => {
  const { setActiveNodeValue, setHighlightedNodes } = ui;
  const steps = [
    {
      description: `Starting search for value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveNodeValue(null);
        setHighlightedNodes([]);
      },
    },
  ];

  let current = root;
  let found = false;

  while (current) {
    const nodeValue = current.value;
    steps.push({
      description: `Checking node ${nodeValue}`,
      kind: 'compare',
      line: 3,
      vars: { node: nodeValue },
      action: () => {
        setActiveNodeValue(nodeValue);
      },
    });

    if (value === nodeValue) {
      steps.push({
        description: `Found ${value}!`,
        kind: 'found',
        line: 3,
        vars: { value },
        action: () => {
          setHighlightedNodes([nodeValue]);
        },
      });
      found = true;
      break;
    }

    if (value < nodeValue) {
      steps.push({
        description: `${value} < ${nodeValue}, moving to left subtree`,
        kind: 'compare',
        line: 4,
        vars: { value, node: nodeValue },
        action: () => {
          setHighlightedNodes([nodeValue]);
        },
      });
      current = current.left;
    } else {
      steps.push({
        description: `${value} > ${nodeValue}, moving to right subtree`,
        kind: 'compare',
        line: 5,
        vars: { value, node: nodeValue },
        action: () => {
          setHighlightedNodes([nodeValue]);
        },
      });
      current = current.right;
    }
  }

  if (!found) {
    steps.push({
      description: `${value} not found in the tree`,
      kind: 'error',
      line: 6,
      vars: { value },
      action: () => {
        setHighlightedNodes([]);
      },
    });
  }

  return steps;
};
