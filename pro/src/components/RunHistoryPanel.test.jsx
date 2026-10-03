import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import RunHistoryPanel from './RunHistoryPanel';

const moduleUrl = import.meta.url;

const makeRun = (overrides = {}) => ({
  id: 1,
  structure: 'tree',
  label: 'Insert 42',
  before: [30],
  after: [30, 42],
  steps: ['step one', 'step two'],
  counters: { compare: 1, move: 1, found: 0, error: 0, total: 2 },
  meta: { rotations: true },
  ...overrides,
});

describe('RunHistoryPanel', () => {
  test('shows an empty state with no runs', () => {
    render(<RunHistoryPanel runs={[]} onFork={vi.fn()} />);
    expect(document.querySelector('.run-history-empty')).toBeInTheDocument();
  });

  test('lists runs with their label and counters', () => {
    render(
      <RunHistoryPanel
        runs={[makeRun(), makeRun({ id: 2, label: 'Delete 10' })]}
        onFork={vi.fn()}
      />
    );

    expect(screen.getAllByText('Insert 42')).toHaveLength(1);
    expect(screen.getByText('Delete 10')).toBeInTheDocument();
    expect(screen.getAllByText(/steps 2/)).toHaveLength(2);
    expect(screen.getAllByText(/compares 1/)).toHaveLength(2);
  });

  test('forking a run calls onFork with that run', () => {
    const onFork = vi.fn();
    const run = makeRun();
    render(<RunHistoryPanel runs={[run]} onFork={onFork} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));

    expect(onFork).toHaveBeenCalledTimes(1);
    expect(onFork).toHaveBeenCalledWith(run);
  });

  test('fork is disabled while animating', () => {
    const onFork = vi.fn();
    render(<RunHistoryPanel runs={[makeRun()]} onFork={onFork} disabled />);

    const fork = screen.getByRole('button', { name: 'Fork' });
    expect(fork).toBeDisabled();
    fireEvent.click(fork);
    expect(onFork).not.toHaveBeenCalled();
  });

  test('comparing two selected runs shows the step diff', () => {
    const a = makeRun({ id: 1, label: 'Insert (on)', steps: ['same', 'rotate'] });
    const b = makeRun({ id: 2, label: 'Insert (off)', steps: ['same', 'skip'] });
    render(<RunHistoryPanel runs={[a, b]} onFork={vi.fn()} />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByRole('button', { name: /compare/i }));

    const diff = document.querySelector('.run-history-diff');
    expect(diff).toBeInTheDocument();
    expect(diff).toHaveTextContent(/common prefix: 1/);
    expect(diff).toHaveTextContent('rotate');
    expect(diff).toHaveTextContent('skip');
  });

  test('compare stays disabled until two runs are selected', () => {
    render(<RunHistoryPanel runs={[makeRun(), makeRun({ id: 2 })]} onFork={vi.fn()} />);

    const compare = screen.getByRole('button', { name: /compare/i });
    expect(compare).toBeDisabled();

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(compare).toBeDisabled();
  });

  test('css contract: history styles live in index.css', () => {
    const css = readFileSync(fileURLToPath(new URL('../index.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.run-history\s*\{/);
    expect(css).toMatch(/\.run-history-empty\s*\{/);
    expect(css).toMatch(/\.run-history-diff\s*\{/);
    expect(css).toMatch(/\.dark \.run-history/);
  });
});
