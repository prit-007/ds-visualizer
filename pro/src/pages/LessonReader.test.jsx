import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LessonReader from './LessonReader';
import { LESSONS } from '../lessons';

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
