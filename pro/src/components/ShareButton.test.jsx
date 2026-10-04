import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ShareButton from './ShareButton';
import { readScenario, encodeScenario } from '../lib/share';

const moduleUrl = import.meta.url;

describe('ShareButton', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  test('clicking share writes the scenario into the location hash', () => {
    render(<ShareButton structure="array" values={[7, 8]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(readScenario(window.location.hash)).toMatchObject({
      structure: 'array',
      values: [7, 8],
    });
  });

  test('shows a copied confirmation afterwards', async () => {
    render(<ShareButton structure="tree" values={[50, 25]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/link copied/i);
  });

  test('a scenario with no values still produces a readable token', () => {
    render(<ShareButton structure="linked-list" values={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(readScenario(window.location.hash)).toMatchObject({
      structure: 'linked-list',
      values: [],
    });
  });

  test('extra fields ride along in the scenario payload', () => {
    render(
      <ShareButton structure="graph" values={[1, 2]} extra={{ edges: [[1, 2]] }} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(readScenario(window.location.hash)).toMatchObject({
      structure: 'graph',
      values: [1, 2],
      edges: [[1, 2]],
    });
  });

  test('css contract: share styles live in index.css', () => {
    const css = readFileSync(fileURLToPath(new URL('../index.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.share-row\s*\{/);
    expect(css).toMatch(/\.share-btn\s*\{/);
    expect(css).toMatch(/\.share-note\s*\{/);
    expect(css).toMatch(/\.dark \.share-btn/);
  });

  test('encodes with the shared helper (roundtrip through location)', () => {
    render(<ShareButton structure="array" values={[99]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    const token = /#s=([^&]+)/.exec(window.location.hash)?.[1];
    expect(token).toBeTruthy();
    const decoded = readScenario(window.location.hash);
    expect(decoded.values).toEqual([99]);
    // and the same token decodes standalone
    expect(readScenario(`#s=${encodeScenario(decoded)}`)).toEqual(decoded);
  });
});
