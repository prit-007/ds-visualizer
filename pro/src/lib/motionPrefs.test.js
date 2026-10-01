import { prefersReducedMotion } from './motionPrefs';

const setMatchMedia = (matches) => {
  const original = window.matchMedia;
  window.matchMedia = vi.fn().mockReturnValue({ matches });
  return () => {
    window.matchMedia = original;
  };
};

describe('prefersReducedMotion', () => {
  test('true when the reduce media query matches', () => {
    const restore = setMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    restore();
  });

  test('false when motion is allowed', () => {
    const restore = setMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
    restore();
  });

  test('false when matchMedia is unavailable', () => {
    const original = window.matchMedia;
    window.matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
    window.matchMedia = original;
  });
});
