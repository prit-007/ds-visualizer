import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ArrayVisualizer from './ArrayVisualizer';
import { ARRAY_PSEUDOCODE } from '../lib/pseudocode';

// GSAP's transform parser crashes on framer-motion's inline `scale(0)` under
// jsdom; animation is never asserted directly, so a spy mock keeps runs clean.
vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() },
}));

// Vite rewrites `new URL(x, import.meta.url)` inline against the dev-server
// origin, so bind the URL first, then read the stylesheet as text.
const moduleUrl = import.meta.url;
const indexCss = readFileSync(fileURLToPath(new URL('../index.css', moduleUrl)), 'utf8');

const MANY = Array.from({ length: 12 }, (_, i) => (i + 1) * 10);

describe('ArrayVisualizer', () => {
  test('renders the initial array and default controls', () => {
    render(<ArrayVisualizer />);
    expect(screen.getByText('Interactive Array Visualizer')).toBeInTheDocument();
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Add to End' })).toBeInTheDocument();
  });

  test('switching to Insert At reveals the position input', () => {
    render(<ArrayVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Insert At' }));
    expect(screen.getByPlaceholderText(/^Enter position/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert at Position' })).toBeInTheDocument();
  });

  test('switching to Remove At hides the value input', () => {
    render(<ArrayVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove At' }));
    expect(screen.queryByPlaceholderText('Enter a number')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Element' })).toBeInTheDocument();
  });

  test('uses the shared info panels for complexity and properties', () => {
    const { container } = render(<ArrayVisualizer />);
    expect(container.querySelectorAll('.info-panel')).toHaveLength(2);
    expect(screen.getByText('Time Complexity')).toBeInTheDocument();
    expect(screen.getByText('Array Properties')).toBeInTheDocument();
  });
});

describe('appearance with more than 10 elements', () => {
  test('renders 12 elements with values, indices and matching memory cells', () => {
    const { container } = render(<ArrayVisualizer initialArray={MANY} />);
    const elements = container.querySelectorAll('.array-element');
    expect(elements).toHaveLength(12);
    elements.forEach((el, i) => {
      expect(el.querySelector('.element-value').textContent).toBe(String(MANY[i]));
      expect(el.querySelector('.element-index').textContent).toBe(String(i));
    });
    expect(container.querySelectorAll('.memory-block')).toHaveLength(12);
    expect(container.querySelectorAll('.array-elements')).toHaveLength(1);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('element and memory containers wrap instead of overflowing', () => {
    const elementsRule = indexCss.match(/\.array-elements\s*\{[^}]*\}/)?.[0] ?? '';
    expect(elementsRule).toContain('flex-wrap: wrap');
    const memoryRule = indexCss.match(/\.memory-blocks\s*\{[^}]*\}/)?.[0] ?? '';
    expect(memoryRule).toContain('flex-wrap: wrap');
  });
});

describe('empty array (user removed every element one by one)', () => {
  test('shows an empty-state message and zeroed properties', () => {
    const { container } = render(<ArrayVisualizer initialArray={[]} />);
    expect(
      screen.getByText('Array is empty — add an element to get started.')
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.array-element')).toHaveLength(0);
    expect(screen.getByText('Length:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0 bytes')).toBeInTheDocument();
  });

  test('position input never shows the broken 0--1 range', () => {
    render(<ArrayVisualizer initialArray={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove At' }));
    expect(screen.getByPlaceholderText('Enter position')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/0--1/)).not.toBeInTheDocument();
  });

  test('removing from an empty array explains what to do instead of crashing', () => {
    render(<ArrayVisualizer initialArray={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove At' }));
    fireEvent.change(screen.getByPlaceholderText('Enter position'), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Element' }));
    expect(screen.getByText('Array is empty — add an element first')).toBeInTheDocument();
  });

  test('inserting at position 0 still works on an empty array', () => {
    render(<ArrayVisualizer initialArray={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Insert At' }));
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

describe('case presets', () => {
  test('worst loads 12 elements, average 3, random 8 in-range values', () => {
    const { container } = render(<ArrayVisualizer initialArray={[1]} />);

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

describe('dual pane pseudocode', () => {
  test('add run shows the arrayAdd pseudocode with a live highlight', () => {
    const { container } = render(<ArrayVisualizer initialArray={[]} />);
    fireEvent.change(screen.getByPlaceholderText('Enter a number'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to End' }));

    const pane = container.querySelector('.code-pane');
    expect(pane).not.toBeNull();
    expect(pane.querySelectorAll('.code-line')).toHaveLength(
      ARRAY_PSEUDOCODE.add.length
    );
    expect(pane.querySelector('.code-line.active')).not.toBeNull();
  });
});

describe('story ↔ memory view', () => {
  test('memory view swaps the array canvas for its memory cells', () => {
    render(<ArrayVisualizer />);

    expect(screen.getByRole('button', { name: 'Story' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.array-container')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(screen.getByRole('button', { name: 'Memory' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.array-container')).toBeNull();
    expect(screen.getByText('0x64')).toBeInTheDocument();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Story' }));
    expect(document.querySelector('.array-container')).not.toBeNull();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(1);
  });

  test('memory view of an empty array shows an empty note', () => {
    render(<ArrayVisualizer initialArray={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));

    expect(document.querySelector('.array-container')).toBeNull();
    expect(document.querySelectorAll('.memory-representation')).toHaveLength(0);
    expect(screen.getByText(/no memory cells/i)).toBeInTheDocument();
  });
});
