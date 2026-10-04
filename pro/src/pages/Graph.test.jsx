import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Graph from './Graph';
import { GRAPH_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./Graph.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 30; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('Graph', () => {
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

  test('renders the default demo graph with canvas and controls', () => {
    const { container } = render(<Graph />);
    expect(screen.getByText('Interactive Graph Visualizer')).toBeInTheDocument();
    expect(container.querySelector('.graph-canvas')).not.toBeNull();
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Place Node' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a node value')).toBeInTheDocument();
  });

  test('switching to BFS swaps the input and button', () => {
    render(<Graph />);
    fireEvent.click(screen.getByRole('button', { name: 'BFS' }));
    expect(screen.getByPlaceholderText('Start node')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run BFS' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place Node' })).not.toBeInTheDocument();
  });

  test('uses the shared info panels for complexity and properties', () => {
    const { container } = render(<Graph />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(3);
    expect(screen.getByText('Time Complexity')).toBeInTheDocument();
    expect(screen.getByText('Graph Properties')).toBeInTheDocument();
  });
});

describe('graph operations', () => {
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

  test('adding a node records the run and places the node', () => {
    render(<Graph />);
    fireEvent.change(screen.getByPlaceholderText('Enter a node value'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place Node' }));
    finishRun();

    const runs = listRuns('graph');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Add node 5');
    expect(runs[0].after.nodes).toEqual([1, 2, 3, 4, 5]);
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });

  test('adding a duplicate node is refused with a guided error', () => {
    render(<Graph />);
    fireEvent.change(screen.getByPlaceholderText('Enter a node value'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place Node' }));
    expect(screen.getByText('Node 2 already exists')).toBeInTheDocument();
  });

  test('adding an edge connects two existing nodes and records the run', () => {
    render(<Graph />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Edge' })); // tab
    fireEvent.change(screen.getByPlaceholderText('From node'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByPlaceholderText('To node'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect Nodes' }));
    finishRun();

    const runs = listRuns('graph');
    expect(runs[0].label).toBe('Add edge 3 — 4');
    expect(runs[0].after.edges).toEqual([
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
    ]);
  });

  test('invalid edges are refused with guided errors', () => {
    render(<Graph />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Edge' }));

    fireEvent.change(screen.getByPlaceholderText('From node'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByPlaceholderText('To node'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect Nodes' }));
    expect(screen.getByText('Self-loops are not allowed')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('To node'), {
      target: { value: '9' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect Nodes' }));
    expect(screen.getByText('Node 9 does not exist')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('To node'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByPlaceholderText('From node'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect Nodes' }));
    expect(screen.getByText('Edge 1 — 2 already exists')).toBeInTheDocument();
  });

  test('BFS run shows the pseudocode pane and records the traversal', () => {
    const { container } = render(<Graph />);
    fireEvent.click(screen.getByRole('button', { name: 'BFS' }));
    fireEvent.change(screen.getByPlaceholderText('Start node'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run BFS' }));
    finishRun();

    const runs = listRuns('graph');
    expect(runs[0].label).toBe('BFS from 1');
    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      GRAPH_PSEUDOCODE.bfs.length
    );
  });

  test('BFS refuses a missing start node', () => {
    render(<Graph />);
    fireEvent.click(screen.getByRole('button', { name: 'BFS' }));
    fireEvent.change(screen.getByPlaceholderText('Start node'), {
      target: { value: '9' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run BFS' }));
    expect(screen.getByText('Start node 9 does not exist')).toBeInTheDocument();
  });

  test('DFS run records the traversal', () => {
    render(<Graph />);
    fireEvent.click(screen.getByRole('button', { name: 'DFS' }));
    fireEvent.change(screen.getByPlaceholderText('Start node'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run DFS' }));
    finishRun();

    expect(listRuns('graph')[0].label).toBe('DFS from 1');
  });
});

describe('empty-state behavior', () => {
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

  test('empty graph explains what to do; BFS refuses with a guided error', () => {
    render(<Graph initialNodes={[]} initialEdges={[]} />);
    expect(
      screen.getByText('Graph is empty — add a node to get started.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'BFS' }));
    fireEvent.change(screen.getByPlaceholderText('Start node'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run BFS' }));
    expect(screen.getByText('Graph needs at least one node')).toBeInTheDocument();
  });

  test('adding a node onto an empty graph works', () => {
    render(<Graph initialNodes={[]} initialEdges={[]} />);
    fireEvent.change(screen.getByPlaceholderText('Enter a node value'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place Node' }));
    finishRun();
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });
});

describe('story ↔ memory view', () => {
  beforeEach(() => {
    clearRuns();
    window.location.hash = '';
  });

  test('memory view swaps the graph canvas for its memory cells', () => {
    render(<Graph />);

    expect(screen.getByRole('button', { name: 'Story' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.querySelector('.graph-canvas')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(screen.getByRole('button', { name: 'Memory' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.querySelector('.graph-canvas')).toBeNull();
    expect(screen.getByText('0x64')).toBeInTheDocument();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);
  });

  test('memory view of an empty graph shows an empty note', () => {
    render(<Graph initialNodes={[]} initialEdges={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(document.querySelector('.graph-canvas')).toBeNull();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(0);
    expect(screen.getByText(/no memory cells/i)).toBeInTheDocument();
  });
});

describe('share', () => {
  beforeEach(() => {
    window.location.hash = '';
    clearRuns();
  });

  afterEach(() => {
    window.location.hash = '';
  });

  test('renders a share button', () => {
    render(<Graph />);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  test('seeds nodes and edges from a shared scenario hash', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({
      v: 1,
      structure: 'graph',
      values: [9, 8],
      edges: [[9, 8]],
    })}`;

    render(<Graph initialNodes={[]} initialEdges={[]} />);

    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.graph-edge')).toHaveLength(1);
  });

  test('ignores a scenario meant for another structure', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'array', values: [99] })}`;

    render(<Graph />);

    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.queryByText('99')).not.toBeInTheDocument();
  });
});

describe('run history', () => {
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

  test('a completed add-node is recorded and fork rewinds to its before state', () => {
    render(<Graph />);

    fireEvent.change(screen.getByPlaceholderText('Enter a node value'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place Node' }));
    finishRun();

    expect(listRuns('graph')).toHaveLength(1);
    expect(document.querySelector('.run-history')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).not.toContain(99);
    expect(values).toEqual([1, 2, 3, 4]);
  });
});

describe('Graph.css contract', () => {
  test('owns the graph canvas and dark-mode variants', () => {
    expect(css).toMatch(/\.graph-canvas\s*\{/);
    expect(css).toMatch(/\.graph-node-slot\s*\{/);
    expect(css).toMatch(/\.graph-edge\s*\{/);
    expect(css).toMatch(/\.graph-edge\.active/);
    expect(css).toMatch(/\.dark\s+\.graph-canvas/);
    expect(css).toMatch(/\.dark\s+\.graph-edge/);
  });
});


describe('reset & clear', () => {
  beforeEach(() => {
    clearRuns();
  });

  test('clear empties the structure; reset restores the demo state', () => {
    render(<Graph />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Graph is empty — add a node to get started.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
  });
});
