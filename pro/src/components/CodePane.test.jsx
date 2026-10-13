import { render, screen } from '@testing-library/react';
import CodePane from './CodePane';

describe('CodePane', () => {
  test('renders one line per entry with a numbered gutter', () => {
    const { container } = render(
      <CodePane
        lines={['procedure bubbleSort(array)', '  n ← length(array)', '  return array']}
        line={2}
      />
    );

    expect(container.querySelectorAll('.code-line')).toHaveLength(3);
    const gutter = [...container.querySelectorAll('.code-gutter')].map((g) => g.textContent);
    expect(gutter).toEqual(['1', '2', '3']);
    expect(container.querySelectorAll('.code-line.active')).toHaveLength(1);
    expect(container.querySelector('.code-line.active').textContent).toContain('n ← length');
  });

  test('derives the procedure name for the title', () => {
    render(<CodePane lines={['procedure bubbleSort(array)', 'end procedure']} line={1} />);
    expect(screen.getByText('Pseudocode · bubbleSort')).toBeInTheDocument();
  });

  test('defaults the title when no procedure line exists', () => {
    render(<CodePane lines={['while queue ≠ ∅ do']} line={1} />);
    expect(screen.getByText('Pseudocode')).toBeInTheDocument();
  });

  test('tints the active line by step kind', () => {
    const { container, rerender } = render(
      <CodePane lines={['procedure p()']} line={1} kind="compare" />
    );
    expect(container.querySelector('.code-line.active')).toHaveClass('code-line-compare');

    rerender(<CodePane lines={['procedure p()']} line={1} kind="found" />);
    expect(container.querySelector('.code-line.active')).toHaveClass('code-line-found');
  });

  test('shows readable values in the variable watch', () => {
    const { container } = render(
      <CodePane
        lines={['procedure p()']}
        line={1}
        vars={{ pos: 2, order: [1, 2, 3], size: 5 }}
      />
    );

    const rows = [...container.querySelectorAll('.var-row')].map((r) => r.textContent);
    expect(rows.some((r) => r.includes('pos') && r.includes('2'))).toBe(true);
    expect(rows.some((r) => r.includes('order') && r.includes('[1,2,3]'))).toBe(true);
    expect(rows.some((r) => r.includes('size') && r.includes('5'))).toBe(true);
  });

  test('hides the variable watch when a step carries no vars', () => {
    const { container } = render(<CodePane lines={['procedure p()']} line={1} />);
    expect(container.querySelector('.var-watch')).toBeNull();
  });

  test('scrolls the active line into view when it changes', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    const { rerender } = render(
      <CodePane lines={['procedure p()', '  step', '  step']} line={1} />
    );
    rerender(<CodePane lines={['procedure p()', '  step', '  step']} line={3} />);

    expect(scrollIntoView).toHaveBeenCalled();
    delete Element.prototype.scrollIntoView;
  });
});
