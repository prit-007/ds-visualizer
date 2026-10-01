import { render, screen } from '@testing-library/react';
import MemoryRepresentation from './MemoryRepresentation';

describe('MemoryRepresentation', () => {
  test('renders one cell per block with its address and value', () => {
    const { container } = render(
      <MemoryRepresentation
        blocks={[
          { address: '0x64', value: 10 },
          { address: '0x68', value: 20 },
        ]}
      />
    );

    expect(screen.getByText('Memory Representation')).toBeInTheDocument();
    const cells = container.querySelectorAll('.memory-block');
    expect(cells).toHaveLength(2);
    expect(screen.getByText('0x64')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  test('renders pointer rows for indirect nodes, with null targets', () => {
    const { container } = render(
      <MemoryRepresentation
        blocks={[
          {
            address: '0x2010',
            value: 20,
            pointers: [
              { label: 'left', target: '0x2020' },
              { label: 'right', target: null },
            ],
          },
        ]}
      />
    );

    const pointers = container.querySelectorAll('.memory-pointer');
    expect(pointers).toHaveLength(2);
    expect(pointers[0]).toHaveTextContent('left');
    expect(pointers[0]).toHaveTextContent('0x2020');
    expect(pointers[1]).toHaveTextContent('right');
    expect(pointers[1]).toHaveTextContent('null');
  });

  test('forwards active and shifting highlight states', () => {
    const { container } = render(
      <MemoryRepresentation
        blocks={[
          { address: '0x64', value: 10, isActive: true },
          { address: '0x68', value: 20, isShifting: true },
        ]}
      />
    );

    const cells = container.querySelectorAll('.memory-block');
    expect(cells[0]).toHaveClass('active');
    expect(cells[1]).toHaveClass('shifting');
  });
});
