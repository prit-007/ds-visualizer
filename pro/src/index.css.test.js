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

describe('dark mode coverage sweep', () => {
  test('primary interactive surfaces ship dark variants', () => {
    expect(indexCss).toMatch(/\.dark \.operation-button/);
    expect(indexCss).toMatch(/\.dark \.tab-container/);
    expect(indexCss).toMatch(/\.dark \.op-counters/);
    expect(indexCss).toMatch(/\.dark \.error-message/);
    expect(indexCss).toMatch(/\.dark \.memory-address/);
    expect(indexCss).toMatch(/\.dark \.info-panel/);
  });

  test('design tokens flip in dark mode', () => {
    expect(indexCss).toMatch(/\.dark\s*\{[^}]*--surface-color:\s*#1e293b/);
    expect(indexCss).toMatch(/\.dark\s*\{[^}]*--primary-color:\s*#38bdf8/);
  });
});

describe('player containment + responsive contracts', () => {
  test('the seeker cannot escape its container', () => {
    expect(indexCss).toMatch(/\.operation-visualizer\s*\{[^}]*overflow-x: hidden/);
    expect(indexCss).toMatch(/\.operation-visualizer\s*\{[^}]*min-width: 0/);
    expect(indexCss).toMatch(/\.player-scrub\s*\{[^}]*min-width: 0/);
    expect(indexCss).toMatch(/\.player-controls\s*\{[^}]*flex-wrap: wrap/);
  });

  test('the visualizer grid stacks on tablets (<=1024px)', () => {
    const tablet = indexCss.slice(indexCss.indexOf('@media (max-width: 1024px)'));
    expect(tablet).toMatch(/\.visualizer-grid\s*\{[^}]*grid-template-columns: 1fr/);
  });

  test('mobile rules shrink the array canvas and stack the player rows', () => {
    const mobile = indexCss.slice(indexCss.indexOf('@media (max-width: 768px)'));
    expect(mobile).toMatch(/\.player-scrub\s*\{[^}]*flex: 1 1 100%/);
    expect(mobile).toMatch(/\.array-element\s*\{[^}]*width: 52px/);
    expect(mobile).toMatch(/\.array-bracket\s*\{[^}]*font-size: 3rem/);
    expect(mobile).toMatch(/\.code-pane\s*\{[^}]*max-height: 220px/);
  });
});

describe('dark theme tokens', () => {
  test('cohesive dark palette tokens exist and surfaces use them', () => {
    expect(indexCss).toMatch(/\.dark\s*\{[^}]*--panel-color:\s*#0f172a/);
    expect(indexCss).toMatch(/\.dark\s*\{[^}]*--input-bg:\s*#1e293b/);
    expect(indexCss).toMatch(/\.dark\s*\{[^}]*--muted-color:\s*#94a3b8/);
    expect(indexCss).toMatch(/\.dark \.visualization-area[^}]*var\(--panel-color\)/);
    expect(indexCss).toMatch(/\.dark \.input-group input[^}]*var\(--input-bg\)/);
    expect(indexCss).toMatch(/\.dark \.steps-container[^}]*var\(--panel-color\)/);
  });
});

describe('typography + micro-interactions polish', () => {
  test('font tokens exist and surfaces use them', () => {
    expect(indexCss).toMatch(/--font-sans:\s*'Inter'/);
    expect(indexCss).toMatch(/--font-mono:\s*'SF Mono'/);
    expect(indexCss).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/);
    expect(indexCss).toMatch(/code\s*\{[^}]*font-family:\s*var\(--font-mono\)/);
    expect(indexCss).toMatch(/\.code-pane\s*\{[^}]*font-family:\s*var\(--font-mono\)/);
    expect(indexCss).toMatch(/\.memory-address\s*\{[^}]*font-family:\s*var\(--font-mono\)/);
  });

  test('press feedback scales on primary controls', () => {
    expect(indexCss).toMatch(/\.operation-button:active[^}]*scale\(0\.98\)/);
    expect(indexCss).toMatch(/\.player-btn:active[^}]*scale\(0\.94\)/);
    expect(indexCss).toMatch(/\.preset-button:active[^}]*scale\(0\.96\)/);
    expect(indexCss).toMatch(/\.data-action-btn:active[^}]*scale\(0\.96\)/);
    expect(indexCss).toMatch(/\.tab-button:active[^}]*scale\(0\.97\)/);
  });

  test('panels share radius and animate shadows', () => {
    expect(indexCss).toMatch(/\.visualization-area\s*\{[^}]*border-radius: 1rem/);
    expect(indexCss).toMatch(/\.controls-area\s*\{[^}]*border-radius: 1rem/);
    expect(indexCss).toMatch(/\.info-panel\s*\{[^}]*border-radius: 1rem/);
    expect(indexCss).toMatch(/\.visualization-area\s*\{[^}]*transition:[^}]*box-shadow/);
  });

  test('the active step chip pulses, guarded by reduced motion', () => {
    expect(indexCss).toMatch(/@keyframes step-chip-pulse/);
    expect(indexCss).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
    expect(indexCss).toMatch(/\.current-step \.step-chip[^}]*step-chip-pulse/);
  });
});
