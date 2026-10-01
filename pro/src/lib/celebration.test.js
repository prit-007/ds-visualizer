import { fireCelebration } from './celebration';

const confetti = vi.hoisted(() => vi.fn());

vi.mock('canvas-confetti', () => ({ default: confetti }));

describe('fireCelebration', () => {
  beforeEach(() => {
    confetti.mockClear();
  });

  test('fires a themed confetti burst with a visible particle count', () => {
    fireCelebration();

    expect(confetti).toHaveBeenCalledTimes(1);
    const options = confetti.mock.calls[0][0];
    expect(options.particleCount).toBeGreaterThanOrEqual(100);
    expect(options.origin).toHaveProperty('y');
    expect(options.colors).toContain('#4f46e5');
  });
});
