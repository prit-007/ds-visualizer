import { render, screen } from '@testing-library/react';
import PropertyDisplay from './PropertyDisplay';

describe('PropertyDisplay', () => {
  const properties = [
    { name: 'Node Count', value: 3 },
    { name: 'Height', value: 2 },
    { name: 'Balanced', value: 'Yes' },
  ];

  test('renders the panel title', () => {
    render(<PropertyDisplay title="Tree Properties" properties={properties} />);
    expect(screen.getByRole('heading', { name: 'Tree Properties' })).toBeInTheDocument();
  });

  test('renders every property name and value', () => {
    render(<PropertyDisplay title="Tree Properties" properties={properties} />);
    expect(screen.getByText('Node Count:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Height:')).toBeInTheDocument();
    expect(screen.getByText('Balanced:')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  test('renders an empty panel without crashing', () => {
    render(<PropertyDisplay title="Nothing" />);
    expect(screen.getByRole('heading', { name: 'Nothing' })).toBeInTheDocument();
  });
});
