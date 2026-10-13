import { render, screen, fireEvent } from '@testing-library/react';
import Playground from './Playground';

vi.mock('gsap', () => ({ gsap: { to: vi.fn(), set: vi.fn(), timeline: vi.fn() } }));

describe('Playground', () => {
  test('renders the editor, default body and run button', () => {
    render(<Playground />);
    expect(screen.getByLabelText('Algorithm body')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5, 3, 8, 1, 9, 2')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('5, 3, 8, 1, 9, 2'), {
      target: { value: '2, 1' },
    });
    expect(screen.getByRole('button', { name: 'Run Playground' })).toBeInTheDocument();
  });

  test('compiles the default bubble-sort body into steps and starts the player', () => {
    render(<Playground />);
    fireEvent.change(screen.getByPlaceholderText('5, 3, 8, 1, 9, 2'), {
      target: { value: '2, 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run Playground' }));

    // OperationPlayer mounts with compiled steps
    expect(document.querySelector('.operation-visualizer')).not.toBeNull();
  });

  test('a broken body surfaces a compile error', () => {
    render(<Playground />);
    fireEvent.change(screen.getByLabelText('Algorithm body'), {
      target: { value: 'not valid javascript ((' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run Playground' }));
    expect(screen.getByText(/Compile error:/)).toBeInTheDocument();
  });
});
