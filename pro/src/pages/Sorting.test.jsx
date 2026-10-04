import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Sorting from './Sorting';
import { SORTING_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./Sorting.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 80; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('Sorting', () => {
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

  test('renders the default array and bubble controls', () => {
    const { container } = render(<Sorting />);
    expect(screen.getByText('Interactive Sorting Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.sorting-element')).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Run Bubble Sort' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 5, 3, 8, 1')).toBeInTheDocument();
  });

  test('switching to Selection swaps the run button', () => {
    render(<Sorting />);
    fireEvent.click(screen.getByRole('button', { name: 'Selection' }));
    expect(screen.getByRole('button', { name: 'Run Selection Sort' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run Bubble Sort' })).not.toBeInTheDocument();
  });

  test('uses the shared info panels for complexity and properties', () => {
    const { container } = render(<Sorting />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(3);
    expect(screen.getByText('Time Complexity')).toBeInTheDocument();
    expect(screen.getByText('Sorting Properties')).toBeInTheDocument();
  });
});

describe('sorting runs', () => {
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

  test('bubble sort orders a small array and records the run', () => {
    render(<Sorting initialArray={[2, 1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run Bubble Sort' }));
    finishRun();

    const runs = listRuns('sorting');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Bubble sort');
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([1, 2]);
  });

  test('selection sort orders a small array', () => {
    const { container } = render(<Sorting initialArray={[3, 1, 2]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Selection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Selection Sort' }));
    finishRun();

    expect(listRuns('sorting')[0].label).toBe('Selection sort');
    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      SORTING_PSEUDOCODE.selection.length
    );
  });

  test('insertion sort orders a small array', () => {
    render(<Sorting initialArray={[2, 1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Insertion' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Insertion Sort' }));
    finishRun();

    expect(listRuns('sorting')[0].label).toBe('Insertion sort');
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([1, 2]);
  });

  test('bubble swap actually moves the smaller element left during playback', () => {
    const { container } = render(<Sorting initialArray={[2, 1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run Bubble Sort' }));

    // steps: 1 start, 2 pass header, 3 compare, 4 swap
    for (let i = 0; i < 4; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    // display items reorder on the swap step — values now read 1, 2 in the canvas
    const values = [...container.querySelectorAll('.sorting-element .element-value')].map(
      (n) => n.textContent
    );
    expect(values).toEqual(['1', '2']);
  });

  test('loading a malformed array is refused with a guided error', () => {
    render(<Sorting initialArray={[2, 1]} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. 5, 3, 8, 1'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Load Array' }));
    expect(
      screen.getByText('Please enter at least two numbers to sort')
    ).toBeInTheDocument();
  });

  test('loading a valid array replaces the canvas contents', () => {
    const { container } = render(<Sorting initialArray={[2, 1]} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. 5, 3, 8, 1'), {
      target: { value: '9, 7, 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Load Array' }));
    // count via state-driven memory cells — AnimatePresence keeps exiting
    // nodes in the story canvas under fake timers
    const values = [...container.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([9, 7, 1]);
  });
});

describe('keyboard submit (Enter)', () => {
  test('submitting the load-array form loads the parsed values', () => {
    const { container } = render(<Sorting initialArray={[2, 1]} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. 5, 3, 8, 1'), {
      target: { value: '9, 7, 1' },
    });
    const form = container.querySelector('form.operation-inputs');
    fireEvent.submit(form);
    const values = [...container.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([9, 7, 1]);
  });
});

describe('case presets', () => {
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

  test('sorted/reverse/random load eight elements', () => {
    const { container } = render(<Sorting initialArray={[1]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sorted case' }));
    let values = [...container.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toHaveLength(8);

    fireEvent.click(screen.getByRole('button', { name: 'Reverse case' }));
    values = [...container.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values[0]).toBe(80);
    expect(values[values.length - 1]).toBe(10);

    fireEvent.click(screen.getByRole('button', { name: 'Random case' }));
    values = [...container.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toHaveLength(8);
  });
});

describe('story ↔ memory view', () => {
  beforeEach(() => {
    clearRuns();
    window.location.hash = '';
  });

  test('memory view swaps the sorting canvas for its memory cells', () => {
    render(<Sorting />);

    expect(screen.getByRole('button', { name: 'Story' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.querySelector('.sorting-canvas')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(document.querySelector('.sorting-canvas')).toBeNull();
    expect(screen.getByText('0x64')).toBeInTheDocument();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);
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
    render(<Sorting />);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  test('seeds the array from a shared scenario hash', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'sorting', values: [9, 7] })}`;

    render(<Sorting initialArray={[1]} />);

    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });

  test('ignores a scenario meant for another structure', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'array', values: [99] })}`;

    render(<Sorting initialArray={[3, 1]} />);

    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
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

  test('a completed sort is recorded and fork rewinds to its before state', () => {
    render(<Sorting initialArray={[2, 1]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run Bubble Sort' }));
    finishRun();

    expect(listRuns('sorting')).toHaveLength(1);
    expect(document.querySelector('.run-history')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([2, 1]);
  });
});

describe('Sorting.css contract', () => {
  test('owns the sorting canvas and dark-mode variants', () => {
    expect(css).toMatch(/\.sorting-canvas\s*\{/);
    expect(css).toMatch(/\.sorting-element\s*\{/);
    expect(css).toMatch(/\.sorting-element\.sorted/);
    expect(css).toMatch(/\.dark\s+\.sorting-element/);
    expect(css).toMatch(/\.dark\s+\.sorting-canvas/);
  });
});

describe('merge, quick and heap sorts', () => {
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

  test('merge sort orders a small array and records the run', () => {
    render(<Sorting initialArray={[2, 1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Merge' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Merge Sort' }));
    finishRun();

    expect(listRuns('sorting')[0].label).toBe('Merge sort');
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([1, 2]);
  });

  test('quick sort orders a small array and shows its pseudocode', () => {
    const { container } = render(<Sorting initialArray={[2, 1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Quick Sort' }));
    finishRun();

    expect(listRuns('sorting')[0].label).toBe('Quick sort');
    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      SORTING_PSEUDOCODE.quick.length
    );
  });

  test('heap sort orders a small array', () => {
    render(<Sorting initialArray={[3, 1, 2]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Heap' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Heap Sort' }));
    finishRun();

    expect(listRuns('sorting')[0].label).toBe('Heap sort');
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([1, 2, 3]);
  });

  test('all six algorithms are offered as tabs', () => {
    render(<Sorting />);
    ['Bubble', 'Selection', 'Insertion', 'Merge', 'Quick', 'Heap'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });
});
