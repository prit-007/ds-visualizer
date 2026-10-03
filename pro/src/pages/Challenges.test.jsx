import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Challenges from './Challenges';

const moduleUrl = import.meta.url;

describe('Challenges', () => {
  test('renders the challenge with defaults and an empty state', () => {
    render(<Challenges />);

    expect(screen.getByRole('heading', { name: /adversarial challenges/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/insertion order/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search target/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /evaluate/i })).toBeInTheDocument();
    expect(document.querySelector('.challenge-empty')).toBeInTheDocument();
  });

  test('a sorted attempt with rotations off scores perfect', () => {
    render(<Challenges />);

    fireEvent.click(screen.getByRole('button', { name: /evaluate/i }));

    const result = document.querySelector('.challenge-result');
    expect(result).toBeInTheDocument();
    expect(result).toHaveTextContent('5 / max 5');
    expect(document.querySelector('.challenge-grade-perfect')).toBeInTheDocument();
    expect(result).toHaveTextContent(/worst case/i);
    expect(document.querySelector('.challenge-empty')).not.toBeInTheDocument();
  });

  test('enabling rotations caps the achievable maximum', () => {
    render(<Challenges />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle AVL rotations' }));
    fireEvent.click(screen.getByRole('button', { name: /evaluate/i }));

    const result = document.querySelector('.challenge-result');
    // sorted order no longer reaches n=5 — balance caps every order at 3
    expect(result).toHaveTextContent('3 / max 3');
    expect(document.querySelector('.challenge-grade-perfect')).toBeInTheDocument();
  });

  test('rejects duplicate values with an alert', () => {
    render(<Challenges />);

    fireEvent.change(screen.getByLabelText(/insertion order/i), {
      target: { value: '10, 10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /evaluate/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/unique/i);
    expect(document.querySelector('.challenge-result')).not.toBeInTheDocument();
  });

  test('css contract: page styles live in Challenges.css', () => {
    const css = readFileSync(fileURLToPath(new URL('./Challenges.css', moduleUrl)), 'utf8');

    expect(css).toMatch(/\.challenge-page\s*\{/);
    expect(css).toMatch(/\.challenge-card\s*\{/);
    expect(css).toMatch(/\.challenge-result\s*\{/);
    expect(css).toMatch(/\.challenge-grade-perfect\s*\{/);
    expect(css).toMatch(/\.dark \.challenge-page/);
  });
});
