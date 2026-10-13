import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DynamicProgramming from './DynamicProgramming';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({ gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() } }));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./DynamicProgramming.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 60; i += 1) {
    act(() => { vi.advanceTimersByTime(1000); });
  }
};

describe('DynamicProgramming', () => {
  beforeEach(() => { clearRuns(); vi.useFakeTimers(); window.location.hash = ''; });
  afterEach(() => { vi.useRealTimers(); clearRuns(); window.location.hash = ''; });

  test('renders the learn overview and fibonacci controls', () => {
    render(<DynamicProgramming />);
    expect(screen.getByText('Dynamic Programming Visualizer')).toBeInTheDocument();
    expect(screen.getByText(/Learn · Fibonacci/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Fibonacci' })).toBeInTheDocument();
  });

  test('running fibonacci fills the memo chips and records the run', () => {
    render(<DynamicProgramming />);
    fireEvent.change(screen.getByPlaceholderText('n'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run Fibonacci' }));
    finishRun();

    expect(listRuns('dynamic-programming')[0].label).toBe('Fibonacci(5)');
    const chips = [...document.querySelectorAll('.dp-chip')].map((c) => c.textContent);
    expect(chips.some((c) => c.includes('5'))).toBe(true);
  });

  test('grid tab counts paths on a 2x2 grid', () => {
    render(<DynamicProgramming />);
    fireEvent.click(screen.getByRole('button', { name: 'Grid Paths' }));
    fireEvent.change(screen.getByPlaceholderText('rows'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('cols'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Count Paths' }));
    finishRun();

    expect(listRuns('dynamic-programming')[0].label).toBe('Grid paths 2×2');
  });

  test('coin change tab records the run', () => {
    render(<DynamicProgramming />);
    fireEvent.click(screen.getByRole('button', { name: 'Coin Change' }));
    fireEvent.change(screen.getByPlaceholderText('target'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run Coin Change' }));
    finishRun();

    expect(listRuns('dynamic-programming')[0].label).toBe('Coin change 6');
  });

  test('css contract', () => {
    expect(css).toMatch(/\.dp-canvas\s*\{/);
    expect(css).toMatch(/\.dp-chip\s*\{/);
    expect(css).toMatch(/\.dp-grid-cell\s*\{/);
    expect(css).toMatch(/\.dark \.dp-chip/);
  });
});
