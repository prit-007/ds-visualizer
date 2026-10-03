import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ViewToggle from './ViewToggle';

describe('ViewToggle', () => {
  test('renders story and memory buttons with aria-pressed state', () => {
    render(<ViewToggle view="story" onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Visualization view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Story' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Memory' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking Memory reports the new view', () => {
    const onChange = vi.fn();
    render(<ViewToggle view="story" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));
    expect(onChange).toHaveBeenCalledWith('memory');
  });

  test('disabled state blocks both buttons', () => {
    const onChange = vi.fn();
    render(<ViewToggle view="story" onChange={onChange} disabled />);

    expect(screen.getByRole('button', { name: 'Story' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Memory' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('css contract: view-toggle styles live in index.css', () => {
    const moduleUrl = import.meta.url;
    const css = readFileSync(fileURLToPath(new URL('../index.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.view-toggle\s*\{/);
    expect(css).toMatch(/\.view-toggle-btn\s*\{/);
    expect(css).toMatch(/\.dark \.view-toggle/);
  });
});
