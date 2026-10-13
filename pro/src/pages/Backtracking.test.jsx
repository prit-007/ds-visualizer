import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Backtracking from './Backtracking';
import { clearRuns, listRuns } from '../lib/timeTravel';

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./Backtracking.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 120; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('Backtracking page', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
    window.location.hash = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
    window.location.hash = '';
  });

  test('renders n-Queens board and solves it', () => {
    render(<Backtracking />);
    expect(screen.getByText('Backtracking Visualizer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run N-Queens' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Run N-Queens' }));
    finishRun();

    expect(listRuns('backtracking')[listRuns('backtracking').length - 1].label).toBe('N-Queens n = 4');
    expect(screen.getAllByText('♛').length).toBe(4);
  });

  test('board size selector changes the grid', () => {
    const { container } = render(<Backtracking />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '5' } });
    expect(container.querySelectorAll('.board-cell').length).toBe(25);
  });

  test('mini sudoku solves the 4x4 grid', () => {
    const { container } = render(<Backtracking />);
    fireEvent.click(screen.getByRole('button', { name: 'Mini Sudoku' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Sudoku' }));
    finishRun();

    expect(listRuns('backtracking')[listRuns('backtracking').length - 1].label).toBe('Mini Sudoku');
    const cells = [...container.querySelectorAll('.board-cell')];
    const filled = cells.filter((c) => c.textContent.trim() !== '');
    expect(filled).toHaveLength(16);
  });

  test('css contract', () => {
    expect(css).toMatch(/\.grid-board\s*\{/);
    expect(css).toMatch(/\.board-cell\.queen/);
    expect(css).toMatch(/\.board-cell\.given/);
    expect(css).toMatch(/\.dark \.backtrack-canvas/);
  });
});
