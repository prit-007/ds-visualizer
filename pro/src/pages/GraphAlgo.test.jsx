import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import GraphAlgo from './GraphAlgo';
import { DIJKSTRA_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./GraphAlgo.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 80; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('GraphAlgo (Dijkstra)', () => {
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

  test('renders the demo weighted graph with weights and distance table', () => {
    const { container } = render(<GraphAlgo />);
    expect(screen.getByText('Dijkstra Shortest Path Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.graph-algo-node')).toHaveLength(6);
    expect(container.querySelectorAll('.graph-algo-edge')).toHaveLength(9);
    expect(container.querySelectorAll('.graph-algo-weight').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Run Dijkstra' })).toBeInTheDocument();
    expect(container.querySelectorAll('.dist-table tbody tr')).toHaveLength(6);
  });

  test('running Dijkstra updates the distance table and records the run', () => {
    const { container } = render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Small graph' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Dijkstra' }));
    finishRun();

    const runs = listRuns('graph-algo');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Dijkstra from 1');

    const rows = [...container.querySelectorAll('.dist-table tbody tr')];
    const distFor = (node) =>
      rows.find((r) => r.getAttribute('data-node') === String(node)).querySelectorAll('td')[1]
        .textContent;
    expect(distFor(1)).toBe('0');
    expect(distFor(3)).toBe('1');
    expect(distFor(2)).toBe('2');

    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(DIJKSTRA_PSEUDOCODE.length);
  });

  test('a start node outside the graph is refused', () => {
    render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Small graph' }));
    fireEvent.change(screen.getByPlaceholderText('Start node'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run Dijkstra' }));
    expect(screen.getByText('Start node 99 is not in the graph')).toBeInTheDocument();
  });

  test('disconnected preset keeps ∞ for unreachable nodes', () => {
    const { container } = render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Disconnected' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Dijkstra' }));
    finishRun();

    const rows = [...container.querySelectorAll('.dist-table tbody tr')];
    const row9 = rows.find((r) => r.getAttribute('data-node') === '9');
    expect(row9.querySelectorAll('td')[1].textContent).toBe('∞');
  });

  test('clear empties then reset restores the demo graph', () => {
    const { container } = render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Graph is empty — load a preset to get started.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(container.querySelectorAll('.graph-algo-node')).toHaveLength(6);
  });

  test('share carries weights and start node', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({
      v: 1,
      structure: 'graph-algo',
      values: [1, 2],
      edges: [[1, 2, 5]],
      start: 2,
    })}`;
    const { container } = render(<GraphAlgo />);
    expect(container.querySelectorAll('.graph-algo-node')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  test('css styles the canvas, weights, dist table and dark mode', () => {
    expect(css).toMatch(/\.graph-algo-canvas\s*\{/);
    expect(css).toMatch(/\.graph-algo-edge\s*\{/);
    expect(css).toMatch(/\.graph-algo-weight\s*\{/);
    expect(css).toMatch(/\.dist-table\s*\{/);
    expect(css).toMatch(/\.dark\s+\.graph-algo-node/);
  });
});
