// Pure step builders for the array visualizer. Each returns
// [{ description, action, kind?, line, vars? }] where actions call the
// page's ui callbacks. Actions assign absolute state so a step player can
// replay steps 0..k when scrubbing. `line` is the 1-based line in
// ARRAY_PSEUDOCODE for the current tab; `vars` feeds the variable watch.

export const buildAddSteps = (array, value, ui) => {
  const { setActiveElementIndex, setShiftingElements } = ui;
  return [
    {
      description: `Creating a new element with value ${value}`,
      line: 1,
      vars: { value },
      action: () => {
        setActiveElementIndex(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Finding the end of the array (index ${array.length})`,
      kind: 'compare',
      line: 2,
      vars: { n: array.length },
      action: () => {
        setActiveElementIndex(array.length - 1);
      },
    },
    {
      description: 'Adding the element to the end of the array',
      kind: 'move',
      line: 3,
      vars: { value },
      action: () => {},
    },
    {
      description: `Array now has ${array.length + 1} elements`,
      kind: 'found',
      line: 4,
      vars: { length: array.length + 1 },
      action: () => {
        setActiveElementIndex(array.length);
      },
    },
  ];
};

export const buildInsertSteps = (array, value, position, ui) => {
  const { setActiveElementIndex, setShiftingElements } = ui;
  const pos = position;
  const steps = [
    {
      description: `Creating a temporary space for value ${value}`,
      line: 1,
      vars: { value, pos },
      action: () => {
        setActiveElementIndex(null);
        setShiftingElements?.([]);
      },
    },
    {
      description: `Finding insert position (index ${pos})`,
      kind: 'compare',
      line: 2,
      vars: { pos },
      action: () => {
        setActiveElementIndex(pos > 0 ? pos - 1 : 0);
      },
    },
  ];

  for (let i = array.length - 1; i >= pos; i--) {
    steps.push({
      description: `Moving element at index ${i} to index ${i + 1}`,
      kind: 'move',
      line: 4,
      vars: { i },
      action: () => {
        setShiftingElements([i]);
      },
    });
  }

  steps.push(
    {
      description: `Inserting new element at position ${pos}`,
      kind: 'move',
      line: 5,
      vars: { value, pos },
      action: () => {
        setShiftingElements([]);
        setActiveElementIndex(pos);
      },
    },
    {
      description: `Array now has ${array.length + 1} elements`,
      kind: 'found',
      line: 6,
      vars: { length: array.length + 1 },
      action: () => {},
    }
  );

  return steps;
};

export const buildRemoveSteps = (array, position, ui) => {
  const { setActiveElementIndex, setShiftingElements, setRemovingElementIndex } = ui;
  const pos = position;
  const steps = [
    {
      description: `Finding element at position ${pos}`,
      kind: 'compare',
      line: 2,
      vars: { pos },
      action: () => {
        setActiveElementIndex(pos);
        setRemovingElementIndex(null);
        setShiftingElements([]);
      },
    },
    {
      description: `Marking element for removal (value: ${array[pos]})`,
      kind: 'found',
      line: 3,
      vars: { removed: array[pos], pos },
      action: () => {
        setRemovingElementIndex(pos);
      },
    },
  ];

  for (let i = pos + 1; i < array.length; i++) {
    steps.push({
      description: `Moving element at index ${i} to index ${i - 1}`,
      kind: 'move',
      line: 5,
      vars: { i },
      action: () => {
        setShiftingElements([i]);
      },
    });
  }

  steps.push({
    description: `Array now has ${array.length - 1} elements`,
    kind: 'found',
    line: 6,
    vars: { length: array.length - 1 },
    action: () => {
      setActiveElementIndex(null);
      setRemovingElementIndex(null);
      setShiftingElements([]);
    },
  });

  return steps;
};
