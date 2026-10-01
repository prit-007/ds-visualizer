import { render, screen, fireEvent } from '@testing-library/react';
import CasePresets from './CasePresets';

describe('CasePresets', () => {
  test('renders one button per preset and forwards clicks', () => {
    const onWorst = vi.fn();
    const onRandom = vi.fn();
    render(
      <CasePresets
        presets={[
          { label: 'Worst case', onClick: onWorst },
          { label: 'Random case', onClick: onRandom },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Worst case' }));
    expect(onWorst).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Random case' })).toBeInTheDocument();
  });

  test('disables every preset while an animation runs', () => {
    render(
      <CasePresets
        disabled
        presets={[{ label: 'Worst case', onClick: vi.fn() }]}
      />
    );

    expect(screen.getByRole('button', { name: 'Worst case' })).toBeDisabled();
  });
});
