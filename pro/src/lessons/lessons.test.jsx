import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LESSONS, getLesson } from './index';

describe('lesson manifest', () => {
  test('exposes one lesson per implemented structure with unique slugs', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(3);
    const slugs = LESSONS.map((lesson) => lesson.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    LESSONS.forEach((lesson) => {
      expect(lesson.title.trim()).toBe(lesson.title);
      expect(lesson.title.length).toBeGreaterThan(0);
      expect(lesson.summary.length).toBeGreaterThan(20);
      expect(['array', 'linked-list', 'tree']).toContain(lesson.structure);
      expect(typeof lesson.Component).toBe('function');
    });
  });

  test('getLesson resolves by slug and misses unknown slugs', () => {
    const first = LESSONS[0];
    expect(getLesson(first.slug)).toBe(first);
    expect(getLesson('definitely-not-a-lesson')).toBeUndefined();
  });

  test('every lesson compiles through the MDX pipeline and renders content', () => {
    LESSONS.forEach((lesson) => {
      const { container } = render(
        <MemoryRouter>
          <lesson.Component />
        </MemoryRouter>
      );
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.textContent.length).toBeGreaterThan(100);
      cleanup();
    });
  });
});
