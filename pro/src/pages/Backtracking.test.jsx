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

  test('renders hamiltonian path tab and run button', () => {
    render(<Backtracking />);
    fireEvent.click(screen.getByRole('button', { name: 'Hamiltonian Path' }));
    expect(screen.getByRole('button', { name: 'Run Hamiltonian Path' })).toBeInTheDocument();
  });

  test('renders subset sum tab and run button', () => {
    render(<Backtracking />);
    fireEvent.click(screen.getByRole('button', { name: 'Subset Sum' }));
    expect(screen.getByRole('button', { name: 'Run Subset Sum' })).toBeInTheDocument();
  });

  test('hamiltonian path finds a path visiting every cell once', () => {
    const { container } = render(<Backtracking />);
    fireEvent.click(screen.getByRole('button', { name: 'Hamiltonian Path' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Hamiltonian Path' }));
    finishRun();

    const runs = listRuns('backtracking');
    expect(runs[runs.length - 1].label).toBe('Hamiltonian Path n = 3');
    const lastRun = runs[runs.length - 1];
    expect(lastRun.steps[lastRun.steps.length - 1]).toBe('Hamiltonian path found — 9 cells visited');
    expect(container.querySelectorAll('.board-cell.visited')).toHaveLength(9);
  });

  test('subset sum finds a subset reaching the target', () => {
    const { container } = render(<Backtracking />);
    fireEvent.click(screen.getByRole('button', { name: 'Subset Sum' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Subset Sum' }));
    finishRun();

    const runs = listRuns('backtracking');
    expect(runs[runs.length - 1].label).toBe('Subset Sum target 10');
    const lastRun = runs[runs.length - 1];
    expect(lastRun.steps[lastRun.steps.length - 1]).toBe('Subset found: [3, 5, 2] sums to 10');
    expect(container.querySelectorAll('.subset-chip.taken')).toHaveLength(3);
  });

  test('css contract', () => {
    expect(css).toMatch(/\.grid-board\s*\{/);
    expect(css).toMatch(/\.board-cell\.queen/);
    expect(css).toMatch(/\.board-cell\.given/);
    expect(css).toMatch(/\.dark \.backtrack-canvas/);
  });
});
