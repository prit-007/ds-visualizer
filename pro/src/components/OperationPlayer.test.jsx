import { render, screen, fireEvent, act } from '@testing-library/react';
import OperationPlayer from './OperationPlayer';

const makeSteps = () => [
  { description: 'step one', action: vi.fn() },
  { description: 'step two', action: vi.fn() },
  { description: 'step three', action: vi.fn() },
];

const advance = (ms) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('OperationPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('plays through every step and calls onComplete once', () => {
    const steps = makeSteps();
    const onComplete = vi.fn();
    render(<OperationPlayer steps={steps} onComplete={onComplete} />);

    expect(steps[0].action).toHaveBeenCalledTimes(1);
    expect(screen.getByText('step one')).toBeInTheDocument();

    advance(1000);
    expect(steps[1].action).toHaveBeenCalledTimes(1);
    expect(screen.getByText('step two')).toBeInTheDocument();

    advance(1000);
    expect(steps[2].action).toHaveBeenCalledTimes(1);
    expect(screen.getByText('step three')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    advance(1000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  test('pausing stops auto-advance and resuming continues', () => {
    const steps = makeSteps();
    render(<OperationPlayer steps={steps} onComplete={vi.fn()} />);

    advance(1000);
    expect(steps[1].action).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    advance(5000);
    expect(steps[2].action).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    advance(1000);
    expect(steps[2].action).toHaveBeenCalledTimes(1);
  });

  test('next and previous step replay actions from the start', () => {
    const steps = makeSteps();
    render(<OperationPlayer steps={steps} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(steps[1].action).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(steps[0].action).toHaveBeenCalledTimes(3);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  test('scrubbing to the last step runs every action up to it', () => {
    const steps = makeSteps();
    render(<OperationPlayer steps={steps} onComplete={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Step position'), { target: { value: '2' } });

    expect(steps[0].action).toHaveBeenCalled();
    expect(steps[1].action).toHaveBeenCalledTimes(1);
    expect(steps[2].action).toHaveBeenCalledTimes(1);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  test('speed 2x advances twice as fast', () => {
    const steps = makeSteps();
    render(<OperationPlayer steps={steps} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Speed 1x' }));
    expect(screen.getByRole('button', { name: 'Speed 2x' })).toBeInTheDocument();

    advance(500);
    expect(steps[1].action).toHaveBeenCalledTimes(1);
  });

  test('keyboard shortcuts: space toggles, arrows step (ignored in inputs)', () => {
    const steps = makeSteps();
    render(<OperationPlayer steps={steps} onComplete={vi.fn()} />);

    fireEvent.keyDown(document.body, { key: ' ' });
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(steps[1].action).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(steps[0].action).toHaveBeenCalledTimes(3);

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(steps[1].action).toHaveBeenCalledTimes(1);
  });

  test('renders nothing when there are no steps', () => {
    const { container } = render(<OperationPlayer steps={[]} onComplete={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders a semantic kind chip for the current step', () => {
    const steps = [
      { description: 'Comparing nodes', action: vi.fn(), kind: 'compare' },
      { description: 'Shifting elements', action: vi.fn(), kind: 'move' },
      { description: 'All done', action: vi.fn(), kind: 'found' },
    ];
    const { container } = render(
      <OperationPlayer steps={steps} onComplete={vi.fn()} />
    );

    const chip = container.querySelector('.step-chip');
    expect(chip).toHaveClass('bg-compare-100', 'text-compare-800');
    expect(chip).toHaveTextContent('compare');
    expect(chip).toHaveAttribute('aria-hidden', 'true');

    advance(1000);
    expect(container.querySelector('.step-chip')).toHaveClass('bg-move-100');
  });

  test('omits the chip for neutral steps', () => {
    const steps = [{ description: 'Starting the operation', action: vi.fn() }];
    const { container } = render(
      <OperationPlayer steps={steps} onComplete={vi.fn()} />
    );
    expect(container.querySelector('.step-chip')).toBeNull();
  });

  test('narrates the current step via aria-live', () => {
    const steps = [
      { description: 'step one', action: vi.fn() },
      { description: 'step two', action: vi.fn() },
    ];
    render(<OperationPlayer steps={steps} onComplete={vi.fn()} />);

    const region = screen.getByText('step one');
    expect(region).toHaveAttribute('aria-live', 'polite');

    advance(1000);
    expect(screen.getByText('step two')).toHaveAttribute('aria-live', 'polite');
  });

  test('notifies play state on start, pause and completion', () => {
    const steps = makeSteps();
    const onPlayStateChange = vi.fn();
    render(
      <OperationPlayer
        steps={steps}
        onComplete={vi.fn()}
        onPlayStateChange={onPlayStateChange}
      />
    );

    expect(onPlayStateChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPlayStateChange).toHaveBeenLastCalledWith(false);
    advance(1000);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(onPlayStateChange).toHaveBeenLastCalledWith(true);
  });

  test('renders the pseudocode pane and highlights the active line', () => {
    const steps = [
      { description: 'step one', action: vi.fn(), line: 1 },
      { description: 'step two', action: vi.fn(), line: 3, vars: { value: 7 } },
    ];
    const { container } = render(
      <OperationPlayer steps={steps} onComplete={vi.fn()} pseudocode={['a', 'b', 'c']} />
    );

    const lines = container.querySelectorAll('.code-line');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toHaveClass('active');
    expect(screen.queryByText('Variables')).not.toBeInTheDocument();

    advance(1000);
    const after = container.querySelectorAll('.code-line');
    expect(after[2]).toHaveClass('active');
    expect(after[0]).not.toHaveClass('active');
    expect(screen.getByText('Variables')).toBeInTheDocument();
    const watch = container.querySelector('.var-watch').textContent;
    expect(watch).toContain('value');
    expect(watch).toContain('7');
  });

  test('omits the code pane when no pseudocode is provided', () => {
    const { container } = render(
      <OperationPlayer steps={makeSteps()} onComplete={vi.fn()} />
    );
    expect(container.querySelector('.code-pane')).toBeNull();
  });

  test('rerendering with a shorter step list after finishing stays in bounds', () => {
    const longSteps = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'].map((description) => ({
      description,
      action: vi.fn(),
    }));
    const { rerender, container } = render(
      <OperationPlayer steps={longSteps} onComplete={vi.fn()} />
    );

    // Drive the long run to its end: currentStep rests on the last index.
    for (let i = 0; i < 8; i += 1) advance(1000);

    // A new, shorter run arrives before the reset effect can run.
    expect(() =>
      rerender(<OperationPlayer steps={makeSteps()} onComplete={vi.fn()} />)
    ).not.toThrow();
    expect(container.querySelector('.player-counter')).toHaveTextContent('1 / 3');
  });
});
