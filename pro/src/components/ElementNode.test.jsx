import { render } from '@testing-library/react';
import { gsap } from 'gsap';
import ElementNode from './ElementNode';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const setMatchMedia = (matches) => {
  const original = window.matchMedia;
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  return () => {
    window.matchMedia = original;
  };
};

describe('ElementNode reduced motion', () => {
  beforeEach(() => {
    gsap.to.mockClear();
    gsap.set.mockClear();
  });

  test('jumps to the end state instead of tweening under reduced motion', () => {
    const restore = setMatchMedia(true);
    render(<ElementNode value={42} index={0} isActive />);

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(gsap.set).toHaveBeenCalled();
    expect(gsap.to).not.toHaveBeenCalled();
    restore();
  });

  test('tweens normally when motion is allowed', () => {
    const restore = setMatchMedia(false);
    render(<ElementNode value={42} index={0} isActive />);

    expect(gsap.to).toHaveBeenCalled();
    expect(gsap.set).not.toHaveBeenCalled();
    restore();
  });
});
