import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';
import { PROGRESS_KEY } from '../lib/progress';
import { TOUR_COMPLETED_KEY } from '../lib/tourSteps';

const renderSettings = () =>
  render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  );

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('renders theme, motion, tour and progress cards', () => {
    renderSettings();
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Replay the tour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset all progress' })).toBeInTheDocument();
  });

  test('switching theme persists and flips the html class', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('resetting the tour flag allows a replay', () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, '1');
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Replay the tour' }));
    expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBeNull();
  });

  test('resetting progress clears the store', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ xp: 40, streak: { count: 2, lastDay: 'x' }, operations: {}, lessons: {} }));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Reset all progress' }));
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });
});
