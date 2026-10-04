import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import { TOUR_STEPS } from '../lib/tourSteps';

const renderLayout = () =>
  render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>
  );

const renderLayoutAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>Home page</div>} />
          <Route path="array" element={<div>Array page</div>} />
          <Route path="tree" element={<div>Tree page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('Layout keyboard accessibility', () => {
  test('category headers are buttons with aria-expanded state', () => {
    renderLayout();

    const dataStructures = screen.getByRole('button', { name: /Data Structures/ });
    expect(dataStructures).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Trees' })).toBeInTheDocument();

    fireEvent.click(dataStructures);
    expect(dataStructures).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Trees' })).not.toBeInTheDocument();

    fireEvent.click(dataStructures);
    expect(dataStructures).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Trees' })).toBeInTheDocument();
  });

  test('collapsed categories stay keyboard-operable', () => {
    renderLayout();

    const algorithms = screen.getByRole('button', { name: /Algorithms/ });
    expect(algorithms).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(algorithms);
    expect(algorithms).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Sorting' })).toBeInTheDocument();
  });
});

describe('guided tour', () => {
  test('sidebar offers the tour replay', () => {
    renderLayout();

    expect(screen.getByRole('button', { name: 'Take the guided tour' })).toBeInTheDocument();
  });

  test('tour steps point at real layout anchors', () => {
    renderLayout();

    TOUR_STEPS.forEach((step) => {
      expect(document.querySelector(step.element)).not.toBeNull();
    });
  });
});

describe('lessons navigation', () => {
  test('tutorials menu links to the lessons index', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /Tutorials/ }));
    expect(screen.getByRole('link', { name: 'Lessons' })).toHaveAttribute('href', '/lessons');
  });
});

describe('curriculum navigation', () => {
  test('tutorials menu links to the curriculum map', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /Tutorials/ }));
    expect(screen.getByRole('link', { name: 'Curriculum map' })).toHaveAttribute(
      'href',
      '/curriculum'
    );
  });

  test('the dead track links are gone from the sidebar', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /Tutorials/ }));
    expect(screen.queryByRole('link', { name: 'Beginners' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Intermediate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Advanced' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Practice Problems' })).not.toBeInTheDocument();
  });
});

describe('navigation UX', () => {
  test('the active route is marked with aria-current and active styling', () => {
    renderLayoutAt('/array');

    const arrayLink = screen.getByRole('link', { name: /Arrays/ });
    expect(arrayLink).toHaveAttribute('aria-current', 'page');
    expect(arrayLink.className).toContain('font-semibold');

    const treeLink = screen.getByRole('link', { name: 'Trees' });
    expect(treeLink).not.toHaveAttribute('aria-current');
    expect(treeLink.className).not.toContain('font-semibold');
  });

  test('collapsing the sidebar keeps the icon rail and unmounts submenu labels', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation' }));

    // submenu links unmount when the rail collapses; top-level links remain
    const nav = screen.getByRole('navigation');
    const hrefs = within(nav).getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).not.toContain('/array');
    expect(hrefs).not.toContain('/tree');
  });

  test('an open sidebar shows the mobile backdrop for tap-to-close', () => {
    renderLayout();
    expect(document.querySelector('.fixed.inset-0.z-30')).not.toBeNull();
  });

  test('route changes render page content inside the workspace', () => {
    renderLayoutAt('/array');
    expect(screen.getByRole('main').textContent).toContain('Array page');
  });
});

describe('mobile drawer keyboard support', () => {
  test('Escape closes the sidebar drawer', () => {
    renderLayout();
    expect(document.querySelector('.fixed.inset-0.z-30')).not.toBeNull();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(document.querySelector('.fixed.inset-0.z-30')).toBeNull();
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar.className).toContain('-translate-x-full');
  });
});

describe('dark mode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('theme toggle flips the html dark class and persists it', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('restores a persisted dark theme on mount', () => {
    localStorage.setItem('theme', 'dark');
    renderLayout();

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});

describe('sidebar usefulness (open + collapsed)', () => {
  test('clicking a collapsed category re-opens the rail and expands it', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation' }));
    // submenu links unmount when collapsed
    expect(screen.queryByRole('link', { name: 'Trees' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Data Structures' }));

    // rail re-opened + section expanded in one click
    expect(screen.getByRole('link', { name: 'Trees' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Data Structures' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('the category containing the active route is highlighted', () => {
    renderLayoutAt('/array');

    const dataStructures = screen.getByRole('button', { name: 'Data Structures' });
    expect(dataStructures.className).toContain('font-semibold');

    const algorithms = screen.getByRole('button', { name: 'Algorithms' });
    expect(algorithms.className).not.toContain('font-semibold');
  });

  test('collapsed rail keeps aria-labels on icon-only links', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation' }));

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Data Structures' })).toBeInTheDocument();
  });
});
