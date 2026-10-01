import { render } from '@testing-library/react';
import CodePane from './CodePane';

describe('CodePane', () => {
  test('renders numbered lines and marks the active one', () => {
    const { container } = render(
      <CodePane
        lines={['procedure x()', '  return 1', 'end procedure']}
        line={2}
      />
    );

    const lines = container.querySelectorAll('.code-line');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toHaveClass('active');
    expect(lines[1]).toHaveAttribute('aria-current', 'true');
    expect(lines[0]).not.toHaveClass('active');
    expect(lines[2]).not.toHaveClass('active');
    expect(container.textContent).toContain('return 1');
    expect(container.textContent).toContain('procedure x()');
  });

  test('shows a variable watch for the current step', () => {
    const { container } = render(
      <CodePane lines={['x ← 1']} line={1} vars={{ target: 10, position: 2 }} />
    );

    expect(container.textContent).toContain('Variables');
    expect(container.textContent).toContain('target');
    expect(container.textContent).toContain('10');
    expect(container.textContent).toContain('position');
    expect(container.textContent).toContain('2');
  });

  test('hides the variable watch when a step carries no vars', () => {
    const { container } = render(<CodePane lines={['x ← 1']} line={1} />);
    expect(container.textContent).not.toContain('Variables');
  });
});
