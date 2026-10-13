// Pure step builders for the Union-Find visualizer. Each returns
// [{ description, action, kind?, line, vars? }] with absolute state.

const clearUi = (ui) => {
  ui.setActiveValue?.(null);
  ui.setHighlightedValues?.([]);
};

export const buildUfMakeSteps = (value, ui) => [
  {
    description: `Creating a new singleton set for ${value}`,
    kind: 'move',
    line: 1,
    vars: { value },
    action: () => {
      clearUi(ui);
      ui.setActiveValue?.(value);
    },
  },
  {
    description: `Root ${value} — rank 0`,
    kind: 'found',
    line: 2,
    vars: { value, rank: 0 },
    action: () => {
      ui.setActiveValue?.(value);
    },
  },
];

export const buildUfFindSteps = (value, trace, ui) => {
  const steps = [
    {
      description: `Finding the root of ${value}`,
      kind: 'move',
      line: 1,
      vars: { value },
      action: () => clearUi(ui),
    },
  ];

  (trace ?? []).forEach((event) => {
    if (event.type === 'link') {
      steps.push({
        description: `Following parent of ${event.node} → ${event.parent}`,
        kind: 'compare',
        line: 3,
        vars: { node: event.node, parent: event.parent },
        action: () => {
          ui.setActiveValue?.(event.node);
          ui.setHighlightedValues?.([event.parent]);
        },
      });
    } else if (event.type === 'compress') {
      steps.push({
        description: `Compressing path: ${event.node} now points straight to ${event.rep}`,
        kind: 'move',
        line: 4,
        vars: { node: event.node, rep: event.rep },
        action: () => {
          ui.setActiveValue?.(event.rep);
          ui.setHighlightedValues?.([event.node]);
        },
      });
    } else if (event.type === 'found') {
      steps.push({
        description: `Root of ${event.value} is ${event.rep}`,
        kind: 'found',
        line: 5,
        vars: { value: event.value, rep: event.rep },
        action: () => {
          ui.setActiveValue?.(event.rep);
          ui.setHighlightedValues?.([]);
        },
      });
    }
  });

  return steps;
};

export const buildUfUnionSteps = (a, b, trace, ui) => {
  const steps = [
    {
      description: `Union set of ${a} with set of ${b}`,
      kind: 'move',
      line: 1,
      vars: { a, b },
      action: () => clearUi(ui),
    },
  ];

  (trace ?? []).forEach((event) => {
    if (event.type === 'union-start') {
      steps.push({
        description: `Looking up the roots of ${event.a} and ${event.b}`,
        kind: 'compare',
        line: 2,
        vars: { a: event.a, b: event.b },
        action: () => {},
      });
    } else if (event.type === 'link' || event.type === 'compress' || event.type === 'found') {
      // the two find() walks inside union
      if (event.type === 'link') {
        steps.push({
          description: `Following parent of ${event.node} → ${event.parent}`,
          kind: 'compare',
          line: 3,
          vars: { node: event.node, parent: event.parent },
          action: () => {
            ui.setActiveValue?.(event.node);
            ui.setHighlightedValues?.([event.parent]);
          },
        });
      } else if (event.type === 'found') {
        steps.push({
          description: `Root of ${event.value} is ${event.rep}`,
          kind: 'found',
          line: 3,
          vars: { value: event.value, rep: event.rep },
          action: () => {
            ui.setActiveValue?.(event.rep);
          },
        });
      }
    } else if (event.type === 'same') {
      steps.push({
        description: `Already in the same set — root ${event.rep}`,
        kind: 'compare',
        line: 4,
        vars: { rep: event.rep },
        action: () => {
          ui.setActiveValue?.(event.rep);
        },
      });
    } else if (event.type === 'attach') {
      steps.push({
        description: `Attach root ${event.child} under root ${event.parent}`,
        kind: 'move',
        line: 5,
        vars: { parent: event.parent, child: event.child },
        action: () => {
          ui.setActiveValue?.(event.parent);
          ui.setHighlightedValues?.([event.child]);
        },
      });
    } else if (event.type === 'missing') {
      steps.push({
        description: `Cannot union — ${a} or ${b} is not in the sets`,
        kind: 'error',
        line: 1,
        vars: { a, b },
        action: () => clearUi(ui),
      });
    }
  });

  return steps;
};
