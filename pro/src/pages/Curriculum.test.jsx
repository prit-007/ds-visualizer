import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MemoryRouter } from 'react-router-dom';
import Curriculum from './Curriculum';
import { CONCEPTS } from '../lib/curriculum';

const renderCurriculum = (progress = null) => {
  if (progress) localStorage.setItem('ds-visualizer:progress', JSON.stringify(progress));
  return render(
    <MemoryRouter>
      <Curriculum />
    </MemoryRouter>
  );
};

describe('Curriculum page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders every concept as a link to its route', () => {
    renderCurriculum();

    CONCEPTS.forEach((concept) => {
      expect(screen.getByRole('link', { name: new RegExp(concept.title) })).toHaveAttribute(
        'href',
        concept.href
      );
    });
  });

  test('draws one edge element per dependency', () => {
    renderCurriculum();

    const totalDeps = CONCEPTS.reduce((n, c) => n + c.deps.length, 0);
    expect(document.querySelectorAll('.curriculum-edge')).toHaveLength(totalDeps);
  });

  test('tints concept nodes by mastery from the progress store', () => {
    renderCurriculum({
      lessons: { array: true },
      operations: { 'array:add': { count: 3, lastAt: null } },
    });

    expect(document.querySelector('.curriculum-node[data-concept="array-basics"]')).toHaveClass(
      'mastery-mastered'
    );
    expect(document.querySelector('.curriculum-node[data-concept="avl-rotations"]')).toHaveClass(
      'mastery-new'
    );
  });

  test('css contract: curriculum styles live in Curriculum.css', () => {
    const moduleUrl = import.meta.url;
    const css = readFileSync(fileURLToPath(new URL('./Curriculum.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.curriculum-canvas\s*\{/);
    expect(css).toMatch(/\.curriculum-node\s*\{/);
    expect(css).toMatch(/\.curriculum-edge\s*\{/);
    expect(css).toMatch(/\.mastery-mastered\s*\{/);
    expect(css).toMatch(/\.dark \.curriculum-node/);
  });
});
