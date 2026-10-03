import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ComplexityLab from './ComplexityLab';

const moduleUrl = import.meta.url;

describe('ComplexityLab', () => {
  test('lists the benchmarks and starts with an empty state', () => {
    render(<ComplexityLab />);

    expect(screen.getByRole('heading', { name: /complexity lab/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/operation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run sweep/i })).toBeInTheDocument();
    expect(document.querySelector('.complexity-empty')).toBeInTheDocument();
    expect(document.querySelector('.complexity-plot')).not.toBeInTheDocument();
  });

  test('a sweep fills the results table, classification and plot', () => {
    render(<ComplexityLab />);

    fireEvent.change(screen.getByLabelText(/operation/i), {
      target: { value: 'array-binary-search' },
    });
    fireEvent.click(screen.getByRole('button', { name: /run sweep/i }));

    const rows = document.querySelectorAll('.complexity-table tbody tr');
    expect(rows).toHaveLength(5);
    expect(rows[0].textContent).toContain('64');
    expect(rows[4].textContent).toContain('1024');

    const classification = document.querySelector('.complexity-classification');
    expect(classification).toHaveTextContent('O(log n)');
    expect(classification).toHaveTextContent(/theory/i);

    expect(document.querySelector('.complexity-plot')).toBeInTheDocument();
    expect(document.querySelectorAll('.complexity-plot polyline')).toHaveLength(2);
  });

  test('linear benchmarks classify as O(n)', () => {
    render(<ComplexityLab />);

    fireEvent.change(screen.getByLabelText(/operation/i), {
      target: { value: 'array-insert-front' },
    });
    fireEvent.click(screen.getByRole('button', { name: /run sweep/i }));

    expect(document.querySelector('.complexity-classification')).toHaveTextContent(
      'Measured growth: O(n)'
    );
  });

  test('switching benchmarks and rerunning replaces the results', () => {
    render(<ComplexityLab />);

    fireEvent.click(screen.getByRole('button', { name: /run sweep/i }));
    expect(document.querySelector('.complexity-classification')).toHaveTextContent(
      'Measured growth: O(1)'
    );

    fireEvent.change(screen.getByLabelText(/operation/i), {
      target: { value: 'bst-insert-sorted' },
    });
    fireEvent.click(screen.getByRole('button', { name: /run sweep/i }));
    expect(document.querySelector('.complexity-classification')).toHaveTextContent(
      'Measured growth: O(n)'
    );
  });

  test('css contract: page styles live in ComplexityLab.css', () => {
    const css = readFileSync(fileURLToPath(new URL('./ComplexityLab.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.complexity-page\s*\{/);
    expect(css).toMatch(/\.complexity-controls\s*\{/);
    expect(css).toMatch(/\.complexity-table\s*\{/);
    expect(css).toMatch(/\.complexity-plot\s*\{/);
    expect(css).toMatch(/\.complexity-classification\s*\{/);
    expect(css).toMatch(/\.dark \.complexity-page/);
  });
});
