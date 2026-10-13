import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import TreeVisualizer from './TreeVisualizer';
import { TREE_PSEUDOCODE, TREE_ALGO_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns, recordRun } from '../lib/timeTravel';

// Vite rewrites inline `new URL(x, import.meta.url)` against the dev-server
// origin, so bind the raw value first (see AGENTS.md).
const moduleUrl = import.meta.url;

// The tree page is the heaviest render in the app; under full-suite
// parallel load its fake-timer runs intermittently exceed the 5s default.
vi.setConfig({ testTimeout: 20000 });

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

// Each 1000ms round advances the player one step; React only creates the
// next timer after the act() flush, so repeat until the run completes.
const finishRun = () => {
  for (let i = 0; i < 30; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

const advance = (steps) => {
  for (let i = 0; i < steps; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

const insertValue = (value) => {
  fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
    target: { value: String(value) },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Insert Node' }));
  finishRun();
};

test('renders tree properties without crashing', () => {
  render(<TreeVisualizer />);
  expect(screen.getByText(/Node Count/)).toBeInTheDocument();
  expect(screen.getByText(/Balanced/)).toBeInTheDocument();
});

test('renders the insert controls', () => {
  render(<TreeVisualizer />);
  expect(screen.getByPlaceholderText('Enter a number')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Insert Node' })).toBeInTheDocument();
});

describe('memory representation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('grows with the tree and links each cell to its children', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);

    expect(screen.getByText('Memory Representation')).toBeInTheDocument();
    expect(container.querySelectorAll('.memory-block')).toHaveLength(0);

    insertValue(20);
    insertValue(10);
    insertValue(30);

    const cells = container.querySelectorAll('.memory-block');
    expect(cells).toHaveLength(3);

    const values = [...container.querySelectorAll('.memory-value')].map(
      (n) => n.textContent
    );
    expect(values).toEqual(expect.arrayContaining(['20', '10', '30']));

    const addresses = [...container.querySelectorAll('.memory-address')].map(
      (n) => n.textContent
    );
    expect(addresses).toHaveLength(3);
    expect(new Set(addresses).size).toBe(3);
    addresses.forEach((address) => expect(address).toMatch(/^0x[0-9A-F]+$/));

    const pointers = [...container.querySelectorAll('.memory-pointer')];
    expect(pointers).toHaveLength(6);

    const tenIndex = values.indexOf('10');
    const tenAddress = addresses[tenIndex];
    expect(
      pointers.some((pointer) => pointer.textContent.includes(tenAddress))
    ).toBe(true);
    expect(
      pointers.some((pointer) => pointer.textContent.includes('null'))
    ).toBe(true);
  }, 20000);
});

describe('case presets', () => {
  test('worst loads sorted input, average a balanced demo, random unique values', () => {
    const { container } = render(<TreeVisualizer />);

    fireEvent.click(screen.getByRole('button', { name: 'Worst case' }));
    expect(container.querySelectorAll('.memory-block')).toHaveLength(8);

    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));
    expect(container.querySelectorAll('.memory-block')).toHaveLength(7);

    fireEvent.click(screen.getByRole('button', { name: 'Random case' }));
    const cells = container.querySelectorAll('.memory-block');
    expect(cells).toHaveLength(7);
    const values = [...cells].map((cell) =>
      Number(cell.querySelector('.memory-value').textContent)
    );
    expect(new Set(values).size).toBe(7);
    values.forEach((v) => {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(99);
    });
    expect(container.querySelectorAll('.memory-pointer')).toHaveLength(14);
    expect(container.querySelectorAll('.tree-node')).toHaveLength(7);
  });
});

describe('dual pane pseudocode', () => {
  test('insert run shows the treeInsert pseudocode with a live highlight', () => {
    const { container } = render(<TreeVisualizer />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Node' }));

    const pane = container.querySelector('.code-pane');
    expect(pane).not.toBeNull();
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      TREE_PSEUDOCODE.insert.length
    );
    expect(pane.querySelector('.code-line.active')).not.toBeNull();
  });
});

