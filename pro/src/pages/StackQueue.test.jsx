import { render, screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import StackQueue from './StackQueue';
import { STACK_PSEUDOCODE, QUEUE_PSEUDOCODE } from '../lib/pseudocode';
import { clearRuns, listRuns, recordRun } from '../lib/timeTravel';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL('./StackQueue.css', moduleUrl)), 'utf8');

const finishRun = () => {
  for (let i = 0; i < 30; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('StackQueue', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
    window.location.hash = '';
  });

  test('renders in stack mode with push controls by default', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    expect(
      screen.getByText('Interactive Stack & Queue Visualizer')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stack' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Push onto Stack' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a number')).toBeInTheDocument();
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
  });

  test('switching to queue swaps tabs, labels and structure toggle', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));
    expect(screen.getByRole('button', { name: 'Queue' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Enqueue at Rear' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue' }));
    expect(screen.getByRole('button', { name: 'Dequeue at Front' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Peek' }));
    expect(screen.getByRole('button', { name: 'Peek Front' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Push' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Push onto Stack' })).not.toBeInTheDocument();
  });

  test('uses the shared info panels for complexity and properties', () => {
    const { container } = render(<StackQueue initialItems={[10]} />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(3);
    expect(screen.getByText('Time Complexity')).toBeInTheDocument();
    expect(screen.getByText('Stack & Queue Properties')).toBeInTheDocument();
  });
});

describe('stack operations', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
    window.location.hash = '';
  });

  test('pushing appends to the top and records the run', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '40' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push onto Stack' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs).toHaveLength(1);
    expect(runs[0].label).toBe('Push 40');
    expect(runs[0].before).toEqual([10, 20, 30]);
    expect(runs[0].after).toEqual([10, 20, 30, 40]);
    expect(screen.getAllByText('40').length).toBeGreaterThan(0);
  });

  test('popping removes the top and shows the stackPush pseudocode pane', () => {
    const { container } = render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pop from Stack' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Pop 30');
    expect(runs[0].after).toEqual([10, 20]);
    expect(document.querySelectorAll('.memory-value')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push onto Stack' }));
    const pane = container.querySelector('.code-pane');
    expect(pane).not.toBeNull();
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      STACK_PSEUDOCODE.push.length
    );
  });

  test('peeking highlights the top without changing data', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Peek' }));
    fireEvent.click(screen.getByRole('button', { name: 'Peek Top' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Peek top');
    expect(runs[0].before).toEqual([10, 20, 30]);
    expect(runs[0].after).toEqual([10, 20, 30]);
    expect(document.querySelectorAll('.memory-value')).toHaveLength(3);
  });
});

