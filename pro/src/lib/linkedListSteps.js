// Pure step builders for the linked list visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks. Walks are narrated node by node (head check + one
// 'next' hop per step) and actions assign absolute state so a step player
// can replay steps 0..k when scrubbing. `line` is the 1-based line in the
// type's listing (LINKED_LIST_PSEUDOCODE / _DOUBLY_ / _CIRCULAR_);
// `vars` feeds the watch. `type` is 'singly' (default) | 'doubly' |
// 'circular' — singly steps are byte-identical to the original contract.

export const buildAddSteps = (nodes, value, ui, type = 'singly') => {
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
    if (type === 'circular') {
      steps.push({
        description: "Closing the loop: the new node's 'next' points to itself",
        kind: 'move',
        line: 5,
        vars: { value },
        action: () => {},
      });
    }
    if (type === 'doubly') {
      steps.push({
        description: "The new node's 'prev' pointer is null",
        kind: 'move',
        line: 4,
        vars: { value },
        action: () => {},
      });
    }
  } else {
    const tailIndex = nodes.length - 1;
    const walkLines = type === 'circular' ? 7 : 6;
    const hopLine = type === 'circular' ? 8 : 7;
    steps.push({
      description: `Checking head node (position 0, value ${nodes[0].value})`,
      kind: 'compare',
      line: walkLines,
      vars: { head: nodes[0].value },
      action: () => {
        setActiveNodeIndex(0);
      },
    });

    const lastHop = type === 'circular' ? tailIndex : tailIndex;
    for (let i = 1; i <= lastHop; i++) {
      steps.push({
        description: `Following the 'next' pointer to position ${i} (value ${nodes[i].value})`,
        kind: 'move',
        line: hopLine,
        vars: { position: i },
        action: () => {
          setActivePointerIndex(i - 1);
          setActiveNodeIndex(i);
        },
      });
    }

    if (type === 'doubly') {
      steps.push({
        description: `Setting the 'prev' pointer of the new tail to the old tail (value ${nodes[tailIndex].value})`,
        kind: 'move',
        line: 8,
        vars: { position: nodes.length },
        action: () => {
          setActivePointerIndex(tailIndex);
        },
      });
      steps.push({
        description: "Updating the 'next' pointer of the last node",
        kind: 'move',
        line: 9,
        vars: { position: tailIndex },
        action: () => {
          setActivePointerIndex(tailIndex);
        },
      });
    } else if (type === 'circular') {
      steps.push({
        description: `Closing the loop: the new node's 'next' points back to the head (value ${nodes[0].value})`,
        kind: 'move',
        line: 9,
        vars: { head: nodes[0].value },
        action: () => {},
      });
      steps.push({
        description: "Updating the 'next' pointer of the last node",
        kind: 'move',
        line: 10,
        vars: { position: tailIndex },
        action: () => {
          setActivePointerIndex(tailIndex);
        },
      });
    } else {
      steps.push({
        description: "Updating the 'next' pointer of the last node",
        kind: 'move',
        line: 8,
        vars: { position: tailIndex },
        action: () => {
          setActivePointerIndex(tailIndex);
        },
      });
    }
  }

  const sizeLine =
    type === 'doubly' ? 10 : type === 'circular' ? 11 : 9;
  steps.push({
    description: `Linked list now has ${nodes.length + 1} nodes`,
    kind: 'found',
    line: sizeLine,
    vars: { length: nodes.length + 1 },
    action: () => {
      setActiveNodeIndex(null);
      setActivePointerIndex(null);
    },
  });

  return steps;
};

