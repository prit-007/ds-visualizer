import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Searching from './Searching';
import { SEARCHING_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./Searching.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 80; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('Searching', () => {
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

  test('renders the default sorted array and linear controls', () => {
    const { container } = render(<Searching />);
    expect(screen.getByText('Interactive Searching Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.searching-element')).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'Run Linear Search' })).toBeInTheDocument();
  });

  test('switching to Binary swaps the run button', () => {
    render(<Searching />);
    fireEvent.click(screen.getByRole('button', { name: 'Binary' }));
    expect(screen.getByRole('button', { name: 'Run Binary Search' })).toBeInTheDocument();
  });

  test('uses the shared info panels', () => {
    const { container } = render(<Searching />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(3);
    expect(screen.getByText('Searching Properties')).toBeInTheDocument();
  });
});

describe('search runs', () => {
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

  test('linear search finds the target and records the run', () => {
    const { container } = render(<Searching initialArray={[2, 4, 6]} initialTarget={6} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run Linear Search' }));
    finishRun();

    const runs = listRuns('searching');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Linear search 6');
    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      SEARCHING_PSEUDOCODE.linear.length
    );
  });

  test('binary search on a sorted array finds the target', () => {
    render(<Searching initialArray={[2, 4, 6, 8, 10]} initialTarget={8} />);
    fireEvent.click(screen.getByRole('button', { name: 'Binary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Binary Search' }));
    finishRun();

    expect(listRuns('searching')[0].label).toBe('Binary search 8');
  });

  test('binary search refuses an unsorted array with a guided error', () => {
    render(<Searching initialArray={[5, 1, 9]} initialTarget={1} />);
    fireEvent.click(screen.getByRole('button', { name: 'Binary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Binary Search' }));
    expect(
      screen.getByText('Binary search requires a sorted array — use the Sorted case preset')
    ).toBeInTheDocument();
  });

  test('submitting the form runs the search (Enter in target)', () => {
    const { container } = render(<Searching initialArray={[2, 4, 6]} initialTarget={4} />);
    const form = container.querySelector('form.operation-inputs');
    fireEvent.submit(form);
    finishRun();
    expect(listRuns('searching')[0].label).toBe('Linear search 4');
  });
});

describe('presets, share, reset & clear', () => {
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

  test('presets load eight elements', () => {
    const { container } = render(<Searching initialArray={[1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sorted case' }));
    // count state-driven memory cells — AnimatePresence keeps exiting nodes
    expect(container.querySelectorAll('.memory-value')).toHaveLength(8);
  });

  test('clear empties then reset restores the demo array', () => {
    render(<Searching />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(
      screen.getByText('No elements yet — load an array to get started.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
  });

  test('share button renders and seeds from a scenario hash', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'searching', values: [9, 7], target: 7 })}`;
    render(<Searching initialArray={[1]} initialTarget={1} />);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });
});

describe('Searching.css contract', () => {
  test('owns the canvas and dark variants', () => {
    expect(css).toMatch(/\.searching-canvas\s*\{/);
    expect(css).toMatch(/\.searching-element\s*\{/);
    expect(css).toMatch(/\.dark\s+\.searching-element/);
    expect(css).toMatch(/\.dark\s+\.searching-canvas/);
  });
});
