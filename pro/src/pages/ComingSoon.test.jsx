import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ComingSoon from './ComingSoon';

describe('ComingSoon', () => {
  test('renders the page title', () => {
    render(
      <MemoryRouter>
        <ComingSoon title="Sorting Visualizer" />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Sorting Visualizer' })).toBeInTheDocument();
    expect(screen.getByText(/not built yet/)).toBeInTheDocument();
  });

  test('links back to every implemented structure', () => {
    render(
      <MemoryRouter>
        <ComingSoon title="Graph" />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Array' })).toHaveAttribute('href', '/array');
    expect(screen.getByRole('link', { name: 'Linked List' })).toHaveAttribute(
      'href',
      '/linked-list'
    );
    expect(screen.getByRole('link', { name: 'AVL Tree' })).toHaveAttribute('href', '/tree');
  });
});
