import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Greedy from './Greedy';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({ gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() } }));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./Greedy.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 60; i += 1) {
    act(() => { vi.advanceTimersByTime(1000); });
  }
};

describe('Greedy', () => {
  beforeEach(() => { clearRuns(); vi.useFakeTimers(); window.location.hash = ''; });
  afterEach(() => { vi.useRealTimers(); clearRuns(); window.location.hash = ''; });

  test('renders the learn overview and activity controls', () => {
    render(<Greedy />);
    expect(screen.getByText('Greedy Algorithms Visualizer')).toBeInTheDocument();
    expect(screen.getByText(/Learn · Activity Selection/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule Activities' })).toBeInTheDocument();
  });

  test('activity selection runs and records', () => {
    render(<Greedy />);
    fireEvent.click(screen.getByRole('button', { name: 'Schedule Activities' }));
    finishRun();
    expect(listRuns('greedy')[0].label).toBe('Activity selection');
  });

  test('knapsack tab runs and records the capacity', () => {
    render(<Greedy />);
    fireEvent.click(screen.getByRole('button', { name: 'Fractional Knapsack' }));
    fireEvent.change(screen.getByPlaceholderText('capacity'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fill Knapsack' }));
    finishRun();
    expect(listRuns('greedy')[0].label).toBe('Knapsack capacity 10');
  });

  test('coin tab runs', () => {
    render(<Greedy />);
    fireEvent.click(screen.getByRole('button', { name: 'Greedy Coin Change' }));
    fireEvent.change(screen.getByPlaceholderText('target'), { target: { value: '48' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make Change' }));
    finishRun();
    expect(listRuns('greedy')[0].label).toBe('Greedy coins 48');
  });

  test('css contract', () => {
    expect(css).toMatch(/\.greedy-canvas\s*\{/);
    expect(css).toMatch(/\.activity-bar\s*\{/);
    expect(css).toMatch(/\.dark \.greedy-canvas/);
  });
});
