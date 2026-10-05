import { render, screen, fireEvent } from '@testing-library/react';
import GuidedTour from './GuidedTour';
import { TOUR_STEPS, TOUR_COMPLETED_KEY } from '../lib/tourSteps';

// Anchor stubs so getBoundingClientRect has something real to measure.
const mountAnchors = () => {
  document.body.innerHTML += `
    <div class="sidebar" style="width:200px;height:300px"></div>
    <div class="workspace" style="width:600px;height:400px"></div>
    <button class="theme-toggle" style="width:40px;height:40px"></button>
    <div class="sidebar-footer" style="width:200px;height:80px"></div>
  `;
};

describe('GuidedTour (custom overlay)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    mountAnchors();
  });

  test('auto-starts on a first visit and shows step 1', () => {
    render(<GuidedTour />);

    expect(screen.getByRole('dialog', { name: 'Guided tour' })).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].popover.title)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
  });

  test('stays dormant once the tour has been seen', () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, '1');
    render(<GuidedTour />);

    expect(screen.queryByRole('dialog', { name: 'Guided tour' })).not.toBeInTheDocument();
  });

  test('Next advances through the steps', () => {
    render(<GuidedTour />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(TOUR_STEPS[1].popover.title)).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
  });

  test('Finish on the last step persists the completed flag', () => {
    render(<GuidedTour />);

    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBe('1');
    expect(screen.queryByRole('dialog', { name: 'Guided tour' })).not.toBeInTheDocument();
  });

  test('Escape closes the tour and marks it completed', () => {
    render(<GuidedTour />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBe('1');
    expect(screen.queryByRole('dialog', { name: 'Guided tour' })).not.toBeInTheDocument();
  });

  test('Skip closes without requiring all steps', () => {
    render(<GuidedTour />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBe('1');
    expect(screen.queryByRole('dialog', { name: 'Guided tour' })).not.toBeInTheDocument();
  });

  test('the replay button starts a fresh tour after completion', () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, '1');
    render(<GuidedTour />);

    fireEvent.click(screen.getByRole('button', { name: 'Take the guided tour' }));

    expect(screen.getByRole('dialog', { name: 'Guided tour' })).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
  });

  test('collapsed sidebar hides the label but keeps the accessible name', () => {
    render(<GuidedTour collapsed />);

    expect(screen.getByRole('button', { name: 'Take the guided tour' })).toBeInTheDocument();
    expect(screen.queryByText('Take the tour')).not.toBeInTheDocument();
  });

  test('requests the shell to open the sidebar so drawer anchors are visible', () => {
    const onRequestOpen = vi.fn();
    render(<GuidedTour onRequestOpen={onRequestOpen} />);

    expect(onRequestOpen).toHaveBeenCalled();
  });

  test('unmounting does not mark the tour completed', () => {
    const { unmount } = render(<GuidedTour />);
    unmount();

    expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBeNull();
  });
});
