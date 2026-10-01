import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home', () => {
  test('renders hero and feature sections', () => {
    renderHome();
    expect(screen.getByText(/Visualize, Learn, Master/)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Data Structures/)).toBeInTheDocument();
    expect(screen.getByText(/Algorithm Playground/)).toBeInTheDocument();
  });

  test('sorting showcase links to the sorting route', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'Try sorting visualizer →' })).toHaveAttribute(
      'href',
      '/sorting'
    );
  });

  test('tree showcase links to the tree route', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'Explore tree operations →' })).toHaveAttribute(
      'href',
      '/tree'
    );
  });

  test('contains no placeholder links', () => {
    renderHome();
    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.getAttribute('href') === '#')).toBe(false);
  });
});
