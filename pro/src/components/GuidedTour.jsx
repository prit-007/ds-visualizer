import { useCallback, useEffect, useRef } from 'react';
import { Compass } from 'lucide-react';
import { driver } from 'driver.js';
import { TOUR_STEPS, TOUR_COMPLETED_KEY } from '../lib/tourSteps';
import { prefersReducedMotion } from '../lib/motionPrefs';

const GuidedTour = ({ collapsed = false }) => {
  const driverRef = useRef(null);

  const startTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }
    const driverObj = driver({
      steps: TOUR_STEPS,
      animate: !prefersReducedMotion(),
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_COMPLETED_KEY, '1');
        driverObj.destroy();
      },
    });
    driverRef.current = driverObj;
    driverObj.drive();
  }, []);

  useEffect(() => {
    if (localStorage.getItem(TOUR_COMPLETED_KEY) !== '1') {
      startTour();
    }
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [startTour]);

  return (
    <li>
      <button
        type="button"
        onClick={startTour}
        aria-label="Take the guided tour"
        className="w-full flex items-center px-4 py-2 text-left text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl"
      >
        <Compass size={20} />
        {!collapsed && <span className="ml-3 font-medium">Take the tour</span>}
      </button>
    </li>
  );
};

export default GuidedTour;
