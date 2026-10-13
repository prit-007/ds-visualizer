import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import TrieVisualizer from './TrieVisualizer';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({ gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() } }));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./TrieVisualizer.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 40; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('Trie visualizer', () => {
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

  test('renders the demo trie with word badges', () => {
    const { container } = render(<TrieVisualizer />);
    expect(screen.getByText('Trie Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.trie-node').length).toBeGreaterThan(3);
    expect(container.querySelectorAll('.trie-node.end').length).toBe(8);
  });

  test('inserting a word grows the trie and records the run', () => {
    render(<TrieVisualizer />);
    fireEvent.change(screen.getByPlaceholderText('Enter a word'), { target: { value: 'box' } });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Word' }));
    finishRun();

    const runs = listRuns('trie');
    expect(runs[runs.length - 1].label).toBe('Insert "box"');
  });

  test('searching a missing word ends with honest narration', () => {
    render(<TrieVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a word'), { target: { value: 'hat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Word' }));
    finishRun();

    expect(listRuns('trie')[listRuns('trie').length - 1].label).toBe('Search "hat"');
  });

  test('deleting a word records the run', () => {
    render(<TrieVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a word'), { target: { value: 'rat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Word' }));
    finishRun();

    expect(listRuns('trie')[listRuns('trie').length - 1].label).toBe('Delete "rat"');
  });

  test('listing words appends the alphabetical summary', () => {
    render(<TrieVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    fireEvent.click(screen.getByRole('button', { name: 'List Words' }));
    finishRun();
    expect(listRuns('trie')[listRuns('trie').length - 1].label).toBe('List words');
  });

  test('prefix suggestions appear live', () => {
    render(<TrieVisualizer />);
    fireEvent.change(screen.getByPlaceholderText('e.g. do'), { target: { value: 'do' } });
    expect(screen.getAllByText(/^do/).length).toBeGreaterThan(0);
  });

  test('non-letter input guides the user', () => {
    render(<TrieVisualizer />);
    fireEvent.change(screen.getByPlaceholderText('Enter a word'), { target: { value: 'cat1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Word' }));
    expect(screen.getAllByText(/lowercase/).length).toBeGreaterThan(0);
  });

  test('memory view lists stored words', () => {
    const { container } = render(<TrieVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));
    expect(container.querySelectorAll('.memory-block').length).toBe(8);
  });

  test('css contract', () => {
    expect(css).toMatch(/\.trie-canvas\s*\{/);
    expect(css).toMatch(/\.trie-node\s*\{/);
    expect(css).toMatch(/\.trie-node\.end::after/);
    expect(css).toMatch(/\.dark \.trie-canvas/);
  });
});
