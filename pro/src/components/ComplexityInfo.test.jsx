import { render, screen } from '@testing-library/react';
import ComplexityInfo from './ComplexityInfo';

describe('ComplexityInfo', () => {
  test('renders operation, complexity and explanation', () => {
    render(
      <ComplexityInfo
        operationName="Insert"
        complexity="O(log n)"
        explanation="Balanced trees keep the walk short."
      />
    );
    expect(screen.getByRole('heading', { name: 'Time Complexity' })).toBeInTheDocument();
    expect(screen.getByText('Insert:')).toBeInTheDocument();
    expect(screen.getByText('O(log n)')).toBeInTheDocument();
    expect(screen.getByText('Balanced trees keep the walk short.')).toBeInTheDocument();
  });
});
