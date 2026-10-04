// Pure step builders for the B-tree visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks (setActiveNodeKeys / setHighlightedNodeKeys) with
// absolute state so the player can replay steps 0..k when scrubbing.
// `line` is the 1-based line into B_TREE_PSEUDOCODE. Builders consume
// the trace emitted by src/lib/btree.js.

const clearUi = (ui) => {
  ui.setActiveNodeKeys?.(null);
  ui.setHighlightedNodeKeys?.(null);
};

const keysText = (keys) => `[${keys.join(', ')}]`;

export const buildBTreeInsertSteps = (root, value, trace, ui) => {
  const steps = [
    {
      description: `Creating a new key to insert: ${value}`,
      kind: 'move',
      line: 1,
      vars: { value },
      action: () => clearUi(ui),
    },
  ];

  // Empty-root inserts are trace-driven: the builder runs after the tree
  // mutated, so detect the first compare against empty keys.
  const firstCompareEmpty =
    trace && trace[0] && trace[0].type === 'compare' && trace[0].node.length === 0;
  if (firstCompareEmpty || (trace ?? []).some((e) => e.type === 'duplicate')) {
    if (firstCompareEmpty) {
      steps.push({
        description: `Root is empty — ${value} becomes the first key`,
        kind: 'move',
        line: 2,
        vars: { value },
        action: () => {
          ui.setActiveNodeKeys?.([value]);
        },
      });
    }
    (trace ?? []).forEach((event) => {
      if (event.type === 'duplicate') {
        steps.push({
          description: `Key ${event.value} already exists in the B-tree`,
          kind: 'error',
          line: 1,
          vars: { value: event.value },
          action: () => clearUi(ui),
        });
      }
    });
    steps.push({
      description: `B-tree insert complete: ${value}`,
      kind: 'found',
      line: 7,
      vars: { value },
      action: () => clearUi(ui),
    });
    return steps;
  }

  (trace ?? []).forEach((event) => {
    if (event.type === 'compare') {
      steps.push({
        description: `Comparing ${event.value} with node keys ${keysText(event.node)}`,
        kind: 'compare',
        line: 3,
        vars: { value: event.value, keys: [...event.node] },
        action: () => {
          ui.setActiveNodeKeys?.([...event.node]);
        },
      });
    } else if (event.type === 'shift') {
      steps.push({
        description: `Shifting key ${event.key} right to make room`,
        kind: 'move',
        line: 5,
        vars: { key: event.key, from: event.from },
        action: () => {
          ui.setHighlightedNodeKeys?.([...event.node]);
        },
      });
    } else if (event.type === 'descend') {
      steps.push({
        description: `${event.value} routes to child ${event.child} of ${keysText(event.node)}`,
        kind: 'move',
        line: 4,
        vars: { value: event.value, child: event.child, keys: [...event.node] },
        action: () => {
          ui.setActiveNodeKeys?.([...event.node]);
        },
      });
    } else if (event.type === 'insert') {
      const overflow = event.node.length > 2;
      steps.push({
        description: overflow
          ? `Inserting ${event.value} into leaf ${keysText(event.node)} → overflow`
          : `Inserting ${event.value} into leaf ${keysText(event.node)} at position ${event.position}`,
        kind: overflow ? 'error' : 'move',
        line: overflow ? 5 : 5,
        vars: { value: event.value, keys: [...event.node], position: event.position },
        action: () => {
          ui.setActiveNodeKeys?.([...event.node]);
        },
      });
    } else if (event.type === 'split') {
      if (event.rootSplit) return;
      steps.push({
        description: `Splitting ${event.leaf ? 'leaf' : 'node'} ${keysText(event.node)}: median ${event.median} promotes, right ${keysText(event.right)}`,
        kind: 'move',
        line: 6,
        vars: { median: event.median, left: [...event.node], right: [...event.right] },
        action: () => {
          ui.setActiveNodeKeys?.([event.median]);
        },
      });
    } else if (event.type === 'promote') {
      steps.push({
        description: `Parent now holds ${keysText(event.parent)}`,
        kind: 'found',
        line: 6,
        vars: { parent: [...event.parent] },
        action: () => {
          ui.setActiveNodeKeys?.([...event.parent]);
        },
      });
    } else if (event.type === 'duplicate') {
      steps.push({
        description: `Key ${event.value} already exists in the B-tree`,
        kind: 'error',
        line: 1,
        vars: { value: event.value },
        action: () => clearUi(ui),
      });
    }
  });

  steps.push({
    description: `B-tree insert complete: ${value}`,
    kind: 'found',
    line: 7,
    vars: { value },
    action: () => clearUi(ui),
  });

  return steps;
};

export const buildBTreeSearchSteps = (root, value, trace, ui) => {
  const steps = [
    {
      description: `Searching the B-tree for ${value}`,
      kind: 'move',
      line: 1,
      vars: { value },
      action: () => clearUi(ui),
    },
  ];

  (trace ?? []).forEach((event) => {
    if (event.type === 'compare') {
      steps.push({
        description: `Comparing ${event.value} with node keys ${keysText(event.node)}`,
        kind: 'compare',
        line: 3,
        vars: { value: event.value, keys: [...event.node] },
        action: () => {
          ui.setActiveNodeKeys?.([...event.node]);
        },
      });
    } else if (event.type === 'descend') {
      steps.push({
        description: `${event.value} routes to child ${event.child} of ${keysText(event.node)}`,
        kind: 'move',
        line: 4,
        vars: { value: event.value, child: event.child, keys: [...event.node] },
        action: () => {
          ui.setActiveNodeKeys?.([...event.node]);
        },
      });
    } else if (event.type === 'found') {
      steps.push({
        description: `Key ${value} found in node ${keysText(event.node)}`,
        kind: 'found',
        line: 5,
        vars: { value, keys: [...event.node] },
        action: () => {
          ui.setActiveNodeKeys?.([...event.node]);
        },
      });
    } else if (event.type === 'missing') {
      steps.push({
        description: `Key ${value} is not in the B-tree`,
        kind: 'error',
        line: 6,
        vars: { value },
        action: () => clearUi(ui),
      });
    }
  });

  return steps;
};

export const buildBTreeInOrderSteps = (root, ui) => {
  const steps = [
    {
      description: 'Starting in-order traversal of the B-tree',
      kind: 'move',
      line: 1,
      action: () => clearUi(ui),
    },
  ];

  const visits = [];
  const walk = (node) => {
    if (!node) return;
    if (node.leaf) {
      node.keys.forEach((k) => {
        visits.push(k);
        steps.push({
          description: `Visit key ${k}`,
          kind: 'found',
          line: 2,
          vars: { key: k },
          action: () => {
            ui.setActiveNodeKeys?.([k]);
          },
        });
      });
      return;
    }
    node.children.forEach((child, idx) => {
      walk(child);
      if (idx < node.keys.length) {
        visits.push(node.keys[idx]);
        steps.push({
          description: `Visit key ${node.keys[idx]}`,
          kind: 'found',
          line: 2,
          vars: { key: node.keys[idx] },
          action: () => {
            ui.setActiveNodeKeys?.([node.keys[idx]]);
          },
        });
      }
    });
  };

  walk(root);

  steps.push({
    description: `In-order complete: ${visits.join(', ')}`,
    kind: 'found',
    line: 3,
    vars: { order: [...visits] },
    action: () => clearUi(ui),
  });

  return steps;
};
