import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const moduleUrl = import.meta.url;
const indexCss = readFileSync(fileURLToPath(new URL('./index.css', moduleUrl)), 'utf8');

describe('global accessibility styles', () => {
  test('prefers-reduced-motion neutralizes transitions and animations', () => {
    expect(indexCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(indexCss).toContain('transition-duration: 0.01ms');
    expect(indexCss).toContain('animation-duration: 0.01ms');
  });

  test('keyboard focus gets a visible outline', () => {
    expect(indexCss).toContain(':focus-visible');
    expect(indexCss).toMatch(/:focus-visible\s*\{[^}]*outline:/);
  });

  test('dark mode ships token and surface overrides', () => {
    expect(indexCss).toContain('.dark {');
    expect(indexCss).toContain('--primary-color: #38bdf8');
    expect(indexCss).toContain('.dark body');
    expect(indexCss).toContain('.dark .controls-area');
    expect(indexCss).toContain('.dark .steps-container');
  });
});

describe('mobile media query', () => {
  test('ships responsive rules for paddings, tabs and touch targets', () => {
    expect(indexCss).toMatch(/@media \(max-width: 768px\)/);
    expect(indexCss).toMatch(/\.tab-container\s*\{[^}]*flex-wrap: wrap/);
    expect(indexCss).toMatch(/\.operation-button\s*\{[^}]*min-height: 44px/);
    expect(indexCss).toMatch(/\.input-group input\s*\{[^}]*font-size: 16px/);
  });
});

describe('data-actions toolbar', () => {
  test('styles reset/clear buttons including dark mode', () => {
    expect(indexCss).toMatch(/\.data-actions\s*\{/);
    expect(indexCss).toMatch(/\.data-action-btn\s*\{/);
    expect(indexCss).toMatch(/\.data-action-btn\.danger/);
    expect(indexCss).toMatch(/\.dark \.data-action-btn/);
  });
});
