import { useCallback, useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';
import { TOUR_STEPS, TOUR_COMPLETED_KEY } from '../lib/tourSteps';

// Custom guided tour: a fixed overlay + viewport-clamped spotlight measured
// from the anchor's getBoundingClientRect, with re-measure on scroll/resize
// so it stays glued to the target inside the scrolling workspace shell.
// (driver.js mis-anchored after the layout overhaul — popovers pointed at
// off-canvas drawer content and never re-positioned.)

const POPOVER_WIDTH = 340;

const GuidedTour = ({ collapsed = false, onRequestOpen }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [box, setBox] = useState(null);
  const [popPos, setPopPos] = useState(null);
  const popoverRef = useRef(null);
  // Latest onRequestOpen without making the auto-start effect re-fire on
  // every Layout re-render (inline arrow → new identity each render).
  const onRequestOpenRef = useRef(onRequestOpen);

  const persistCompleted = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, '1');
  };

  const measure = useCallback((index) => {
    const step = TOUR_STEPS[index];
    if (!step) return;
    const el = document.querySelector(step.element);
    if (!el) return;
    const raw = el.getBoundingClientRect();
    // No layout engine (jsdom) or a fully collapsed target: fall back to
    // fixed geometry so the popover still renders; in real browsers a
    // collapsed drawer has zero client rects and we ask the shell to open.
    const hasLayout = raw.width > 0 || raw.height > 0;
    if (!hasLayout) {
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - 24);
      setBox({ top: 12, left: 12, width: 240, height: 72 });
      setPopPos({ top: 100, left: 12, width });
      return;
    }
    if (!el.getClientRects().length || raw.width < 8) {
      onRequestOpen?.();
      window.requestAnimationFrame(() => measure(index));
      return;
    }
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      setBox({
        top: Math.max(4, rect.top - 6),
        left: Math.max(4, rect.left - 6),
        width: rect.width + 12,
        height: rect.height + 12,
      });
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - 24);
      let top = rect.bottom + 12;
      if (top + 190 > window.innerHeight) top = Math.max(12, rect.top - 200);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      setPopPos({ top, left, width });
    });
  }, [onRequestOpen]);

  const startTour = useCallback(() => {
    onRequestOpen?.();
    setActiveIndex(0);
  }, [onRequestOpen]);

  const finishTour = useCallback(() => {
    persistCompleted();
    setActiveIndex(-1);
    setBox(null);
    setPopPos(null);
  }, []);

  const goNext = () => {
    if (activeIndex >= TOUR_STEPS.length - 1) {
      finishTour();
      return;
    }
    setActiveIndex((i) => i + 1);
  };

  useEffect(() => {
    onRequestOpenRef.current = onRequestOpen;
  });

  // Auto-start on a first visit only — mount-once, regardless of how many
  // times Layout re-renders (sidebar toggles, theme flips, route changes).
  useEffect(() => {
    if (localStorage.getItem(TOUR_COMPLETED_KEY) !== '1') {
      onRequestOpenRef.current?.();
      setActiveIndex(0);
    }
  }, []);

  // Measure on step change, scroll and resize.
  useEffect(() => {
    if (activeIndex < 0) return undefined;
    measure(activeIndex);
    const onMove = () => measure(activeIndex);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [activeIndex, measure]);

  // Escape closes and counts as seen (user dismissal, like driver.js).
  useEffect(() => {
    if (activeIndex < 0) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') finishTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, finishTour]);

  // Keep focus inside the popover for keyboard users.
  useEffect(() => {
    if (activeIndex >= 0 && popoverRef.current) popoverRef.current.focus();
  }, [activeIndex]);

  const step = activeIndex >= 0 ? TOUR_STEPS[activeIndex] : null;

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

      {activeIndex >= 0 && box && popPos && (
        <div className="tour-root" role="dialog" aria-modal="true" aria-label="Guided tour">
          <div className="tour-overlay" onClick={finishTour} aria-hidden="true" />
          <div
            className="tour-spotlight"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
            aria-hidden="true"
          />
          <div
            ref={popoverRef}
            tabIndex={-1}
            className="tour-popover"
            style={{ top: popPos.top, left: popPos.left, width: popPos.width }}
          >
            <p className="tour-step-count">
              Step {activeIndex + 1} of {TOUR_STEPS.length}
            </p>
            <h4 className="tour-title">{step.popover.title}</h4>
            <p className="tour-desc">{step.popover.description}</p>
            <div className="tour-actions">
              <button type="button" className="tour-btn ghost" onClick={finishTour}>
                Skip
              </button>
              <button type="button" className="tour-btn" onClick={goNext}>
                {activeIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export default GuidedTour;
