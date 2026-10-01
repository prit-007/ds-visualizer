import { TOUR_STEPS, TOUR_COMPLETED_KEY } from './tourSteps';

describe('tour step config', () => {
  test('uses a namespaced localStorage flag', () => {
    expect(TOUR_COMPLETED_KEY).toBe('ds-visualizer:tour-completed');
  });

  test('every step targets a class selector with popover copy', () => {
    expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(3);
    TOUR_STEPS.forEach((step) => {
      expect(step.element).toMatch(/^\.[a-z][a-z0-9-]*$/);
      expect(step.popover.title.trim()).toBe(step.popover.title);
      expect(step.popover.title.length).toBeGreaterThan(0);
      expect(step.popover.description.length).toBeGreaterThan(20);
    });
  });
});
