import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Help from './Help';

describe('Help', () => {
  test('renders shortcuts, gestures, features and FAQ', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );
    expect(screen.getByText('Help & Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    // keyboard shortcut keys present
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });

  test('features link to real routes', () => {
    render(
      <MemoryRouter>
        <Help />
      </MemoryRouter>
    );
    const links = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toContain('/lessons');
    expect(links).toContain('/curriculum');
    expect(links).toContain('/complexity');
    expect(links).toContain('/challenges');
  });
});
