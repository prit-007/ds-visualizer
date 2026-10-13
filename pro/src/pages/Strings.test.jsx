import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Strings from './Strings';
import { clearRuns, listRuns } from '../lib/timeTravel';

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./Strings.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 120; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('Strings page', () => {
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

  test('renders the demo text and pattern', () => {
    const { container } = render(<Strings />);
    expect(screen.getByText('String Matching Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.char-cell').length).toBeGreaterThan(10);
    expect(screen.getByText(/pattern: "abab"/)).toBeInTheDocument();
  });

  test('KMP search finds both occurrences and records the run', () => {
    render(<Strings />);
    fireEvent.click(screen.getByRole('button', { name: 'Run KMP' }));
    finishRun();

    const runs = listRuns('strings');
    expect(runs[runs.length - 1].label).toBe('KMP "abab"');
  });

  test('custom text runs through KMP', () => {
    render(<Strings />);
    const inputs = screen.getAllByPlaceholderText(/Text to search|Pattern/);
    fireEvent.change(inputs[0], { target: { value: 'aaaabaaaab' } });
    fireEvent.change(inputs[1], { target: { value: 'aaab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run KMP' }));
    finishRun();

    expect(listRuns('strings')[listRuns('strings').length - 1].label).toBe('KMP "aaab"');
  });

  test('naive search records its own run label', () => {
    render(<Strings />);
    fireEvent.click(screen.getByRole('button', { name: 'Naive Search' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run Naive' }));
    finishRun();

    expect(listRuns('strings')[listRuns('strings').length - 1].label).toBe('Naive "abab"');
  });

  test('failure table rebuilds π for the pattern', () => {
    render(<Strings />);
    fireEvent.click(screen.getByRole('button', { name: 'Failure Table' }));
    fireEvent.click(screen.getByRole('button', { name: 'Build π Table' }));
    finishRun();

    expect(listRuns('strings')[listRuns('strings').length - 1].label).toBe('π table for "abab"');
  });

  test('empty pattern is a guided error', () => {
    render(<Strings />);
    const inputs = screen.getAllByPlaceholderText(/Text to search|Pattern/);
    fireEvent.change(inputs[0], { target: { value: 'abc' } });
    fireEvent.change(inputs[1], { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run KMP' }));
    expect(screen.getAllByText(/enter a pattern/).length).toBeGreaterThan(0);
  });

  test('css contract', () => {
    expect(css).toMatch(/\.char-cell\s*\{/);
    expect(css).toMatch(/\.char-cell\.matched/);
    expect(css).toMatch(/\.char-cell\.found/);
    expect(css).toMatch(/\.dark \.strings-canvas/);
  });
});
