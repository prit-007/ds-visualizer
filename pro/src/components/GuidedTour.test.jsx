import { render, screen, fireEvent, act } from '@testing-library/react';
import GuidedTour from './GuidedTour';
import { TOUR_STEPS, TOUR_COMPLETED_KEY } from '../lib/tourSteps';

const mocks = vi.hoisted(() => ({
  driver: vi.fn(),
  drive: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock('driver.js', () => ({ driver: mocks.driver }));

describe('GuidedTour', () => {
  let capturedOptions;

  beforeEach(() => {
    localStorage.clear();
    mocks.driver.mockReset();
    mocks.drive.mockReset();
    mocks.destroy.mockReset();
    mocks.driver.mockImplementation((options) => {
      capturedOptions = options;
      return { drive: mocks.drive, destroy: mocks.destroy };
    });
  });

  test('auto-starts the tour on a first visit', () => {
    render(<GuidedTour />);

    expect(mocks.driver).toHaveBeenCalledTimes(1);
    expect(mocks.driver.mock.calls[0][0].steps).toEqual(TOUR_STEPS);
    expect(mocks.drive).toHaveBeenCalledTimes(1);
  });

  test('stays dormant once the tour has been seen', () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, '1');
    render(<GuidedTour />);

    expect(mocks.driver).not.toHaveBeenCalled();
    expect(mocks.drive).not.toHaveBeenCalled();
  });

  test('user closing the tour persists the completed flag and destroys it', () => {
    render(<GuidedTour />);

    expect(typeof capturedOptions.onDestroyStarted).toBe('function');
    act(() => {
      capturedOptions.onDestroyStarted();
    });

    expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBe('1');
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
  });

  test('unmounting destroys the driver without marking it completed', () => {
    const { unmount } = render(<GuidedTour />);
    unmount();

    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBeNull();
  });

  test('the replay button starts a fresh tour after completion', () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, '1');
    render(<GuidedTour />);

    fireEvent.click(screen.getByRole('button', { name: 'Take the guided tour' }));

    expect(mocks.driver).toHaveBeenCalledTimes(1);
    expect(mocks.drive).toHaveBeenCalledTimes(1);
  });

  test('collapsed sidebar hides the label but keeps the accessible name', () => {
    render(<GuidedTour collapsed />);

    expect(screen.getByRole('button', { name: 'Take the guided tour' })).toBeInTheDocument();
    expect(screen.queryByText('Take the tour')).not.toBeInTheDocument();
  });
});
