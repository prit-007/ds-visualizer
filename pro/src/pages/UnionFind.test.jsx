import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import UnionFindPage from './UnionFind';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({ gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() } }));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./UnionFind.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 40; i += 1) {
    act(() => { vi.advanceTimersByTime(1000); });
  }
};

describe('UnionFind visualizer', () => {
  beforeEach(() => { clearRuns(); vi.useFakeTimers(); window.location.hash = ''; });
  afterEach(() => { vi.useRealTimers(); clearRuns(); window.location.hash = ''; });

  test('renders the seeded forest and add-set controls', () => {
    const { container } = render(<UnionFindPage />);
    expect(screen.getByText('Union-Find Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.uf-node')).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Add Set' })).toBeInTheDocument();
  });

  test('adding a set grows the forest and records the run', () => {
    render(<UnionFindPage />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make Set' }));
    finishRun();

    const runs = listRuns('union-find');
    expect(runs[runs.length - 1].label).toBe('Add set 9');
    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
  });

  test('union attaches sets together', () => {
    render(<UnionFindPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Union' }));
    fireEvent.change(screen.getByPlaceholderText('Set A'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('Set B'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Union Nodes' }));
    finishRun();

    const runs = listRuns('union-find');
    expect(runs[runs.length - 1].label).toBe('Union 5 — 6');
  });

  test('find compresses the path and reports the root', () => {
    render(<UnionFindPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find Root' }));
    finishRun();

    expect(listRuns('union-find')[listRuns('union-find').length - 1].label).toBe('Find root 3');
  });

  test('union of missing sets guides the user', () => {
    render(<UnionFindPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Union' }));
    fireEvent.change(screen.getByPlaceholderText('Set A'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Set B'), { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Union Nodes' }));
    expect(screen.getByText('Add set 99 first')).toBeInTheDocument();
  });

  test('clear empties then reset restores the demo forest', () => {
    const { container } = render(<UnionFindPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(container.querySelectorAll('.uf-node')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(container.querySelectorAll('.uf-node')).toHaveLength(8);
  });

  test('memory view shows parent pointers', () => {
    const { container } = render(<UnionFindPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));
    const labels = [...container.querySelectorAll('.memory-pointer')].map((n) => n.textContent);
    expect(labels.some((l) => l.includes('root'))).toBe(true);
  });

  test('css contract', () => {
    expect(css).toMatch(/\.uf-canvas\s*\{/);
    expect(css).toMatch(/\.uf-node\s*\{/);
    expect(css).toMatch(/\.uf-node\.root/);
    expect(css).toMatch(/\.dark \.uf-canvas/);
  });
});
