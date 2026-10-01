import { buildPredictionQuestion } from './prediction';

const makeSteps = (count) =>
  Array.from({ length: count }, (_, i) => ({ description: `step ${i}`, action: vi.fn() }));

describe('buildPredictionQuestion', () => {
  test('builds a four-option question whose correct answer is the next narration', () => {
    const question = buildPredictionQuestion(makeSteps(6), 1);

    expect(question.prompt).toBe('What happens next?');
    expect(question.options).toHaveLength(4);
    expect(question.options[question.correctIndex]).toBe('step 2');
    expect(new Set(question.options).size).toBe(4);
  });

  test('is deterministic for the same input', () => {
    expect(buildPredictionQuestion(makeSteps(6), 1)).toEqual(
      buildPredictionQuestion(makeSteps(6), 1)
    );
  });

  test('returns null when there is no step ahead', () => {
    expect(buildPredictionQuestion(makeSteps(3), 2)).toBeNull();
    expect(buildPredictionQuestion([], 0)).toBeNull();
    expect(buildPredictionQuestion(makeSteps(3), -1)).toBeNull();
    expect(buildPredictionQuestion(undefined, 0)).toBeNull();
  });

  test('pads with generic distractors when the run is too short', () => {
    const question = buildPredictionQuestion(makeSteps(2), 0);

    expect(question.options).toHaveLength(4);
    expect(question.options[question.correctIndex]).toBe('step 1');
    expect(new Set(question.options).size).toBe(4);
  });

  test('keeps options unique when later steps repeat narration', () => {
    const steps = ['a', 'b', 'a', 'a', 'a'].map((description) => ({
      description,
      action: vi.fn(),
    }));
    const question = buildPredictionQuestion(steps, 0);

    expect(question.options[question.correctIndex]).toBe('b');
    expect(new Set(question.options).size).toBe(question.options.length);
  });

  test('rotates the correct option away from a fixed slot', () => {
    const first = buildPredictionQuestion(makeSteps(6), 0);
    const second = buildPredictionQuestion(makeSteps(6), 1);

    expect(first.correctIndex).not.toBe(second.correctIndex);
  });
});
