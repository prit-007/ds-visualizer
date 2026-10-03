// Live operation counters for the step player: counts step kinds through the
// current step (inclusive) so the chip row reflects everything animated so far.

export const countKinds = (steps, stepIndex) => {
  const counts = { compare: 0, move: 0, found: 0, error: 0, total: 0 };
  if (!Array.isArray(steps)) return counts;
  const limit = Math.min(Math.max(stepIndex + 1, 0), steps.length);
  for (let i = 0; i < limit; i++) {
    const kind = steps[i] && steps[i].kind;
    if (Object.prototype.hasOwnProperty.call(counts, kind)) counts[kind] += 1;
    counts.total += 1;
  }
  return counts;
};
