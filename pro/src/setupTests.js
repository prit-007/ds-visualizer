// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TOUR_COMPLETED_KEY } from './lib/tourSteps';

// Tests start as a returning visitor so the guided tour only auto-starts in
// GuidedTour.test — other suites render Layout with the tour dormant
// instead of spawning a real overlay.
localStorage.setItem(TOUR_COMPLETED_KEY, '1');
