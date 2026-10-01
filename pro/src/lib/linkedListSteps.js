// Pure step builders for the linked list visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks. Walks are narrated node by node (head check + one
// 'next' hop per step) and actions assign absolute state so a step player
// can replay steps 0..k when scrubbing. `line` is the 1-based line in
// LINKED_LIST_PSEUDOCODE for the current tab; `vars` feeds the watch.

export const buildAddSteps = (nodes, value, ui) => {
  const { setActiveNodeIndex, setActivePointerIndex, setRemovingNodeIndex } = ui;
  const steps = [
    {
      description: `Creating a new node with value ${value}`,
      line: 2,
      vars: { value },
      action: () => {
        setActiveNodeIndex(null);
        setActivePointerIndex(null);
        setRemovingNodeIndex?.(null);
      },
    },
  ];

  if (nodes.length === 0) {
    steps.push({
      description: 'The list is empty, the new node becomes the head',
      kind: 'move',
      line: 4,
      vars: { value },
      action: () => {},
    });
  } else {
    steps.push({
      description: `Checking head node (position 0, value ${nodes[0].value})`,
      kind: 'compare',
      line: 6,
      vars: { head: nodes[0].value },
      action: () => {
        setActiveNodeIndex(0);
      },
    });

    for (let i = 1; i < nodes.length; i++) {
      steps.push({
        description: `Following the 'next' pointer to position ${i} (value ${nodes[i].value})`,
        kind: 'move',
        line: 7,
        vars: { position: i },
        action: () => {
          setActivePointerIndex(i - 1);
          setActiveNodeIndex(i);
        },
      });
    }

    steps.push({
      description: "Updating the 'next' pointer of the last node",
      kind: 'move',
      line: 8,
      vars: { position: nodes.length - 1 },
      action: () => {
        setActivePointerIndex(nodes.length - 1);
      },
    });
  }

  steps.push({
    description: `Linked list now has ${nodes.length + 1} nodes`,
    kind: 'found',
    line: 9,
    vars: { length: nodes.length + 1 },
    action: () => {
      setActiveNodeIndex(null);
      setActivePointerIndex(null);
    },
  });

  return steps;
};

export const buildInsertSteps = (nodes, value, position, ui) => {
  const { setActiveNodeIndex, setActivePointerIndex, setRemovingNodeIndex } = ui;
  const pos = position;
  const steps = [
    {
      description: `Creating a new node with value ${value}`,
      line: 2,
      vars: { value, pos },
      action: () => {
        setActiveNodeIndex(null);
        setActivePointerIndex(null);
        setRemovingNodeIndex?.(null);
      },
    },
  ];

  if (pos === 0) {
    steps.push(
      {
        description: 'This will be the new head of the list',
        line: 3,
        vars: { position: 0 },
        action: () => {
          setActiveNodeIndex(nodes.length > 0 ? 0 : null);
        },
      },
      {
        description: "Setting the 'next' pointer of the new node to current head",
        kind: 'move',
        line: 4,
        vars: { position: 0 },
        action: () => {
          setActivePointerIndex(nodes.length > 0 ? 0 : null);
        },
      },
      {
        description: `Inserting the new node at position 0`,
        kind: 'move',
        line: 5,
        vars: { position: 0 },
        action: () => {
          setActiveNodeIndex(0);
          setActivePointerIndex(null);
        },
      },
      {
        description: `Linked list now has ${nodes.length + 1} nodes`,
        kind: 'found',
        line: 11,
        vars: { length: nodes.length + 1 },
        action: () => {
          setActiveNodeIndex(null);
          setActivePointerIndex(null);
        },
      }
    );
    return steps;
  }

  steps.push({
    description: `Checking head node (position 0, value ${nodes[0].value})`,
    kind: 'compare',
    line: 7,
    vars: { head: nodes[0].value },
    action: () => {
      setActiveNodeIndex(0);
    },
  });

  for (let i = 1; i <= pos - 1; i++) {
    steps.push({
      description: `Following the 'next' pointer to position ${i} (value ${nodes[i].value})`,
      kind: 'move',
      line: 8,
      vars: { position: i },
      action: () => {
        setActivePointerIndex(i - 1);
        setActiveNodeIndex(i);
      },
    });
  }

  steps.push(
    {
      description: `Updating the 'next' pointer of node at position ${pos - 1}`,
      kind: 'move',
      line: 10,
      vars: { position: pos - 1 },
      action: () => {
        setActivePointerIndex(pos - 1);
      },
    },
    {
      description: `Inserting the new node at position ${pos}`,
      kind: 'move',
      line: 10,
      vars: { position: pos },
      action: () => {
        setActiveNodeIndex(pos);
        setActivePointerIndex(null);
      },
    },
    {
      description: `Linked list now has ${nodes.length + 1} nodes`,
      kind: 'found',
      line: 11,
      vars: { length: nodes.length + 1 },
      action: () => {
        setActiveNodeIndex(null);
        setActivePointerIndex(null);
      },
    }
  );

  return steps;
};

