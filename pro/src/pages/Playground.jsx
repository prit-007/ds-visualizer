import React, { useState, useRef } from 'react';
import { recordOperation, recordPrediction } from '../lib/progress';
import OperationPlayer from '../components/OperationPlayer';
import ErrorMessage from '../components/ErrorMessage';
import ElementNode from '../components/ElementNode';
import { AnimatePresence } from 'framer-motion';
import './Playground.css';

// Custom-algorithm playground: write a small function that mutates a copied
// array and narrates with step(description, {kind?, vars?}). The compiler is
// `new Function('values', 'step', body)` — runs entirely in this tab.

export const DEFAULT_BODY = `// Bubble sort — values is an array copy; call step(...) to narrate.
for (let i = 0; i < values.length - 1; i += 1) {
  step('Pass ' + (i + 1) + ': bubbling to the end');
  for (let j = 0; j < values.length - 1 - i; j += 1) {
    step('Compare ' + values[j] + ' and ' + values[j + 1], { kind: 'compare', vars: { j } });
    if (values[j] > values[j + 1]) {
      step('Swap ' + values[j] + ' ↔ ' + values[j + 1], { kind: 'move', vars: { j } });
      [values[j], values[j + 1]] = [values[j + 1], values[j]];
    }
  }
}
step('Playground complete: ' + values.join(', '), { kind: 'found' });`;

const parseNumbers = (raw) => {
  const parts = raw.split(/[,\s]+/).filter((p) => p !== '');
  return parts.map((p) => parseInt(p, 10));
};

const Playground = () => {
  const [body, setBody] = useState(DEFAULT_BODY);
  const [valuesInput, setValuesInput] = useState('5, 3, 8, 1, 9, 2');
  const [compiledSteps, setCompiledSteps] = useState([]);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewValues, setViewValues] = useState([]);
  const containerRef = useRef(null);
  const values = (() => {
    const v = parseNumbers(valuesInput);
    return v;
  })();

  const compile = () => {
    const valuesArray = parseNumbers(valuesInput);
    if (valuesArray.length < 2 || valuesArray.some((v) => !Number.isInteger(v))) {
      setError('Please enter at least two integers for the playground array.');
      return null;
    }
    const steps = [];
    try {
      // User-authored sandbox body runs only in this tab — no remote execution.
      // eslint-disable-next-line no-new-func
      const push = new Function(
        'values',
        'step',
        `${body}\n; return values;`
      );
      const step = (description, opts = {}) => {
        steps.push({
          description,
          kind: opts.kind,
          vars: opts.vars,
          action: () => {
            if (opts.vars && opts.vars.j !== undefined) {
              setActivePair(opts.vars.j);
            }
            setViewValues([...valuesArray]);
          },
        });
      };
      push([...valuesArray], step);
    } catch (e) {
      setError(`Compile error: ${e.message}`);
      return null;
    }
    return steps;
  };

  const setActivePair = (j) => {
    // lightweight: no persistent pair highlighting in the playground
  };

  const handleRun = () => {
    const steps = compile();
    if (!steps) return;
    setCompiledSteps(steps);
    setViewValues([...parseNumbers(valuesInput)]);
    setRun({ steps });
    setError(null);
  };

  const runValues = viewValues.length > 0 ? viewValues : values;

  return (
    <div className="playground-page" ref={containerRef}>
      <h1>Algorithm Playground</h1>
      <p className="page-tagline">Write a tiny algorithm in your browser and watch it run step by step.</p>

      <p className="playground-hint" aria-label="Playground instructions">
        {`You get a copy called values plus a helper step(description, { kind, vars }).
Return nothing — narration is everything. Write an array algorithm (sorting, searching)
and press Run Playground.`}
      </p>

      <textarea
        className="playground-editor"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        spellCheck={false}
        aria-label="Algorithm body"
      />

      <div className="input-group" style={{ marginTop: '0.75rem' }}>
        <label>Array:</label>
        <input
          type="text"
          value={valuesInput}
          onChange={(e) => setValuesInput(e.target.value)}
          placeholder="5, 3, 8, 1, 9, 2"
        />
      </div>

      <ErrorMessage message={error} />

      <div className="throwout">
        <button
          type="button"
          className="operation-button"
          onClick={handleRun}
          style={{ marginTop: 0, width: 'auto', padding: '0.5rem 1.25rem' }}
          disabled={isAnimating}
        >
          Run Playground
        </button>
      </div>

      {runValues.length > 0 && (
        <div className="sorting-canvas">
          <AnimatePresence mode="popLayout">
            {runValues.map((v, i) => (
              <ElementNode key={`${i}-${v}`} value={v} index={i} className="sorting-element" />
            ))}
          </AnimatePresence>
        </div>
      )}

      {run && (
        <OperationPlayer
          steps={run.steps}
          onComplete={() => {
            recordOperation('playground');
            setRun(null);
            setCompiledSteps([]);
          }}
          onPredictionAnswer={recordPrediction}
          onPlayStateChange={setIsAnimating}
        />
      )}

      {compiledSteps.length > 0 && !run && (
        <p className="setting-note">Compiled {compiledSteps.length} steps — run finished.</p>
      )}
    </div>
  );
};

export default Playground;