describe('tree canvas rendering', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('empty tree shows the shared empty state instead of a canvas', () => {
    const { container } = render(<TreeVisualizer />);

    expect(container.querySelector('.tree-canvas')).toBeNull();
    const empty = container.querySelector('.empty-state');
    expect(empty).not.toBeNull();
    expect(empty).toHaveTextContent('Tree is empty. Insert some values to begin.');
  });

  test('renders positioned slots and one svg edge per link', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);

    insertValue(20);
    insertValue(10);
    insertValue(30);

    expect(container.querySelectorAll('.tree-node-slot')).toHaveLength(3);
    expect(container.querySelectorAll('.tree-node')).toHaveLength(3);
    expect(container.querySelector('svg.tree-edges')).not.toBeNull();

    const edges = container.querySelectorAll('path.tree-edge');
    expect(edges).toHaveLength(2);

    const slots = [...container.querySelectorAll('.tree-node-slot')];
    slots.forEach((slot) => {
      expect(slot.style.left).not.toBe('');
      expect(slot.style.top).not.toBe('');
    });
  });

  test('balance badges stay quiet on balanced trees and flag imbalances', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);

    insertValue(20);
    insertValue(10);
    insertValue(30);

    // balanced AVL — no bf badges cluttering the canvas
    let badges = [...container.querySelectorAll('.tree-node .element-index')];
    expect(badges).toHaveLength(0);

    // rotations off + a left chain → unbalanced nodes surface bf badges
    fireEvent.click(screen.getByRole('button', { name: 'Toggle AVL rotations' }));
    insertValue(5);
    insertValue(3);

    badges = [...container.querySelectorAll('.tree-node .element-index')].map(
      (badge) => badge.textContent
    );
    expect(badges.length).toBeGreaterThan(0);
    badges.forEach((badge) => expect(badge).toMatch(/bf:/));
    expect(badges.some((badge) => badge.includes('bf'))).toBe(true);
  });

  test('edges light up while the player compares a parent, then highlights the child', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);

    insertValue(20);
    insertValue(10);
    insertValue(30);

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search Node' }));

    // step 1: comparing with 20, step 2: moving right — parent active
    advance(2);
    expect(container.querySelectorAll('path.tree-edge.tree-edge-active')).toHaveLength(2);

    // steps 3-4: check 30, found — child highlighted
    advance(2);
    expect(container.querySelectorAll('path.tree-edge.tree-edge-highlighted')).toHaveLength(1);
  });

  test('css drops scale hacks and styles the canvas, edges and dark mode', () => {
    const cssPath = fileURLToPath(new URL('./TreeVisualizer.css', moduleUrl));
    const css = readFileSync(cssPath, 'utf8');

    expect(css).not.toContain('transform: scale');
    expect(css).toMatch(/\.tree-canvas/);
    expect(css).toMatch(/\.tree-node-slot/);
    expect(css).toMatch(/\.tree-edge-active/);
    expect(css).toMatch(/\.tree-edge-highlighted/);
    expect(css).toMatch(/\.dark\s+\.tree-edge/);
    expect(css).not.toMatch(/\.tree-level/);
    expect(css).not.toMatch(/\.tree-node-wrapper/);
  });
});

describe('traversals & algorithms panel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('offers BFS, DFS, in-order, post-order and the algorithms', () => {
    render(<TreeVisualizer />);
    expect(screen.getByRole('button', { name: 'BFS' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DFS' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'In-order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post-order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate BST' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mirror' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LCA' })).toBeInTheDocument();
  });

  test('BFS run plays queue steps and shows breadth-first chips', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);
    insertValue(20);
    insertValue(10);
    insertValue(30);

    fireEvent.click(screen.getByRole('button', { name: 'BFS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run BFS' }));

    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      TREE_ALGO_PSEUDOCODE.bfs.length
    );

    // start + visit 20 + enqueue 10 + enqueue 30 + visit 10 + visit 30 + finale
    advance(6);
    expect(screen.getByText(/Traversal Result/)).toBeInTheDocument();
    const chips = [...container.querySelectorAll('.traversal-item')].map(
      (chip) => chip.textContent
    );
    expect(chips).toEqual(['20 → ', '10 → ', '30']);
  }, 20000);

  test('DFS run plays stack steps and records the traversal', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);
    insertValue(20);
    insertValue(10);
    insertValue(30);

    fireEvent.click(screen.getByRole('button', { name: 'DFS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run DFS' }));
    finishRun();

    const runs = listRuns('tree');
    expect(runs[runs.length - 1].label).toBe('DFS traversal');
  }, 20000);

  test('in-order still uses the classic traversal narration', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);
    insertValue(20);
    insertValue(10);
    insertValue(30);

    fireEvent.click(screen.getByRole('button', { name: 'In-order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run In-order' }));

    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      TREE_PSEUDOCODE['traversal-inOrder'].length
    );
  });

  test('css styles the algo panel, chips and dark mode', () => {
    const css = readFileSync(
      fileURLToPath(new URL('./TreeVisualizer.css', moduleUrl)),
      'utf8'
    );
    expect(css).toMatch(/\.algo-panel/);
    expect(css).toMatch(/\.algo-toggle/);
    expect(css).toMatch(/\.traversal-result/);
    expect(css).toMatch(/\.traversal-item/);
    expect(css).toMatch(/\.dark \.algo-panel/);
  });
});