describe('queue operations', () => {
  beforeEach(() => {
    clearRuns();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRuns();
    window.location.hash = '';
  });

  test('enqueueing shows the queueEnqueue pseudocode pane', () => {
    const { container } = render(<StackQueue initialItems={[10]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enqueue at Rear' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Enqueue 30');
    expect(runs[0].after).toEqual([10, 30]);

    const pane = container.querySelector('.code-pane');
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      QUEUE_PSEUDOCODE.enqueue.length
    );
  });

  test('dequeuing removes the front and shifts the rest', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue at Front' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Dequeue 10');
    expect(runs[0].before).toEqual([10, 20, 30]);
    expect(runs[0].after).toEqual([20, 30]);
    const values = [...document.querySelectorAll('.memory-value')].map(
      (n) => n.textContent
    );
    expect(values).toEqual(['20', '30']);
  });

  test('peeking the queue highlights the front', () => {
    render(<StackQueue initialItems={[10, 20]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Peek' }));
    fireEvent.click(screen.getByRole('button', { name: 'Peek Front' }));
    finishRun();

    expect(listRuns('stack-queue')[0].label).toBe('Peek front');
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

  test('empty stack explains what to do; pop refuses with a guided error', () => {
    render(<StackQueue initialItems={[]} />);
    expect(
      screen.getByText('Stack is empty — push an element to get started.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pop from Stack' }));
    expect(
      screen.getByText('Stack is empty — push an element first')
    ).toBeInTheDocument();
  });

  test('empty queue refuses dequeue and peek', () => {
    render(<StackQueue initialItems={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));
    expect(
      screen.getByText('Queue is empty — enqueue an element to get started.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue at Front' }));
    expect(
      screen.getByText('Queue is empty — enqueue an element first')
    ).toBeInTheDocument();
  });

  test('pushing onto an empty stack works', () => {
    render(<StackQueue initialItems={[]} />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push onto Stack' }));
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

  test('worst loads 12 elements, average 3, random 8 in-range values', () => {
    const { container } = render(<StackQueue initialItems={[1]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Worst case' }));
    expect(container.querySelectorAll('.memory-value')).toHaveLength(12);

    fireEvent.click(screen.getByRole('button', { name: 'Average case' }));
    expect(container.querySelectorAll('.memory-value')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Random case' }));
    const values = [...container.querySelectorAll('.memory-value')].map((n) =>
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

  test('memory view swaps the stack canvas for its memory cells', () => {
    render(<StackQueue initialItems={[10, 20]} />);

    expect(screen.getByRole('button', { name: 'Story' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.querySelector('.stack-queue-container')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(screen.getByRole('button', { name: 'Memory' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.querySelector('.stack-queue-container')).toBeNull();
    expect(screen.getByText('0x64')).toBeInTheDocument();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);
  });

  test('memory view of an empty structure shows an empty note', () => {
    render(<StackQueue initialItems={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(document.querySelector('.stack-queue-container')).toBeNull();
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
    render(<StackQueue initialItems={[10]} />);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  test('seeds the structure from a shared scenario hash', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'stack-queue', values: [99, 77] })}`;

    render(<StackQueue initialItems={[1]} />);

    expect(screen.getAllByText('99').length).toBeGreaterThan(0);
    expect(screen.getAllByText('77').length).toBeGreaterThan(0);
  });

  test('ignores a scenario meant for another structure', async () => {
    const { encodeScenario } = await import('../lib/share');
    window.location.hash = `#s=${encodeScenario({ v: 1, structure: 'array', values: [1] })}`;

    render(<StackQueue initialItems={[42]} />);

    expect(screen.getAllByText('42').length).toBeGreaterThan(0);
    expect(screen.queryByText('99')).not.toBeInTheDocument();
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

  test('a completed push is recorded and fork rewinds to its before state', () => {
    render(<StackQueue initialItems={[10, 20]} />);

    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push onto Stack' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs).toHaveLength(1);

    expect(document.querySelector('.run-history')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));

    expect(document.querySelectorAll('.memory-block')).toHaveLength(2);
    expect(
      [...document.querySelectorAll('.memory-value')].map((n) => n.textContent)
    ).not.toContain('99');
  });
});

describe('StackQueue.css contract', () => {
  test('owns the structure toggle and dark-mode variants', () => {
    expect(css).toMatch(/\.structure-toggle\s*\{/);
    expect(css).toMatch(/\.stack-queue-container\s*\{/);
    expect(css).toMatch(/\.stack-queue-elements\s*\{/);
    expect(css).toMatch(/\.stack-queue-element\s*\{/);
    expect(css).toMatch(/\.dark\s+\.structure-toggle/);
    expect(css).toMatch(/\.dark\s+\.stack-queue-container/);
  });
});

describe('deque mode', () => {
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

  test('switching to Deque swaps to four end-op tabs', () => {
    render(<StackQueue initialItems={[10, 20]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deque' }));
    expect(screen.getByRole('button', { name: 'Deque' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Push Front' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pop Rear' })).toBeInTheDocument();
  });

  test('push front shifts every element right', () => {
    render(<StackQueue initialItems={[10, 20]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deque' }));
    fireEvent.click(screen.getByRole('button', { name: 'Push Front' })); // tab
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push at Front' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Push front 5');
    expect(runs[0].after).toEqual([5, 10, 20]);
    const values = [...document.querySelectorAll('.memory-value')].map((n) =>
      Number(n.textContent)
    );
    expect(values).toEqual([5, 10, 20]);
  });

  test('pop front removes the head and shifts the tail left', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deque' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pop Front' })); // tab
    fireEvent.click(screen.getByRole('button', { name: 'Pop at Front' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Pop front 10');
    expect(runs[0].after).toEqual([20, 30]);
  });

  test('push rear appends like enqueue', () => {
    render(<StackQueue initialItems={[10]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deque' }));
    fireEvent.click(screen.getByRole('button', { name: 'Push Rear' })); // tab
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push at Rear' }));
    finishRun();

    expect(listRuns('stack-queue')[0].label).toBe('Push rear 99');
    expect(listRuns('stack-queue')[0].after).toEqual([10, 99]);
  });

  test('pop rear removes the tail', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deque' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pop Rear' })); // tab
    fireEvent.click(screen.getByRole('button', { name: 'Pop at Rear' }));
    finishRun();

    expect(listRuns('stack-queue')[0].label).toBe('Pop rear 30');
    expect(listRuns('stack-queue')[0].after).toEqual([10, 20]);
  });

  test('empty deque refuses pop with a guided error', () => {
    render(<StackQueue initialItems={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deque' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pop Front' })); // tab
    fireEvent.click(screen.getByRole('button', { name: 'Pop at Front' }));
    expect(
      screen.getByText('Deque is empty — insert an element first')
    ).toBeInTheDocument();
  });
});

describe('circular queue mode', () => {
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

  test('renders six ring slots with front/rear badges', () => {
    const { container } = render(<StackQueue initialItems={[10, 20]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Circular' }));

    expect(container.querySelectorAll('.ring-slot')).toHaveLength(6);
    expect(container.querySelector('.ring-slot.front')).not.toBeNull();
    expect(container.querySelectorAll('.ring-value')).toHaveLength(6);
    // two filled slots show values; the rest show the empty dash
    const dashes = [...container.querySelectorAll('.ring-value')].filter(
      (n) => n.textContent === '—'
    );
    expect(dashes).toHaveLength(4);
    // properties panel shows capacity/front/filled
    expect(screen.getByText('Capacity:')).toBeInTheDocument();
    expect(screen.getByText('Filled:')).toBeInTheDocument();
  });

  test('ring enqueue writes at the rear and records the run', () => {
    render(<StackQueue initialItems={[10, 20]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Circular' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enqueue into Ring' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Ring enqueue 30');
    expect(runs[0].after.slots[2]).toBe(30);
    expect(runs[0].after.count).toBe(3);
  });

  test('ring dequeue advances the front index', () => {
    render(<StackQueue initialItems={[10, 20, 30]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Circular' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue' })); // tab
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue from Ring' }));
    finishRun();

    const runs = listRuns('stack-queue');
    expect(runs[0].label).toBe('Ring dequeue 10');
    expect(runs[0].after.front).toBe(1);
    expect(runs[0].after.count).toBe(2);
  });

  test('filling the ring refuses further enqueues with a full error', () => {
    render(<StackQueue initialItems={[1, 2, 3, 4, 5, 6]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Circular' }));
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enqueue into Ring' }));
    expect(
      screen.getByText('Circular queue is full (capacity 6) — dequeue first')
    ).toBeInTheDocument();
  });

  test('dequeue on an empty ring is refused', () => {
    render(<StackQueue initialItems={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Circular' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue' })); // tab
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue from Ring' }));
    expect(
      screen.getByText('Circular queue is empty — enqueue an element first')
    ).toBeInTheDocument();
  });

  test('fork restores a ring run state', () => {
    recordRun({
      structure: 'stack-queue',
      label: 'Seeded ring run',
      before: { slots: [7, null, null, null, null, null], front: 0, count: 1 },
      after: { slots: [7, 8, null, null, null, null], front: 0, count: 2 },
      steps: ['step one'],
      counters: { compare: 1, move: 1, found: 0, error: 0, total: 2 },
      meta: { mode: 'circular' },
    });

    const { container } = render(<StackQueue initialItems={[1]} />);
    expect(screen.getByText('Seeded ring run')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));
    expect(screen.getByRole('button', { name: 'Circular' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(container.querySelectorAll('.ring-slot')).toHaveLength(6);
  });
});

describe('StackQueue.css ring contract', () => {
  test('owns the ring slot styles and dark variants', () => {
    expect(css).toMatch(/\.ring-slots\s*\{/);
    expect(css).toMatch(/\.ring-slot\s*\{/);
    expect(css).toMatch(/\.ring-slot\.front/);
    expect(css).toMatch(/\.ring-badge/);
    expect(css).toMatch(/\.dark\s+\.ring-slot/);
  });
});


describe('reset & clear', () => {
  beforeEach(() => {
    clearRuns();
  });

  test('clear empties the structure; reset restores the demo state', () => {
    render(<StackQueue />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Stack is empty — push an element to get started.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
  });
});
