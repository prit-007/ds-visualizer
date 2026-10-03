// Session-local run history: every operation a page starts is recorded with
// its before/after scenario, narrated steps and derived counters. Diffing two
// runs (e.g. AVL rotations on vs off) compares step narration, counters and
// settings. Pure store — pages re-read it on their own renders.
import { countKinds } from './opCounters';

let nextId = 1;
let runs = [];

const toDescription = (step) =>
  typeof step === 'string' ? step : (step && step.description) || '';

export const recordRun = (run) => {
  const rawSteps = Array.isArray(run.steps) ? run.steps : [];
  const entry = {
    id: nextId,
    at: Date.now(),
    structure: run.structure,
    label: run.label || toDescription(rawSteps[0]) || 'Run',
    before: run.before || [],
    after: run.after === undefined ? null : run.after,
    steps: rawSteps.map(toDescription),
    counters: run.counters || countKinds(rawSteps, rawSteps.length - 1),
    meta: run.meta || null,
  };
  nextId += 1;
  runs = [...runs, entry];
  return entry;
};

export const listRuns = (structure) =>
  structure ? runs.filter((run) => run.structure === structure) : [...runs];

export const clearRuns = () => {
  runs = [];
  nextId = 1;
};

// Longest common step-description prefix + divergent tails, counter deltas
// and scenario/settings equality flags.
export const diffRuns = (a, b) => {
  if (!a || !b) return null;
  const max = Math.min(a.steps.length, b.steps.length);
  let commonPrefix = 0;
  while (commonPrefix < max && a.steps[commonPrefix] === b.steps[commonPrefix]) {
    commonPrefix += 1;
  }
  const zero = { compare: 0, move: 0, found: 0, error: 0, total: 0 };
  const countersA = a.counters || zero;
  const countersB = b.counters || zero;
  const delta = (key) => countersB[key] - countersA[key];

  return {
    commonPrefix,
    onlyA: a.steps.slice(commonPrefix),
    onlyB: b.steps.slice(commonPrefix),
    countersDelta: {
      compare: delta('compare'),
      move: delta('move'),
      found: delta('found'),
      error: delta('error'),
      total: delta('total'),
    },
    beforeEqual: JSON.stringify(a.before) === JSON.stringify(b.before),
    afterEqual: JSON.stringify(a.after) === JSON.stringify(b.after),
    metaEqual: JSON.stringify(a.meta) === JSON.stringify(b.meta),
  };
};