export const buildInsertSteps = (nodes, value, position, ui, type = 'singly') => {
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

  const doubly = type === 'doubly';
  const circular = type === 'circular';

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
      }
    );
    if (doubly) {
      steps.push({
        description: "The new head's 'prev' pointer is null",
        kind: 'move',
        line: 5,
        vars: { position: 0 },
        action: () => {},
      });
      steps.push({
        description: `Inserting the new node at position 0`,
        kind: 'move',
        line: 6,
        vars: { position: 0 },
        action: () => {
          setActiveNodeIndex(0);
          setActivePointerIndex(null);
        },
      });
    } else if (circular) {
      if (nodes.length === 0) {
        steps.push({
          description: "Closing the loop: the new node's 'next' points to itself",
          kind: 'move',
          line: 5,
          vars: { value },
          action: () => {},
        });
      } else {
        steps.push({
          description: `Finding the tail to keep the loop closed`,
          kind: 'compare',
          line: 6,
          vars: { head: nodes[0].value },
          action: () => {
            setActiveNodeIndex(nodes.length - 1);
          },
        });
        steps.push({
          description: `Updating the tail's 'next' to point at the new head`,
          kind: 'move',
          line: 7,
          vars: { position: nodes.length - 1 },
          action: () => {
            setActivePointerIndex(nodes.length - 1);
          },
        });
        steps.push({
          description: `Inserting the new node at position 0`,
          kind: 'move',
          line: 8,
          vars: { position: 0 },
          action: () => {
            setActiveNodeIndex(0);
            setActivePointerIndex(null);
          },
        });
      }
    } else {
      steps.push({
        description: `Inserting the new node at position 0`,
        kind: 'move',
        line: 5,
        vars: { position: 0 },
        action: () => {
          setActiveNodeIndex(0);
          setActivePointerIndex(null);
        },
      });
    }
    const sizeLine = doubly ? 14 : circular ? 14 : 11;
    steps.push({
      description: `Linked list now has ${nodes.length + 1} nodes`,
      kind: 'found',
      line: sizeLine,
      vars: { length: nodes.length + 1 },
      action: () => {
        setActiveNodeIndex(null);
        setActivePointerIndex(null);
      },
    });
    return steps;
  }

  const checkLine = doubly ? 8 : circular ? 10 : 7;
  const hopLine = doubly ? 9 : circular ? 11 : 8;
  steps.push({
    description: `Checking head node (position 0, value ${nodes[0].value})`,
    kind: 'compare',
    line: checkLine,
    vars: { head: nodes[0].value },
    action: () => {
      setActiveNodeIndex(0);
    },
  });

  for (let i = 1; i <= pos - 1; i++) {
    steps.push({
      description: `Following the 'next' pointer to position ${i} (value ${nodes[i].value})`,
      kind: 'move',
      line: hopLine,
      vars: { position: i },
      action: () => {
        setActivePointerIndex(i - 1);
        setActiveNodeIndex(i);
      },
    });
  }

  if (doubly) {
    steps.push(
      {
        description: `Setting the 'prev' pointer of the new node to node at position ${pos - 1}`,
        kind: 'move',
        line: 10,
        vars: { position: pos - 1 },
        action: () => {
          setActiveNodeIndex(pos - 1);
        },
      },
      {
        description: `Updating the 'next' pointer of node at position ${pos - 1}`,
        kind: 'move',
        line: 12,
        vars: { position: pos - 1 },
        action: () => {
          setActivePointerIndex(pos - 1);
        },
      },
      {
        description: `Inserting the new node at position ${pos}`,
        kind: 'move',
        line: 12,
        vars: { position: pos },
        action: () => {
          setActiveNodeIndex(pos);
          setActivePointerIndex(null);
        },
      }
    );
    if (pos < nodes.length) {
      steps.push({
        description: `Setting the 'prev' pointer of the node after the insertion point (position ${pos + 1}) to the new node`,
        kind: 'move',
        line: 13,
        vars: { position: pos + 1 },
        action: () => {
          setActiveNodeIndex(pos + 1);
        },
      });
    }
    steps.push({
      description: `Linked list now has ${nodes.length + 1} nodes`,
      kind: 'found',
      line: 14,
      vars: { length: nodes.length + 1 },
      action: () => {
        setActiveNodeIndex(null);
        setActivePointerIndex(null);
      },
    });
    return steps;
  }

  if (circular) {
    steps.push(
      {
        description: `Updating the 'next' pointer of node at position ${pos - 1}`,
        kind: 'move',
        line: 13,
        vars: { position: pos - 1 },
        action: () => {
          setActivePointerIndex(pos - 1);
        },
      },
      {
        description: `Inserting the new node at position ${pos}`,
        kind: 'move',
        line: 13,
        vars: { position: pos },
        action: () => {
          setActiveNodeIndex(pos);
          setActivePointerIndex(null);
        },
      },
      {
        description: "The loop stays closed — the tail still points to the head",
        kind: 'move',
        line: 14,
        vars: { position: nodes.length },
        action: () => {},
      },
      {
        description: `Linked list now has ${nodes.length + 1} nodes`,
        kind: 'found',
        line: 14,
        vars: { length: nodes.length + 1 },
        action: () => {
          setActiveNodeIndex(null);
          setActivePointerIndex(null);
        },
      }
    );
    return steps;
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

export const buildRemoveSteps = (nodes, position, ui, type = 'singly') => {
  const { setActiveNodeIndex, setActivePointerIndex, setRemovingNodeIndex } = ui;
  const pos = position;
  const reset = () => {
    setActiveNodeIndex(null);
    setActivePointerIndex(null);
    setRemovingNodeIndex(null);
  };
  const removedValue = nodes[pos]?.value;
  const doubly = type === 'doubly';
  const circular = type === 'circular';

  const startLine =
    pos === 0
      ? doubly
        ? 2
        : circular
          ? 3
          : 1
      : doubly
        ? 6
        : circular
          ? 9
          : 1;
  const steps = [
    pos === 0
      ? {
          description: `Starting removal of the head node (value ${nodes[0].value})`,
          line: startLine,
          vars: { position: pos, value: removedValue },
          action: reset,
        }
      : {
          description: `Starting removal of the node at position ${pos} (value ${nodes[pos].value})`,
          line: startLine,
          vars: { position: pos, value: removedValue },
          action: reset,
        },
  ];

  if (pos === 0) {
    steps.push({
      description: 'Setting head to the second node',
      kind: 'move',
      line: doubly ? 3 : circular ? 6 : 3,
      vars: { position: 0 },
      action: () => {
        setActiveNodeIndex(nodes.length > 1 ? 1 : null);
      },
    });

    if (doubly) {
      steps.push({
        description: "The new head's 'prev' pointer is null",
        kind: 'move',
        line: 4,
        vars: { position: 0 },
        action: () => {},
      });
      steps.push({
        description: `Removing node at position 0 (value: ${nodes[0].value})`,
        kind: 'move',
        line: 5,
        vars: { position: 0, value: nodes[0].value },
        action: () => {
          setActiveNodeIndex(0);
          setRemovingNodeIndex(0);
        },
      });
      steps.push({
        description: `Linked list now has ${nodes.length - 1} nodes`,
        kind: 'found',
        line: 13,
        vars: { length: nodes.length - 1 },
        action: reset,
      });
      return steps;
    }

    if (circular) {
      if (nodes.length === 1) {
        steps.push({
          description: 'The list becomes empty — the circular loop is removed',
          kind: 'move',
          line: 7,
          vars: { position: 0 },
          action: () => {},
        });
      } else {
        steps.push({
          description: "The tail's 'next' now points to the new head — the loop stays closed",
          kind: 'move',
          line: 7,
          vars: { head: nodes[1].value },
          action: () => {
            setActiveNodeIndex(nodes.length - 1);
          },
        });
      }
      steps.push({
        description: `Removing node at position 0 (value: ${nodes[0].value})`,
        kind: 'move',
        line: 8,
        vars: { position: 0, value: nodes[0].value },
        action: () => {
          setActiveNodeIndex(0);
          setRemovingNodeIndex(0);
        },
      });
      steps.push({
        description: `Linked list now has ${nodes.length - 1} nodes`,
        kind: 'found',
        line: 14,
        vars: { length: nodes.length - 1 },
        action: reset,
      });
      return steps;
    }

    steps.push({
      description: `Removing node at position 0 (value: ${nodes[0].value})`,
      kind: 'move',
      line: 4,
      vars: { position: 0, value: nodes[0].value },
      action: () => {
        setActiveNodeIndex(0);
        setRemovingNodeIndex(0);
      },
    });
    steps.push({
      description: `Linked list now has ${nodes.length - 1} nodes`,
      kind: 'found',
      line: 10,
      vars: { length: nodes.length - 1 },
      action: reset,
    });
    return steps;
  }

  const checkLine = doubly ? 7 : circular ? 10 : 6;
  const hopLine = doubly ? 8 : circular ? 11 : 7;
  steps.push({
    description: `Checking head node (position 0, value ${nodes[0].value})`,
    kind: 'compare',
    line: checkLine,
    vars: { head: nodes[0].value },
    action: () => {
      setActiveNodeIndex(0);
    },
  });

  if (pos - 1 === 0) {
    steps.push({
      description: 'Advancing cur to position 0 (already there)',
      kind: 'move',
      line: hopLine,
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
      line: hopLine,
      vars: { position: i },
      action: () => {
        setActivePointerIndex(i - 1);
        setActiveNodeIndex(i);
      },
    });
  }

  if (doubly) {
    steps.push(
      {
        description: `Updating the 'next' pointer to skip the node at position ${pos}`,
        kind: 'move',
        line: 10,
        vars: { position: pos - 1 },
        action: () => {
          setActivePointerIndex(pos - 1);
        },
      }
    );
    if (pos < nodes.length - 1) {
      steps.push({
        description: `Relinking the 'prev' pointer of the next node to node at position ${pos - 1}`,
        kind: 'move',
        line: 11,
        vars: { position: pos + 1 },
        action: () => {
          setActiveNodeIndex(pos + 1);
        },
      });
    }
    steps.push(
      {
        description: `Removing node at position ${pos} (value: ${nodes[pos].value})`,
        kind: 'move',
        line: 12,
        vars: { position: pos, value: nodes[pos].value },
        action: () => {
          setActiveNodeIndex(pos);
          setRemovingNodeIndex(pos);
        },
      },
      {
        description: `Linked list now has ${nodes.length - 1} nodes`,
        kind: 'found',
        line: 13,
        vars: { length: nodes.length - 1 },
        action: reset,
      }
    );
    return steps;
  }

  if (circular) {
    steps.push({
      description: `Updating the 'next' pointer to skip the node at position ${pos}`,
      kind: 'move',
      line: 12,
      vars: { position: pos - 1 },
      action: () => {
        setActivePointerIndex(pos - 1);
      },
    });
    steps.push({
      description: "The loop stays closed — the tail still points to the head",
      kind: 'move',
      line: 12,
      vars: { position: nodes.length - 1 },
      action: () => {},
    });
    steps.push(
      {
        description: `Removing node at position ${pos} (value: ${nodes[pos].value})`,
        kind: 'move',
        line: 13,
        vars: { position: pos, value: nodes[pos].value },
        action: () => {
          setActiveNodeIndex(pos);
          setRemovingNodeIndex(pos);
        },
      },
      {
        description: `Linked list now has ${nodes.length - 1} nodes`,
        kind: 'found',
        line: 14,
        vars: { length: nodes.length - 1 },
        action: reset,
      }
    );
    return steps;
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
