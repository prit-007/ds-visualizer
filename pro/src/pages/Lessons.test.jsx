import { render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { MemoryRouter } from 'react-router-dom';
import Lessons from './Lessons';
import { LESSONS } from '../lessons';

describe('Lessons list', () => {
  test('lists every lesson as a link to its reader route', () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /lessons/i })).toBeInTheDocument();
    LESSONS.forEach((lesson) => {
      const link = screen.getByRole('link', { name: new RegExp(lesson.title) });
      expect(link).toHaveAttribute('href', `/lessons/${lesson.slug}`);
    });
  });

  test('cards show the summary and structure tag', () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    LESSONS.forEach((lesson) => {
      expect(screen.getByText(lesson.summary)).toBeInTheDocument();
      expect(screen.getByText(lesson.structure)).toBeInTheDocument();
    });
  });

  test('css contract: cards and article prose styles exist', () => {
    const moduleUrl = import.meta.url;
    const css = readFileSync(fileURLToPath(new URL('./Lessons.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.lesson-card\s*\{/);
    expect(css).toMatch(/\.lesson-article\s*\{/);
    expect(css).toMatch(/\.dark \.lesson-card/);
    expect(css).toMatch(/\.progress-summary\s*\{/);
    expect(css).toMatch(/\.lesson-complete\s*\{/);
    expect(css).toMatch(/\.dark \.progress-summary/);
  });
});

describe('progress summary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows xp, streak and completed lesson count from the store', () => {
    localStorage.setItem(
      'ds-visualizer:progress',
      JSON.stringify({
        version: 1,
        xp: 42,
        streak: { count: 3, lastDay: '2026-10-01' },
        lessons: { [LESSONS[0].slug]: true },
        operations: {},
        predictions: { correct: 1, total: 2 },
      })
    );
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    expect(screen.getByText('XP 42')).toBeInTheDocument();
    expect(screen.getByText('Streak 3')).toBeInTheDocument();
    expect(screen.getByText(`Lessons 1 / ${LESSONS.length}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(LESSONS[0].title) })).toHaveClass(
      'completed'
    );
  });
});
