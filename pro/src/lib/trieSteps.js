// Pure step builders for trie operations. They drive the core to mutate a
// real Trie and narrate the trace into absolute-state steps.
export const buildInsertSteps = (trie, word, ui) => {
  const trace = [];
  trie.insert(word, trace);
  const steps = [];

  steps.push({
    description: `Inserting "${word}" into the trie`,
    kind: "move",
    line: 1,
    vars: { word },
    action: () => {
      ui.setActiveNode?.("root");
      ui.setHighlightedChars?.([]);
      ui.setNodeStates?.({});
    },
  });

  trace.forEach((ev) => {
    if (ev.type === "existing") {
      steps.push({
        description: `Following existing child ${ev.char}`,
        kind: "compare",
        line: 6,
        vars: { char: ev.char, depth: ev.depth + 1 },
        action: () => {
          ui.setActiveNode?.(ev.char);
          ui.setHighlightedChars?.([...Array(ev.depth + 1).keys()]);
        },
      });
    } else if (ev.type === "new-node") {
      steps.push({
        description: `Creating node for "${ev.char}"`,
        kind: "move",
        line: 8,
        vars: { char: ev.char, depth: ev.depth + 1 },
        action: () => {
          ui.setActiveNode?.(ev.char);
          ui.setHighlightedChars?.([...Array(ev.depth + 1).keys()]);
        },
      });
    } else if (ev.type === "end") {
      steps.push({
        description: `"${word}" is now a complete word`,
        kind: "found",
        line: 9,
        vars: { word },
        action: () => {
          ui.setActiveNode?.(null);
          ui.setHighlightedChars?.([]);
        },
      });
    }
  });

  return steps;
};

export const buildSearchSteps = (trie, word, ui) => {
  const steps = [];

  steps.push({
    description: `Searching for "${word}"`,
    kind: "move",
    line: 1,
    vars: { word },
    action: () => {
      ui.setActiveNode?.("root");
      ui.setHighlightedChars?.([]);
    },
  });

  let node = trie.root;
  for (let i = 0; i < word.length; i += 1) {
    const c = word[i];
    steps.push({
      description: `Comparing letter ${c}`,
      kind: "compare",
      line: 4,
      vars: { char: c, depth: i + 1 },
      action: () => {
        ui.setActiveNode?.(c);
        ui.setHighlightedChars?.([...Array(i + 1).keys()]);
      },
    });
    if (!node.children[c]) {
      steps.push({
        description: `No child "${c}" — "${word}" is not in the trie`,
        kind: "error",
        line: 5,
        vars: { char: c },
        action: () => {
          ui.setActiveNode?.(null);
        },
      });
      return steps;
    }
    node = node.children[c];
  }

  if (!node.isEnd) {
    steps.push({
      description: `"${word}" is only a prefix, not a word`,
      kind: "error",
      line: 7,
      vars: { word },
      action: () => {
        ui.setActiveNode?.(null);
      },
    });
    return steps;
  }

  steps.push({
    description: `Found "${word}"`,
    kind: "found",
    line: 7,
    vars: { word },
    action: () => {
      ui.setHighlightedChars?.([...Array(word.length).keys()]);
    },
  });
  return steps;
};

export const buildDeleteSteps = (trie, word, ui) => {
  const trace = [];
  const ok = trie.delete(word, trace);
  const steps = [];

  steps.push({
    description: `Deleting "${word}"`,
    kind: "move",
    line: 1,
    vars: { word },
    action: () => {
      ui.setActiveNode?.("root");
      ui.setHighlightedChars?.([]);
    },
  });

  if (!ok) {
    steps.push({
      description: `"${word}" is not a word in the trie`,
      kind: "error",
      line: 5,
      vars: { word },
      action: () => {
        ui.setActiveNode?.(null);
        ui.setNodeStates?.({});
      },
    });
    return steps;
  }

  trace.forEach((ev) => {
    if (ev.type === "descend") {
      steps.push({
        description: `Descending through ${ev.char}`,
        kind: "compare",
        line: 2,
        vars: { char: ev.char, depth: ev.depth + 1 },
        action: () => {
          ui.setActiveNode?.(ev.char);
          ui.setHighlightedChars?.([...Array(ev.depth + 1).keys()]);
        },
      });
    } else if (ev.type === "unlink") {
      steps.push({
        description: `Unmarking "${word}" as a word end`,
        kind: "move",
        line: 3,
        vars: { word },
        action: () => {
          ui.setActiveNode?.(null);
        },
      });
    } else if (ev.type === "prune") {
      steps.push({
        description: `Pruning node "${ev.char}" — no children, not a word`,
        kind: "move",
        line: 4,
        vars: { char: ev.char, depth: ev.depth },
        action: () => {
          ui.setNodeStates?.({ pruned: ev.char });
        },
      });
    }
  });

  steps.push({
    description: `"${word}" deleted — shared prefixes preserved`,
    kind: "found",
    line: 5,
    vars: { word },
    action: () => {
      ui.setActiveNode?.(null);
      ui.setNodeStates?.({});
    },
  });

  return steps;
};

export const buildListSteps = (trie, ui) => {
  const steps = [];
  const found = [];
  const dfs = (node, built) => {
    if (node.isEnd) {
      found.push(built);
      steps.push({
        description: `Found word "${built}"`,
        kind: "found",
        line: 3,
        vars: { word: built },
        action: () => {
          ui.setActiveNode?.(null);
          ui.setHighlightedChars?.([]);
        },
      });
    }
    Object.keys(node.children)
      .sort()
      .forEach((c) => dfs(node.children[c], built + c));
  };

  steps.push({
    description: "Listing all words depth-first (alphabetical order)",
    kind: "move",
    line: 1,
    vars: {},
    action: () => {
      ui.setActiveNode?.("root");
    },
  });
  dfs(trie.root, "");

  if (found.length === 0) {
    steps.push({
      description: "Trie is empty — no words to list",
      kind: "error",
      line: 5,
      vars: {},
      action: () => {
        ui.setNodeStates?.({});
      },
    });
    return steps;
  }

  steps.push({
    description: `Words in trie (alphabetical): ${found.join(", ")}`,
    kind: "found",
    line: 5,
    vars: { words: found },
    action: () => {
      ui.setActiveNode?.(null);
    },
  });
  return steps;
};