describe('counterfactual rotations toggle', () => {
  test('toggle flips aria-pressed and reveals the disabled-rotations note', () => {
    render(<TreeVisualizer />);

    const toggle = screen.getByRole('button', { name: 'Toggle AVL rotations' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/rotations disabled/i)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/rotations disabled/i)).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/rotations disabled/i)).not.toBeInTheDocument();
  });

  test('css contract: counterfactual styles live in TreeVisualizer.css', () => {
    const moduleUrl = import.meta.url;

// The tree page is the heaviest render in the app; under full-suite
// parallel load its fake-timer runs intermittently exceed the 5s default.
vi.setConfig({ testTimeout: 20000 });
    const css = readFileSync(fileURLToPath(new URL('./TreeVisualizer.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.counterfactual-row\s*\{/);
    expect(css).toMatch(/\.counterfactual-note\s*\{/);
    expect(css).toMatch(/\.dark \.counterfactual-note/);
  });
});

describe('story ↔ memory view', () => {
  test('memory view swaps the tree canvas for pointer cells', () => {
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));

    expect(document.querySelector('.tree-canvas')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(document.querySelector('.tree-canvas')).toBeNull();
    expect(screen.getByText('0x3000')).toBeInTheDocument();
    expect(screen.getAllByText(/left →/).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Story' }));
    expect(document.querySelector('.tree-canvas')).not.toBeNull();
  });
});

describe('share', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  test('renders a share button', () => {
    render(<TreeVisualizer />);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  test('seeds the tree from a shared scenario hash', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'tree', values: [30, 20, 40] })}`;

    render(<TreeVisualizer />);

    expect(document.querySelectorAll('.tree-node')).toHaveLength(3);
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);
    expect(screen.getAllByText('40').length).toBeGreaterThan(0);
  });
});

describe('run history', () => {
  beforeEach(() => {
    clearRuns();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
  });

  test('a completed insert is recorded with rotation settings and fork rebuilds', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);

    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));
    // state-driven cells (animated nodes linger while exiting)
    const beforeCount = document.querySelectorAll('.memory-block').length;
    expect(beforeCount).toBeGreaterThan(0);

    insertValue(42);

    const runs = listRuns('tree');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Insert 42');
    expect(runs[0].meta).toEqual({ rotations: true });
    expect(runs[0].after).toContain(42);
    expect(document.querySelectorAll('.memory-block')).toHaveLength(beforeCount + 1);

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));

    expect(document.querySelectorAll('.memory-block')).toHaveLength(beforeCount);
    expect(listRuns('tree')).toHaveLength(1);
  });

  test('seeded history renders and fork applies the run before state', () => {
    recordRun({
      structure: 'tree',
      label: 'Seeded tree run',
      before: [30, 20],
      after: [30, 20, 40],
      steps: ['step one'],
      counters: { compare: 1, move: 0, found: 0, error: 0, total: 1 },
      meta: { rotations: false },
    });

    render(<TreeVisualizer />);
    expect(screen.getByText('Seeded tree run')).toBeInTheDocument();
    expect(screen.getByText(/rotations off/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));
    expect(document.querySelectorAll('.memory-block')).toHaveLength(2);
    expect(
      [...document.querySelectorAll('.memory-value')].map((n) => n.textContent)
    ).toEqual(['30', '20']);
  });
});

describe('tree algorithms', () => {
  beforeEach(() => {
    clearRuns();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
  });

  test('validate BST runs on a preset tree and records the run', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));

    fireEvent.click(screen.getByRole('button', { name: 'Validate BST' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Validation' }));
    finishRun();

    const runs = listRuns('tree');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Validate BST');
    expect(runs[0].meta.algo).toBe('validate');
  }, 20000);

  test('mirror flips the tree shape and records the run', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));

    fireEvent.click(screen.getByRole('button', { name: 'Mirror' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mirror Tree' }));
    finishRun();

    const runs = listRuns('tree');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Mirror tree');
    expect(runs[0].meta.algo).toBe('mirror');
    // mirror keeps the same values; pre-order shape flips
    expect(runs[0].after[0]).toBe(50);
    expect(runs[0].after.slice().sort((a, b) => a - b)).toEqual(
      runs[0].before.slice().sort((a, b) => a - b)
    );
  }, 20000);

  test('LCA finds the ancestor of two values', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));

    fireEvent.click(screen.getByRole('button', { name: 'LCA' }));
    fireEvent.change(screen.getByPlaceholderText('Enter value A'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter value B'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find LCA' }));
    finishRun();

    const runs = listRuns('tree');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('LCA 10, 30');
    expect(runs[0].meta.algo).toBe('lca');
  });

  test('missing LCA keys end with an error step but still record the run', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));

    fireEvent.click(screen.getByRole('button', { name: 'LCA' }));
    fireEvent.change(screen.getByPlaceholderText('Enter value A'), {
      target: { value: '999' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter value B'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find LCA' }));
    finishRun();

    expect(listRuns('tree')).toHaveLength(1);
  });

  test('empty tree refuses algorithms with a guided error', () => {
    render(<TreeVisualizer />);
    // tree starts empty — algo toggles and run button are disabled
    expect(screen.getByRole('button', { name: 'BFS' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run BFS' })).toBeDisabled();
  });

  test('css styles the algo panel and dark mode', () => {
    const css = readFileSync(
      fileURLToPath(new URL('./TreeVisualizer.css', moduleUrl)),
      'utf8'
    );
    expect(css).toMatch(/\.algo-panel/);
    expect(css).toMatch(/\.algo-toggle/);
    expect(css).toMatch(/\.algo-toggle button\[aria-pressed/);
    expect(css).toMatch(/\.dark \.algo-panel/);
  });
});


describe('reset & clear', () => {
  beforeEach(() => {
    clearRuns();
  });

  test('clear empties the structure; reset restores the demo state', () => {
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Tree is empty. Insert some values to begin.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
  });
});

describe('B-tree mode', () => {
  beforeEach(() => {
    clearRuns();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
    window.location.hash = '';
  });

  test('toggle switches to B-tree with insert/search controls and hides rotations', () => {
    render(<TreeVisualizer />);
    expect(screen.getByRole('button', { name: 'Toggle AVL rotations' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'B-Tree' }));

    expect(screen.getByRole('button', { name: 'B-Tree' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Insert Key' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Toggle AVL rotations' })).not.toBeInTheDocument();
  });

  test('inserting keys builds the tree and in-order lists them sorted', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'B-Tree' }));

    [8, 3, 10].forEach((k) => {
      fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
        target: { value: String(k) },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
      finishRun();
    });

    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'In-order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run In-order' }));
    // advance past the visits but stop before the finale unmounts the chips
    advance(4);

    const chips = [...document.querySelectorAll('.traversal-item')].map((c) => c.textContent);
    expect(chips.join('')).toContain('3');
    expect(chips.join('')).toContain('10');
  });

  test('search finds a key and missing keys error', () => {
    vi.useFakeTimers();
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'B-Tree' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
    finishRun();

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search Key' }));
    finishRun();

    expect(listRuns('tree')).toHaveLength(2);
    expect(listRuns('tree')[1].label).toBe('B-tree search 99');
    expect(listRuns('tree')[1].meta.treeType).toBe('btree');
  });

  test('properties show order, keys and height for the B-tree', () => {
    render(<TreeVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'B-Tree' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('Order:')).toBeInTheDocument();
    expect(screen.getByText('Keys:')).toBeInTheDocument();
  });

  test('css styles btree nodes with dark variants', () => {
    const css = readFileSync(
      fileURLToPath(new URL('./TreeVisualizer.css', moduleUrl)),
      'utf8'
    );
    expect(css).toMatch(/\.btree-node/);
    expect(css).toMatch(/\.btree-key/);
    expect(css).toMatch(/\.dark \.btree-node/);
  });
});
