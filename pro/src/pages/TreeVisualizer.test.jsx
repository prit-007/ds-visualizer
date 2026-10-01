import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import TreeVisualizer from './TreeVisualizer';
import { TREE_PSEUDOCODE } from '../lib/pseudocode';

// Vite rewrites inline `new URL(x, import.meta.url)` against the dev-server
// origin, so bind the raw value first (see AGENTS.md).
const moduleUrl = import.meta.url;

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
  });
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

  test('nodes show height and balance factor badges', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);

    insertValue(20);
    insertValue(10);
    insertValue(30);

    const badges = [...container.querySelectorAll('.tree-node .element-index')].map(
      (badge) => badge.textContent
    );
    expect(badges).toHaveLength(3);
    badges.forEach((badge) => expect(badge).toMatch(/h:\d/));
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

describe('traversal controls', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('offers all four traversals including level-order', () => {
    render(<TreeVisualizer />);
    expect(screen.getByRole('button', { name: 'Pre-order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'In-order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post-order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Level-order' })).toBeInTheDocument();
  });

  test('level-order run plays queue steps, marks its button and shows breadth-first chips', () => {
    vi.useFakeTimers();
    const { container } = render(<TreeVisualizer />);
    insertValue(20);
    insertValue(10);
    insertValue(30);

    fireEvent.click(screen.getByRole('button', { name: 'Level-order' }));

    const button = screen.getByRole('button', { name: 'Level-order' });
    expect(button).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'In-order' })).not.toHaveClass('active');

    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      TREE_PSEUDOCODE['traversal-levelOrder'].length
    );

    // start + visit 20 + enqueue 10 + enqueue 30 + visit 10 + visit 30 + final
    advance(6);
    expect(screen.getByText('levelOrder Traversal Result')).toBeInTheDocument();
    const chips = [...container.querySelectorAll('.traversal-item')].map(
      (chip) => chip.textContent
    );
    expect(chips).toEqual(['20 → ', '10 → ', '30']);
  });

  test('css styles the traversal group, pills, result chips and dark mode', () => {
    const css = readFileSync(
      fileURLToPath(new URL('./TreeVisualizer.css', moduleUrl)),
      'utf8'
    );
    expect(css).toMatch(/\.traversal-section/);
    expect(css).toMatch(/\.traversal-buttons/);
    expect(css).toMatch(/\.traversal-btn \{/);
    expect(css).toMatch(/\.traversal-btn\.active/);
    expect(css).toMatch(/\.traversal-btn:disabled/);
    expect(css).toMatch(/\.traversal-result/);
    expect(css).toMatch(/\.traversal-item/);
    expect(css).toMatch(/\.dark \.traversal/);
  });
});
