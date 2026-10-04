import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import HashTable from './HashTable';
import { HASH_TABLE_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns } from '../lib/timeTravel';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./HashTable.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 30; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('HashTable', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
    window.location.hash = '';
  });

  test('renders the default demo table with chained keys', () => {
    const { container } = render(<HashTable />);
    expect(screen.getByText('Interactive Hash Table Visualizer')).toBeInTheDocument();
    expect(container.querySelectorAll('.hash-bucket')).toHaveLength(11);
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    expect(screen.getAllByText('14').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Insert Key' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a key')).toBeInTheDocument();
  });

  test('switching tabs swaps the operation button', () => {
    render(<HashTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('button', { name: 'Search Key' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Insert Key' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Delete Key' })).toBeInTheDocument();
  });

  test('uses the shared info panels for complexity and properties', () => {
    const { container } = render(<HashTable />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(3);
    expect(screen.getByText('Time Complexity')).toBeInTheDocument();
    expect(screen.getByText('Hash Table Properties')).toBeInTheDocument();
  });
});

describe('hash table operations', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
    window.location.hash = '';
  });

  test('inserting a key records the run and appends to its bucket chain', () => {
    render(<HashTable />);
    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '47' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
    finishRun();

    const runs = listRuns('hash-table');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Insert 47');
    expect(runs[0].after).toContain(47);
    expect(screen.getAllByText('47').length).toBeGreaterThan(0);
  });

  test('inserting a duplicate key is refused with a guided error', () => {
    render(<HashTable />);
    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
    expect(screen.getByText('Key 25 already exists in the table')).toBeInTheDocument();
  });

  test('searching a key shows the hashSearch pseudocode pane', () => {
    const { container } = render(<HashTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search Key' }));
    finishRun();

    expect(listRuns('hash-table')[0].label).toBe('Search 25');
    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      HASH_TABLE_PSEUDOCODE.search.length
    );
  });

  test('deleting a mid-chain key shifts the tail of its bucket', () => {
    render(<HashTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Key' }));
    finishRun();

    const runs = listRuns('hash-table');
    expect(runs[0].label).toBe('Delete 25');
    expect(runs[0].after).toEqual(expect.arrayContaining([2, 14, 36]));
    expect(runs[0].after).not.toContain(25);

    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([2, 14, 36]);
  });

  test('deleting a missing key is refused with a guided error', () => {
    render(<HashTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Key' }));
    expect(
      screen.getByText('Key 99 not present in the table')
    ).toBeInTheDocument();
  });
});

describe('empty-state behavior', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
  });

  test('empty table explains what to do; delete refuses with a guided error', () => {
    render(<HashTable initialKeys={[]} />);
    expect(
      screen.getByText('Hash table is empty — insert a key to get started.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Key' }));
    expect(
      screen.getByText('Hash table is empty — insert a key first')
    ).toBeInTheDocument();
  });

  test('inserting into an empty table works', () => {
    render(<HashTable initialKeys={[]} />);
    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
    finishRun();
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });
});

describe('case presets', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
  });

  test('worst loads 12 keys, average 3, random 8 in-range values', () => {
    render(<HashTable initialKeys={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Worst case' }));
    expect(document.querySelectorAll('.memory-value')).toHaveLength(12);

    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));
    expect(document.querySelectorAll('.memory-value')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Random case' }));
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toHaveLength(8);
    values.forEach((v) => {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(99);
    });
  });
});

describe('story ↔ memory view', () => {
  beforeEach(() => {
    clearRuns();
  });

  test('memory view swaps the bucket canvas for its memory cells', () => {
    render(<HashTable />);

    expect(screen.getByRole('button', { name: 'Story' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.querySelector('.hash-table-canvas')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(screen.getByRole('button', { name: 'Memory' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.querySelector('.hash-table-canvas')).toBeNull();
    expect(screen.getByText('0x64')).toBeInTheDocument();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);
  });

  test('memory view of an empty table shows an empty note', () => {
    render(<HashTable initialKeys={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(document.querySelector('.hash-table-canvas')).toBeNull();
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
    render(<HashTable />);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  test('seeds the table from a shared scenario hash', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'hash-table', values: [99, 77] })}`;

    render(<HashTable initialKeys={[]} />);

    expect(screen.getAllByText('99').length).toBeGreaterThan(0);
    expect(screen.getAllByText('77').length).toBeGreaterThan(0);
  });

  test('ignores a scenario meant for another structure', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'array', values: [1] })}`;

    render(<HashTable />);

    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([2, 14, 25, 36]);
  });
});

describe('run history', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
  });

  test('a completed insert is recorded and fork rewinds to its before state', () => {
    render(<HashTable />);

    fireEvent.change(screen.getByPlaceholderText('Enter a key'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Key' }));
    finishRun();

    expect(listRuns('hash-table')).toHaveLength(1);
    expect(document.querySelector('.run-history')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).not.toContain(99);
    expect(values).toEqual([2, 14, 25, 36]);
  });
});

describe('HashTable.css contract', () => {
  test('owns the bucket canvas and dark-mode variants', () => {
    expect(css).toMatch(/\.hash-table-canvas\s*\{/);
    expect(css).toMatch(/\.hash-bucket\s*\{/);
    expect(css).toMatch(/\.hash-chain\s*\{/);
    expect(css).toMatch(/\.hash-key\s*\{/);
    expect(css).toMatch(/\.dark\s+\.hash-table-canvas/);
    expect(css).toMatch(/\.dark\s+\.hash-bucket/);
  });
});


describe('reset & clear', () => {
  beforeEach(() => {
    clearRuns();
  });

  test('clear empties the structure; reset restores the demo state', () => {
    render(<HashTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Hash table is empty — insert a key to get started.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getAllByText('14').length).toBeGreaterThan(0);
    expect(screen.getAllByText('36').length).toBeGreaterThan(0);
  });
});
