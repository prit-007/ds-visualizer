import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Heap from './Heap';
import { HEAP_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./Heap.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 60; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('Heap', () => {
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

  test('renders the default heap with array + tree views and controls', () => {
    const { container } = render(<Heap />);
    expect(screen.getByText('Interactive Binary Heap Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.heap-element')).toHaveLength(7);
    expect(container.querySelectorAll('.heap-node')).toHaveLength(7);
    expect(container.querySelectorAll('.heap-edge')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Insert Key' })).toBeInTheDocument();
  });

  test('switching tabs swaps the operation button', () => {
    render(<Heap />);
    fireEvent.click(screen.getByRole('button', { name: 'Extract Min' }));
    expect(screen.getByRole('button', { name: 'Extract Minimum' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Peek' }));
    expect(screen.getByRole('button', { name: 'Peek Minimum' })).toBeInTheDocument();
  });

  test('uses the shared info panels', () => {
    const { container } = render(<Heap />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(3);
    expect(screen.getByText('Heap Properties')).toBeInTheDocument();
  });
});

describe('heap operations', () => {
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

  test('insert records the run and appends the key', () => {
    render(<Heap />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
    finishRun();

    const runs = listRuns('heap');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Insert 4');
    expect(runs[0].after).toContain(4);
    expect([...document.querySelectorAll('.memory-value')].map((n) => n.textContent)).toContain('4');
  });

  test('extract removes the current minimum and records the run', () => {
    render(<Heap />);
    fireEvent.click(screen.getByRole('button', { name: 'Extract Min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Extract Minimum' }));
    finishRun();

    const runs = listRuns('heap');
    expect(runs[0].label).toBe('Extract min 1');
    expect(runs[0].before).toContain(1);
    expect(runs[0].after).not.toContain(1);
    const pane = document.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      HEAP_PSEUDOCODE.extractMin.length
    );
  });

  test('peek reports the root minimum', () => {
    render(<Heap />);
    fireEvent.click(screen.getByRole('button', { name: 'Peek' }));
    fireEvent.click(screen.getByRole('button', { name: 'Peek Minimum' }));
    finishRun();

    expect(listRuns('heap')[0].label).toBe('Peek minimum');
  });

  test('empty heap refuses extract with a guided error', () => {
    render(<Heap />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Extract Min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Extract Minimum' }));
    expect(screen.getByText('Heap is empty — insert a key first')).toBeInTheDocument();
  });
});

describe('presets, view, share, reset & clear', () => {
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

  test('presets load eight keys and keep a valid min at the root', () => {
    const { container } = render(<Heap />);
    fireEvent.click(screen.getByRole('button', { name: 'Random case' }));
    expect(container.querySelectorAll('.memory-value')).toHaveLength(8);
    const values = [...container.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values[0]).toBe(Math.min(...values));
  });

  test('clear empties then reset restores the demo heap', () => {
    render(<Heap />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Heap is empty — insert a key to get started.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  test('memory view swaps the canvas for address cells', () => {
    render(<Heap />);
    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));
    expect(document.querySelector('.heap-canvas')).toBeNull();
    expect(screen.getByText('0x64')).toBeInTheDocument();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);
  });

  test('share button renders and seeds from a scenario hash', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'heap', values: [9, 4] })}`;
    render(<Heap />);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([4, 9]);
  });

  test('fork rewinds to a run before state', () => {
    render(<Heap />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
    finishRun();

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).not.toContain(99);
  });
});

describe('Heap.css contract', () => {
  test('owns the array/tree canvas and dark variants', () => {
    expect(css).toMatch(/\.heap-canvas\s*\{/);
    expect(css).toMatch(/\.heap-array\s*\{/);
    expect(css).toMatch(/\.heap-tree\s*\{/);
    expect(css).toMatch(/\.heap-node\s*\{/);
    expect(css).toMatch(/\.heap-edge\s*\{/);
    expect(css).toMatch(/\.dark\s+\.heap-node/);
    expect(css).toMatch(/\.dark\s+\.heap-edge/);
  });
});
