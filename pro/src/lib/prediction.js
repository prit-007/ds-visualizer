const FALLBACK_DISTRACTORS = [
  'Nothing changes — the operation finishes without a highlight',
  'The value compares equal and the operation stops here',
  'A node moves one position to restore the balance',
];

export const buildPredictionQuestion = (steps, stepIndex) => {
  if (!Array.isArray(steps) || stepIndex < 0 || stepIndex >= steps.length - 1) return null;

  const correct = steps[stepIndex + 1].description;
  const seen = new Set([correct]);
  const distractors = [];

  const consider = (description) => {
    if (distractors.length >= 3) return;
    if (!description || seen.has(description)) return;
    seen.add(description);
    distractors.push(description);
  };

  for (let i = stepIndex + 2; i < steps.length; i += 1) consider(steps[i].description);
  for (let i = 0; i < steps.length; i += 1) consider(steps[i].description);
  for (let i = 0; i < FALLBACK_DISTRACTORS.length; i += 1) consider(FALLBACK_DISTRACTORS[i]);

  const options = [correct, ...distractors];
  const offset = (stepIndex + 1) % options.length;
  const rotated = [...options.slice(offset), ...options.slice(0, offset)];

  return {
    prompt: 'What happens next?',
    options: rotated,
    correctIndex: rotated.indexOf(correct),
  };
};
