import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gsap } from 'gsap';
import LinkedListVisualizer from './LinkedListVisualizer';
import { LINKED_LIST_PSEUDOCODE } from '../lib/pseudocode';

// GSAP's transform parser crashes on framer-motion's inline `scale(0)` under
// jsdom; animation is never asserted directly, so a spy mock keeps runs clean.
vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

// Vite rewrites `new URL(x, import.meta.url)` inline against the dev-server
// origin, so bind the URL first, then read the stylesheet as text.
const moduleUrl = import.meta.url;
const linkedListCss = readFileSync(
  fileURLToPath(new URL('./LinkedListVisualizer.css', moduleUrl)),
  'utf8'
);

const MANY_NODES = Array.from({ length: 12 }, (_, i) => ({
  id: `n${i}`,
  value: (i + 1) * 10,
}));

describe('LinkedListVisualizer', () => {
  test('renders the initial list and default controls', () => {
    render(<LinkedListVisualizer />);
    expect(screen.getByText('Interactive Linked List Visualizer')).toBeInTheDocument();
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('40').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Add to End' })).toBeInTheDocument();
  });

  test('switching to Insert reveals the position input', () => {
    render(<LinkedListVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    expect(screen.getByPlaceholderText(/^Enter position/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert at Position' })).toBeInTheDocument();
  });

  test('switching to Remove hides the value input', () => {
    render(<LinkedListVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByPlaceholderText('Enter a number')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Node' })).toBeInTheDocument();
  });
});

describe('appearance with more than 10 nodes', () => {
  test('renders 12 nodes joined by 11 pointers', () => {
    const { container } = render(<LinkedListVisualizer initialNodes={MANY_NODES} />);
    const nodeEls = container.querySelectorAll('.linked-list-node');
    expect(nodeEls).toHaveLength(12);
    nodeEls.forEach((el, i) => {
      expect(el.querySelector('.node-value').textContent).toBe(String(MANY_NODES[i].value));
      expect(el.querySelector('.node-index').textContent).toBe(String(i));
    });
    expect(container.querySelectorAll('.pointer-container')).toHaveLength(11);
    expect(container.querySelectorAll('.linked-list-display')).toHaveLength(1);
  });

  test('list display wraps instead of overflowing', () => {
    const rule = linkedListCss.match(/\.linked-list-display\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('flex-wrap: wrap');
  });
});

describe('empty list (user removed every node one by one)', () => {
  test('shows an empty-state message', () => {
    const { container } = render(<LinkedListVisualizer initialNodes={[]} />);
    expect(
      screen.getByText('Linked list is empty — add a node to get started.')
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.linked-list-node')).toHaveLength(0);
    expect(container.querySelectorAll('.pointer-container')).toHaveLength(0);
  });

  test('position input never shows the broken 0--1 range', () => {
    render(<LinkedListVisualizer initialNodes={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByPlaceholderText('Enter position')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/0--1/)).not.toBeInTheDocument();
  });

  test('removing from an empty list explains what to do instead of crashing', () => {
    render(<LinkedListVisualizer initialNodes={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.change(screen.getByPlaceholderText('Enter position'), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Node' }));
    expect(screen.getByText('List is empty — add a node first')).toBeInTheDocument();
  });

  test('inserting at position 0 still works on an empty list', () => {
    render(<LinkedListVisualizer initialNodes={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    fireEvent.change(screen.getByPlaceholderText(/^Enter position/), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert at Position' }));
    expect(screen.queryByText(/Position must be/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter position (0-0)')).toBeInTheDocument();
  });
});

describe('reduced motion', () => {
  test('node highlights jump to the end state instead of tweening', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    gsap.to.mockClear();

    render(<LinkedListVisualizer />);

    expect(gsap.to).not.toHaveBeenCalled();
    expect(gsap.set).toHaveBeenCalled();
    window.matchMedia = original;
  });
});

describe('shared shell panels', () => {
  test('shows complexity and property panels', () => {
    const { container } = render(<LinkedListVisualizer />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(2);
    expect(screen.getByText('Time Complexity')).toBeInTheDocument();
    expect(screen.getByText('Linked List Properties')).toBeInTheDocument();
    expect(screen.getByText('Length:')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('64 bytes')).toBeInTheDocument();
  });
});

describe('memory representation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // Each 1000ms round advances the player one step; React only creates the
  // next timer after the act() flush, so repeat until the run completes.
  const finishRun = () => {
    for (let i = 0; i < 30; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
  };

  test('mirrors the list with next pointers and grows on add', () => {
    vi.useFakeTimers();
    const { container } = render(<LinkedListVisualizer />);

    expect(screen.getByText('Memory Representation')).toBeInTheDocument();
    let cells = container.querySelectorAll('.memory-block');
    expect(cells).toHaveLength(4);
    expect(
      [...container.querySelectorAll('.memory-value')].map((n) => n.textContent)
    ).toEqual(['10', '20', '30', '40']);

    let nexts = container.querySelectorAll('.memory-pointer');
    expect(nexts).toHaveLength(4);
    expect(nexts[0]).toHaveTextContent('next');
    expect(nexts[3]).toHaveTextContent('null');

    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to End' }));
    finishRun();

    cells = container.querySelectorAll('.memory-block');
    expect(cells).toHaveLength(5);
    expect(
      [...container.querySelectorAll('.memory-value')].map((n) => n.textContent)
    ).toEqual(['10', '20', '30', '40', '99']);

    nexts = container.querySelectorAll('.memory-pointer');
    expect(nexts).toHaveLength(5);
    expect(nexts[3]).not.toHaveTextContent('null');
    expect(nexts[4]).toHaveTextContent('null');
  });
});

describe('case presets', () => {
  test('worst loads 12 nodes, average 4, random 8 with correct pointers', () => {
    const { container } = render(<LinkedListVisualizer />);

    fireEvent.click(screen.getByRole('button', { name: 'Worst case' }));
    expect(container.querySelectorAll('.memory-block')).toHaveLength(12);

    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));
    expect(container.querySelectorAll('.memory-block')).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'Random case' }));
    const cells = container.querySelectorAll('.memory-block');
    expect(cells).toHaveLength(8);
    const values = [...cells].map((cell) =>
      Number(cell.querySelector('.memory-value').textContent)
    );
    values.forEach((v) => {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(99);
    });
    const nexts = container.querySelectorAll('.memory-pointer');
    expect(nexts).toHaveLength(8);
    expect(nexts[7]).toHaveTextContent('null');
  });
});

describe('dual pane pseudocode', () => {
  test('add run shows the listAdd pseudocode with a live highlight', () => {
    const { container } = render(<LinkedListVisualizer />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to End' }));

    const pane = container.querySelector('.code-pane');
    expect(pane).not.toBeNull();
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      LINKED_LIST_PSEUDOCODE.add.length
    );
    expect(pane.querySelector('.code-line.active')).not.toBeNull();
  });
});
