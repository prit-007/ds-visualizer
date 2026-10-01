import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LessonReader from './LessonReader';
import { LESSONS } from '../lessons';

vi.mock('../lib/celebration', () => ({ fireCelebration: vi.fn() }));

const renderReader = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lessons/:slug" element={<LessonReader />} />
      </Routes>
    </MemoryRouter>
  );

describe('LessonReader', () => {
  test('renders the lesson matched by the slug with its full heading', () => {
    const lesson = LESSONS[0];
    renderReader(`/lessons/${lesson.slug}`);

    expect(screen.getByRole('heading', { level: 1, name: lesson.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to lessons/i })).toHaveAttribute(
      'href',
      '/lessons'
    );
  });

  test('unknown slug shows an empty state with a way back', () => {
    renderReader('/lessons/not-a-real-slug');

    expect(screen.getByText(/lesson not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to lessons/i })).toHaveAttribute(
      'href',
      '/lessons'
    );
  });
});

describe('lesson completion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('marking complete stores xp, fires celebration and disables the button', async () => {
    const { fireCelebration } = await import('../lib/celebration');
    renderReader(`/lessons/${LESSONS[0].slug}`);

    fireEvent.click(screen.getByRole('button', { name: 'Mark as complete' }));

    const stored = JSON.parse(localStorage.getItem('ds-visualizer:progress'));
    expect(stored.lessons[LESSONS[0].slug]).toBe(true);
    expect(stored.xp).toBe(25);
    expect(fireCelebration).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /completed/i })).toBeDisabled();
  });

  test('a completed lesson renders as already done on next visit', async () => {
    localStorage.setItem(
      'ds-visualizer:progress',
      JSON.stringify({ version: 1, xp: 25, lessons: { [LESSONS[0].slug]: true } })
    );
    renderReader(`/lessons/${LESSONS[0].slug}`);

    expect(screen.getByRole('button', { name: /completed/i })).toBeDisabled();
  });
});