export const buildRemoveSteps = (nodes, position, ui) => {
  const { setActiveNodeIndex, setActivePointerIndex, setRemovingNodeIndex } = ui;
  const pos = position;
  const reset = () => {
    setActiveNodeIndex(null);
    setActivePointerIndex(null);
    setRemovingNodeIndex(null);
  };
  const removedValue = nodes[pos]?.value;

  const steps = [
    pos === 0
      ? {
          description: `Starting removal of the head node (value ${nodes[0].value})`,
          line: 1,
          vars: { position: pos, value: removedValue },
          action: reset,
        }
      : {
          description: `Starting removal of the node at position ${pos} (value ${nodes[pos].value})`,
          line: 1,
          vars: { position: pos, value: removedValue },
          action: reset,
        },
  ];

  if (pos === 0) {
    steps.push(
      {
        description: 'Setting head to the second node',
        kind: 'move',
        line: 3,
        vars: { position: 0 },
        action: () => {
          setActiveNodeIndex(nodes.length > 1 ? 1 : null);
        },
      },
      {
        description: `Removing node at position 0 (value: ${nodes[0].value})`,
        kind: 'move',
        line: 4,
        vars: { position: 0, value: nodes[0].value },
        action: () => {
          setActiveNodeIndex(0);
          setRemovingNodeIndex(0);
        },
      },
      {
        description: `Linked list now has ${nodes.length - 1} nodes`,
        kind: 'found',
        line: 10,
        vars: { length: nodes.length - 1 },
        action: reset,
      }
    );
    return steps;
  }

  steps.push({
    description: `Checking head node (position 0, value ${nodes[0].value})`,
    kind: 'compare',
    line: 6,
    vars: { head: nodes[0].value },
    action: () => {
      setActiveNodeIndex(0);
    },
  });

  if (pos - 1 === 0) {
    steps.push({
      description: 'Advancing cur to position 0 (already there)',
      kind: 'move',
      line: 7,
      vars: { position: 0 },
      action: () => {
        setActiveNodeIndex(0);
      },
    });
  }

  for (let i = 1; i <= pos - 1; i++) {
    steps.push({
      description: `Following the 'next' pointer to position ${i} (value ${nodes[i].value})`,
      kind: 'move',
      line: 7,
      vars: { position: i },
      action: () => {
        setActivePointerIndex(i - 1);
        setActiveNodeIndex(i);
      },
    });
  }

  steps.push(
    {
      description: `Updating the 'next' pointer to skip the node at position ${pos}`,
      kind: 'move',
      line: 8,
      vars: { position: pos - 1 },
      action: () => {
        setActivePointerIndex(pos - 1);
      },
    },
    {
      description: `Removing node at position ${pos} (value: ${nodes[pos].value})`,
      kind: 'move',
      line: 9,
      vars: { position: pos, value: nodes[pos].value },
      action: () => {
        setActiveNodeIndex(pos);
        setRemovingNodeIndex(pos);
      },
    },
    {
      description: `Linked list now has ${nodes.length - 1} nodes`,
      kind: 'found',
      line: 10,
      vars: { length: nodes.length - 1 },
      action: reset,
    }
  );

  return steps;
};
