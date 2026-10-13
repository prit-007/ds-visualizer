import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AlgoOverview from './AlgoOverview';

describe('AlgoOverview', () => {
  test('renders title, explanation and the three meta cells', () => {
    render(
      <AlgoOverview
        title="Bubble Sort"
        what="Compare adjacent pairs and bubble the largest unsorted value to the end."
        time="O(n²)"
        space="O(1)"
        when="small or nearly-sorted arrays"
      />
    );

    expect(screen.getByText(/Learn · Bubble Sort/)).toBeInTheDocument();
    expect(screen.getByText(/Compare adjacent pairs/)).toBeInTheDocument();
    expect(screen.getByText('O(n²)')).toBeInTheDocument();
    expect(screen.getByText('O(1)')).toBeInTheDocument();
    expect(screen.getByText(/small or nearly-sorted arrays/)).toBeInTheDocument();
  });

  test('render an optional note', () => {
    render(<AlgoOverview title="T" what="w" time="t" space="s" when="u" note="extra" />);
    expect(screen.getByText('extra')).toBeInTheDocument();
  });

  test('css contract: styled cells and dark variants', () => {
    const moduleUrl = import.meta.url;
    const css = readFileSync(fileURLToPath(new URL('../index.css', moduleUrl)), 'utf8');
    expect(css).toMatch(/\.algo-overview\s*\{/);
    expect(css).toMatch(/\.ao-grid\s*\{/);
    expect(css).toMatch(/\.ao-cell\s*\{/);
    expect(css).toMatch(/\.dark \.algo-overview/);
  });
});
