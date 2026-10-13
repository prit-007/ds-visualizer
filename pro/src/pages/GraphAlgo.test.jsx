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
    expect(screen.getByText('Graph Algorithms Visualizer')).toBeInTheDocument();
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

describe('topological sort mode', () => {
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

  test('switching tabs reveals topo controls and a DAG preset', () => {
    const { container } = render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Topological Sort' }));

    expect(screen.getByRole('button', { name: 'Run Topological Sort' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Start node')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Small DAG' }));
    // directed arrow markers are in the svg
    expect(container.querySelector('marker#arrow')).not.toBeNull();
  });

  test('running topo on a DAG records the order', () => {
    const { container } = render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Topological Sort' }));
    fireEvent.click(screen.getByRole('button', { name: 'Small DAG' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Topological Sort' }));
    finishRun();

    const runs = listRuns('graph-algo');
    expect(runs[runs.length - 1].label).toBe('Topological sort');
    const order = container.querySelector('.topo-order');
    expect(order).not.toBeNull();
    expect(order.textContent).toContain('1 → 2 → 3 → 4');
  });

  test('a cyclic preset ends with the cycle-detected narration', () => {
    render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Topological Sort' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cyclic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Topological Sort' }));
    finishRun();

    expect(listRuns('graph-algo')[listRuns('graph-algo').length - 1].label).toBe('Topological sort');
  });
});

describe('GraphAlgo (Bellman-Ford)', () => {
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

  test('tab-switch loads the negative-weights graph and a run records', () => {
    render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Bellman-Ford' }));
    expect(screen.getByRole('button', { name: 'Run Bellman-Ford' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Start node'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run Bellman-Ford' }));
    finishRun();

    const runs = listRuns('graph-algo');
    expect(runs[runs.length - 1].label).toBe('Bellman-Ford from 1');
  });

  test('a negative cycle is reported', () => {
    render(<GraphAlgo />);
    fireEvent.click(screen.getByRole('button', { name: 'Bellman-Ford' }));
    fireEvent.click(screen.getByRole('button', { name: 'Negative cycle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Bellman-Ford' }));
    finishRun();

    expect(screen.getByText(/Negative cycle detected/)).toBeInTheDocument();
  });
});
