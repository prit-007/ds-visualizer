import config from '../tailwind.config.js';

describe('tailwind design tokens', () => {
  test('dark mode uses the class strategy', () => {
    expect(config.darkMode).toBe('class');
  });

  test('semantic step colors map to the right families', () => {
    const { colors } = config.theme.extend;
    expect(colors.compare[500]).toBe('#f59e0b'); // amber
    expect(colors.move[500]).toBe('#6366f1'); // indigo
    expect(colors.found[500]).toBe('#22c55e'); // green
    expect(colors.error[500]).toBe('#ef4444'); // red
  });

  test('radius, duration and easing scales exist', () => {
    const { extend } = config.theme;
    expect(extend.borderRadius.panel).toBe('0.75rem');
    expect(extend.borderRadius.control).toBe('0.375rem');
    expect(extend.borderRadius.pill).toBe('9999px');
    expect(extend.transitionDuration.fast).toBe('150');
    expect(extend.transitionDuration.base).toBe('200');
    expect(extend.transitionDuration.slow).toBe('300');
    expect(extend.transitionTimingFunction['soft-out']).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });

  test('content glob still scans only src', () => {
    expect(config.content).toEqual(['./src/**/*.{js,jsx,ts,tsx}']);
  });
});
