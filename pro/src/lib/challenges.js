// Adversarial challenge core: pick an insertion order (and rotation mode) so
// a real AVL search walks as many nodes as possible. Scoring runs the actual
// tree code — with `rotations: false` the counterfactual flag turns inserts
// into a degenerate chain, so sorted input reaches the n upper bound; with
// rotations on, balance caps every order at the AVL height. `maxComparisons`
// brute-forces all permutations (inputs are capped at 6 values → ≤720 builds).
import { AVLTree } from './avl';

export const CHALLENGE = {
  id: 'worst-case-search',
  title: 'Make the search as expensive as possible',
  brief:
    'Choose an insertion order so that searching for the target visits as many nodes as it can. Sort the input to build a chain, flip rotations to watch balance cap the cost, and hit the brute-forced maximum to score Perfect.',
  minValues: 2,
  maxValues: 6,
};

export const searchComparisons = ({ values, target, rotations }) => {
  const tree = new AVLTree({ rotations });
  values.forEach((value) => {
    tree.root = tree.insert(tree.root, value);
  });
  const trace = [];
  tree.search(tree.root, target, trace);
  return trace.filter((event) => event.type === 'compare').length;
};

const permutations = (items) => {
  if (items.length <= 1) return [items];
  const result = [];
  items.forEach((item, index) => {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    permutations(rest).forEach((permutation) => result.push([item, ...permutation]));
  });
  return result;
};

export const maxComparisons = (values, target, { rotations }) => {
  let best = 0;
  permutations(values).forEach((order) => {
    const count = searchComparisons({ values: order, target, rotations });
    if (count > best) best = count;
  });
  return best;
};

export const gradeAttempt = (comparisons, max) => {
  if (!max) return 'poor';
  if (comparisons >= max) return 'perfect';
  if (comparisons / max >= 0.75) return 'good';
  return 'poor';
};

const fail = (error) => ({ ok: false, error, challenge: CHALLENGE.id });

export const evaluateChallenge = (input) => {
  const values = Array.isArray(input?.values) ? input.values : null;
  const target = input?.target;
  const rotations = Boolean(input?.rotations);

  if (!values || values.length < CHALLENGE.minValues || values.length > CHALLENGE.maxValues) {
    return fail(
      `Use between ${CHALLENGE.minValues} and ${CHALLENGE.maxValues} unique whole-number values`
    );
  }
  if (!values.every((value) => Number.isInteger(value))) {
    return fail('Values must be whole numbers');
  }
  if (new Set(values).size !== values.length) {
    return fail('Values must be unique');
  }
  if (!Number.isInteger(target)) {
    return fail('Target must be a whole number');
  }

  const comparisons = searchComparisons({ values, target, rotations });
  const max = maxComparisons(values, target, { rotations });
  return {
    ok: true,
    challenge: CHALLENGE.id,
    n: values.length,
    comparisons,
    max,
    grade: gradeAttempt(comparisons, max),
    rotations,
  };
};
