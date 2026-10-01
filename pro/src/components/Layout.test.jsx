import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { TOUR_STEPS } from '../lib/tourSteps';

const renderLayout = () =>
  render(
    <MemoryRouter>
      <Layout />
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
