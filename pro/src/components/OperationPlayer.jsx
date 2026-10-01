import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import CodePane from './CodePane';

const STEP_MS = 1000;

const KIND_CHIP_CLASSES = {
  compare:
    'bg-compare-100 text-compare-800 border-compare-300 dark:bg-compare-900/40 dark:text-compare-200 dark:border-compare-700',
  move:
    'bg-move-100 text-move-800 border-move-300 dark:bg-move-900/40 dark:text-move-200 dark:border-move-700',
  found:
    'bg-found-100 text-found-800 border-found-300 dark:bg-found-900/40 dark:text-found-200 dark:border-found-700',
  error:
    'bg-error-100 text-error-800 border-error-300 dark:bg-error-900/40 dark:text-error-200 dark:border-error-700',
};

const OperationPlayer = ({
  steps = [],
  onComplete,
  onPlayStateChange,
  title = 'Operation Steps',
  pseudocode = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [finished, setFinished] = useState(false);

  const onCompleteRef = useRef(onComplete);
  const onPlayStateRef = useRef(onPlayStateChange);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  useEffect(() => {
    onPlayStateRef.current = onPlayStateChange;
  });

  const changePlayState = useCallback((playing) => {
    setIsPlaying(playing);
    onPlayStateRef.current?.(playing);
  }, []);

  useEffect(() => {
    if (steps.length === 0) {
      setCurrentStep(0);
      setFinished(false);
      changePlayState(false);
      return;
    }
    setCurrentStep(0);
    setFinished(false);
    steps[0]?.action?.();
    changePlayState(true);
  }, [steps, changePlayState]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (currentStep >= steps.length - 1) {
      const timer = setTimeout(() => {
        setFinished(true);
        changePlayState(false);
        onCompleteRef.current?.();
      }, STEP_MS / speed);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      const next = currentStep + 1;
      setCurrentStep(next);
      steps[next]?.action?.();
    }, STEP_MS / speed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, speed, steps, changePlayState]);

  const seek = useCallback(
    (index) => {
      const idx = Math.min(Math.max(index, 0), Math.max(steps.length - 1, 0));
      setCurrentStep(idx);
      setFinished(false);
      for (let i = 0; i <= idx; i++) {
        steps[i]?.action?.();
      }
    },
    [steps]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      changePlayState(false);
      return;
    }
    if (finished) {
      seek(0);
    }
    changePlayState(true);
  }, [isPlaying, finished, seek, changePlayState]);

  const goNext = useCallback(() => {
    changePlayState(false);
    seek(currentStep + 1);
  }, [changePlayState, seek, currentStep]);

  const goPrev = useCallback(() => {
    changePlayState(false);
    seek(currentStep - 1);
  }, [changePlayState, seek, currentStep]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || steps.length === 0) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [steps.length, togglePlay, goNext, goPrev]);

  if (steps.length === 0) return null;

  // A new run can arrive while currentStep still points past its end (the
  // reset effect only runs after this render) — clamp so render never reads
  // an out-of-range step.
  const stepIndex = Math.min(currentStep, steps.length - 1);
  const step = steps[stepIndex];

  const progress = ((stepIndex + 1) / steps.length) * 100;
  const cycleSpeed = () => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 0.5 : 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="operation-visualizer"
    >
      <h3>{title}</h3>
      <div className={`player-body${pseudocode ? ' with-code' : ''}`}>
        <div className="steps-container">
        <p className="current-step" aria-live="polite">
          {step.kind && KIND_CHIP_CLASSES[step.kind] && (
            <span
              className={`step-chip ${KIND_CHIP_CLASSES[step.kind]}`}
              aria-hidden="true"
            >
              {step.kind}
            </span>
          )}
          {step?.description}
        </p>
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <div className="player-controls">
          <button
            type="button"
            className="player-btn"
            onClick={goPrev}
            disabled={stepIndex === 0}
            aria-label="Previous step"
          >
            ⏮
          </button>
          <button
            type="button"
            className="player-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            type="button"
            className="player-btn"
            onClick={goNext}
            disabled={stepIndex >= steps.length - 1}
            aria-label="Next step"
          >
            ⏭
          </button>
          <button
            type="button"
            className="player-btn player-speed"
            onClick={cycleSpeed}
            aria-label={`Speed ${speed}x`}
          >
            {speed}×
          </button>
          <input
            type="range"
            className="player-scrub"
            min={0}
            max={steps.length - 1}
            value={stepIndex}
            onChange={(e) => {
              changePlayState(false);
              seek(Number(e.target.value));
            }}
            aria-label="Step position"
          />
          <span className="player-counter">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>
        </div>
        {pseudocode && (
          <CodePane
            lines={pseudocode}
            line={step?.line}
            vars={step?.vars}
          />
        )}
      </div>
    </motion.div>
  );
};

export default OperationPlayer;
