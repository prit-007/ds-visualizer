import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import CodePane from './CodePane';
import { buildPredictionQuestion } from '../lib/prediction';
import { countKinds } from '../lib/opCounters';

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
  onPredictionAnswer,
  title = 'Operation Steps',
  pseudocode = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [finished, setFinished] = useState(false);
  const [predictMode, setPredictMode] = useState(false);
  const [question, setQuestion] = useState(null);
  const [pendingResume, setPendingResume] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

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
      setQuestion(null);
      setPendingResume(false);
      setScore({ correct: 0, total: 0 });
      changePlayState(false);
      return;
    }
    setCurrentStep(0);
    setFinished(false);
    setQuestion(null);
    setPendingResume(false);
    setScore({ correct: 0, total: 0 });
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
      if (predictMode) {
        const guessed = buildPredictionQuestion(steps, currentStep);
        if (guessed) {
          setQuestion(guessed);
          setPendingResume(true);
          changePlayState(false);
          return;
        }
      }
      setCurrentStep(next);
      steps[next]?.action?.();
    }, STEP_MS / speed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, speed, steps, changePlayState, predictMode]);

  const seek = useCallback(
    (index) => {
      const idx = Math.min(Math.max(index, 0), Math.max(steps.length - 1, 0));
      setQuestion(null);
      setPendingResume(false);
      setCurrentStep(idx);
      setFinished(false);
      for (let i = 0; i <= idx; i++) {
        steps[i]?.action?.();
      }
    },
    [steps]
  );

  const togglePlay = useCallback(() => {
    if (question) return;
    if (isPlaying) {
      changePlayState(false);
      return;
    }
    if (finished) {
      seek(0);
    }
    changePlayState(true);
  }, [question, isPlaying, finished, seek, changePlayState]);

  const goNext = useCallback(() => {
    if (question) return;
    if (predictMode) {
      const guessed = buildPredictionQuestion(steps, currentStep);
      if (guessed) {
        changePlayState(false);
        setPendingResume(false);
        setQuestion(guessed);
        return;
      }
    }
    changePlayState(false);
    seek(currentStep + 1);
  }, [question, predictMode, changePlayState, seek, currentStep, steps]);

  const goPrev = useCallback(() => {
    changePlayState(false);
    seek(currentStep - 1);
  }, [changePlayState, seek, currentStep]);

  const togglePredict = useCallback(() => {
    setQuestion(null);
    setPendingResume(false);
    setPredictMode((p) => !p);
  }, []);

  const answerPrediction = useCallback(
    (guessIndex) => {
      if (!question) return;
      const wasCorrect = guessIndex === question.correctIndex;
      setScore((s) => ({ correct: s.correct + (wasCorrect ? 1 : 0), total: s.total + 1 }));
      onPredictionAnswer?.(wasCorrect);
      setQuestion(null);
      const resume = pendingResume;
      setPendingResume(false);
      seek(Math.min(currentStep + 1, steps.length - 1));
      if (resume) changePlayState(true);
    },
    [question, pendingResume, currentStep, steps.length, seek, changePlayState, onPredictionAnswer]
  );

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
  const counters = steps.length > 0 ? countKinds(steps, stepIndex) : null;
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
        {question && (
          <div className="prediction-panel" role="group" aria-label="Prediction choices">
            <p className="prediction-prompt">{question.prompt}</p>
            {question.options.map((option, idx) => (
              <button
                key={option}
                type="button"
                className="prediction-option"
                onClick={() => answerPrediction(idx)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        {counters && (
          <div className="op-counters" role="group" aria-label="Operation counters">
            <span className="op-counter" data-kind="compare">
              Compares {counters.compare}
            </span>
            <span className="op-counter" data-kind="move">
              Moves {counters.move}
            </span>
            <span className="op-counter" data-kind="found">
              Found {counters.found}
            </span>
            <span className="op-counter" data-kind="error">
              Errors {counters.error}
            </span>
            <span className="op-counter" data-kind="total">
              Steps {counters.total}
            </span>
          </div>
        )}
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
            disabled={stepIndex >= steps.length - 1 || Boolean(question)}
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
          <button
            type="button"
            className={`player-predict${predictMode ? ' active' : ''}`}
            onClick={togglePredict}
            aria-pressed={predictMode}
            aria-label="Predict next step"
          >
            🎯
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
          {predictMode && (
            <span className="prediction-score">
              Score {score.correct} / {score.total}
            </span>
          )}
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
