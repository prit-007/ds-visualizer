import React, { useState } from "react";
import { diffRuns } from "../lib/timeTravel";

const RunHistoryPanel = ({ runs = [], onFork, disabled = false }) => {
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);

  const toggle = (id) => {
    setComparison(null);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return [...prev.slice(-1), id];
      return [...prev, id];
    });
  };

  const runA = runs.find((run) => run.id === selected[0]);
  const runB = runs.find((run) => run.id === selected[1]);

  const handleCompare = () => setComparison(diffRuns(runA, runB));
  const handleClear = () => {
    setComparison(null);
    setSelected([]);
  };

  if (runs.length === 0) {
    return (
      <p className="run-history-empty">
        No runs recorded yet — perform an operation to build history.
      </p>
    );
  }

  return (
    <div className="run-history">
      <ul className="run-history-list">
        {runs.map((run) => (
          <li key={run.id} className="run-history-item">
            <label className="run-history-select">
              <input
                type="checkbox"
                checked={selected.includes(run.id)}
                onChange={() => toggle(run.id)}
                aria-label={`Compare ${run.label}`}
              />
              <span className="run-history-label">{run.label}</span>
            </label>
            <span className="run-history-meta">
              steps {run.counters.total} · compares {run.counters.compare} · moves{" "}
              {run.counters.move}
              {run.meta && run.meta.rotations === false ? " · rotations off" : ""}
            </span>
            <button
              type="button"
              className="btn run-history-fork"
              disabled={disabled}
              onClick={() => onFork(run)}
            >
              Fork
            </button>
          </li>
        ))}
      </ul>

      <div className="run-history-actions">
        <button
          type="button"
          className="btn"
          disabled={selected.length !== 2}
          onClick={handleCompare}
        >
          Compare selected
        </button>
        {comparison && (
          <button type="button" className="btn" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>

      {comparison && (
        <div className="run-history-diff">
          <p>
            common prefix: {comparison.commonPrefix} step
            {comparison.commonPrefix === 1 ? "" : "s"}
          </p>
          <p>
            before {comparison.beforeEqual ? "match" : "differ"} · after{" "}
            {comparison.afterEqual ? "match" : "differ"} · settings{" "}
            {comparison.metaEqual ? "match" : "differ"}
          </p>
          <p>
            counters delta: compares {comparison.countersDelta.compare}, moves{" "}
            {comparison.countersDelta.move}, errors {comparison.countersDelta.error}
          </p>
          {comparison.onlyA.length === 0 && comparison.onlyB.length === 0 ? (
            <p className="run-history-diff-same">Both runs narrate identically.</p>
          ) : (
            <ul className="run-history-diff-steps">
              {comparison.onlyA.map((step, index) => (
                <li key={`a-${index}`} className="run-history-diff-a">
                  A: {step}
                </li>
              ))}
              {comparison.onlyB.map((step, index) => (
                <li key={`b-${index}`} className="run-history-diff-b">
                  B: {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RunHistoryPanel;
