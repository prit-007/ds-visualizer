import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PROGRESS_KEY, loadProgress } from '../lib/progress';
import { TOUR_COMPLETED_KEY } from '../lib/tourSteps';
import './Settings.css';

const MOTION_KEY = 'ds-visualizer:motion';

const Settings = () => {
  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );
  const [motion, setMotion] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(MOTION_KEY) || 'auto' : 'auto'
  );
  const [tourSeen, setTourSeen] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TOUR_COMPLETED_KEY) === '1' : true
  );
  const [progress, setProgress] = useState(() => loadProgress());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(t);
  }, [saved]);

  const applyTheme = (next) => {
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    setSaved(true);
  };

  const applyMotion = (next) => {
    setMotion(next);
    localStorage.setItem(MOTION_KEY, next);
    setSaved(true);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setTourSeen(false);
    setSaved(true);
  };

  const resetProgress = () => {
    localStorage.removeItem(PROGRESS_KEY);
    setProgress(loadProgress());
    setSaved(true);
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      {saved && (
        <p className="setting-note" role="status">
          Saved — these apply instantly on this device.
        </p>
      )}

      <section className="setting-card">
        <h2>Theme</h2>
        <div className="setting-row">
          {['light', 'dark'].map((t) => (
            <button
              key={t}
              type="button"
              className="setting-btn"
              aria-pressed={theme === t}
              onClick={() => applyTheme(t)}
            >
              {t === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
        <p className="setting-note">Also toggled from the sun/moon button in the header.</p>
      </section>

      <section className="setting-card">
        <h2>Motion</h2>
        <div className="setting-row">
          {[
            ['auto', 'System default'],
            ['reduce', 'Reduce animations'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="setting-btn"
              aria-pressed={motion === value}
              onClick={() => applyMotion(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="setting-note">
          “Reduce” disables page transitions, tweens and the step-chip pulse for a calmer,
          vestibular-safe experience.
        </p>
      </section>

      <section className="setting-card">
        <h2>Guided tour</h2>
        <div className="setting-row">
          <button type="button" className="setting-btn" onClick={resetTour}>
            Replay the tour
          </button>
        </div>
        <p className="setting-note">
          {tourSeen
            ? 'You have finished the tour — reset it to show it again on the next visit.'
            : 'The tour will replay on your next visit.'}
        </p>
      </section>

      <section className="setting-card">
        <h2>Learning progress</h2>
        <p className="setting-note">
          XP {progress.xp} · streak {progress.streak.count} days ·{' '}
          {Object.keys(progress.operations).length} operations ·{' '}
          {Object.keys(progress.lessons).length} lessons completed
        </p>
        <div className="setting-row">
          <button type="button" className="setting-btn danger" onClick={resetProgress}>
            Reset all progress
          </button>
        </div>
        <p className="setting-note">
          Progress lives only in this browser (localStorage) — resetting clears XP, streaks,
          mastery and lesson completions.
        </p>
      </section>

      <p className="setting-note">
        Everything here is device-local and offline. See{' '}
        <Link to="/help">Help &amp; Shortcuts</Link> for more.
      </p>
    </div>
  );
};

export default Settings;
