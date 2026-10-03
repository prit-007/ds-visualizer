import React, { useState } from "react";
import {
  BENCHMARKS,
  DEFAULT_SIZES,
  runBenchmark,
  classifyGrowth,
  buildPlot,
  THEORETICAL,
} from "../lib/complexity";
import { recordOperation } from "../lib/progress";
import "./ComplexityLab.css";

const ComplexityLab = () => {
  const [selected, setSelected] = useState("array-index-access");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const finish = (key, samples) => {
    const benchmark = BENCHMARKS[key];
    setResult({
      key,
      samples,
      classification: classifyGrowth(samples),
      plot: buildPlot(samples, THEORETICAL[benchmark.theory]),
    });
    setRunning(false);
    recordOperation("complexity:sweep");
  };

  const runSweep = () => {
    setError(null);
    const key = selected;
    if (typeof Worker !== "undefined") {
      setRunning(true);
      const worker = new Worker(new URL("../workers/complexity.worker.js", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event) => {
        const message = event.data || {};
        worker.terminate();
        if (message.ok) {
          finish(key, message.samples);
        } else {
          setError(message.error || "Sweep failed");
          setRunning(false);
        }
      };
      worker.postMessage({ key, sizes: DEFAULT_SIZES });
      return;
    }
    try {
      finish(key, runBenchmark(key, DEFAULT_SIZES));
    } catch (err) {
      setError(String((err && err.message) || err));
    }
  };

  return (
    <div className="complexity-page">
      <h1>Complexity Lab</h1>
      <p className="complexity-intro">
        Measure real operation counts as the input grows, then compare the measured growth
        against the theoretical O() curve. Sweeps run in a Web Worker so the page stays
        responsive.
      </p>

      <div className="complexity-controls">
        <label htmlFor="complexity-benchmark">Operation</label>
        <select
          id="complexity-benchmark"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {Object.entries(BENCHMARKS).map(([key, entry]) => (
            <option key={key} value={key}>
              {entry.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn" onClick={runSweep} disabled={running}>
          {running ? "Measuring…" : "Run sweep"}
        </button>
      </div>

      {error && (
        <p className="complexity-error" role="alert">
          {error}
        </p>
      )}

      {!result && !error && (
        <p className="complexity-empty">
          No measurements yet — pick an operation and run a sweep over n ={" "}
          {DEFAULT_SIZES.join(", ")}.
        </p>
      )}

      {result && (
        <>
          <p className="complexity-classification">
            Measured growth: {result.classification ? result.classification.label : "n/a"} ·
            Theory: {BENCHMARKS[result.key].theory}
          </p>

          <table className="complexity-table">
            <thead>
              <tr>
                <th scope="col">n</th>
                <th scope="col">operations</th>
                <th scope="col">time (ms)</th>
              </tr>
            </thead>
            <tbody>
              {result.samples.map((sample) => (
                <tr key={sample.n}>
                  <td>{sample.n}</td>
                  <td>{sample.ops}</td>
                  <td>{sample.ms.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <figure className="complexity-figure">
            <svg
              className="complexity-plot"
              viewBox={`0 0 ${result.plot.width} ${result.plot.height}`}
              role="img"
              aria-label={`Measured growth vs ${BENCHMARKS[result.key].theory} for ${BENCHMARKS[result.key].label}`}
            >
              <polyline className="complexity-theory-line" points={result.plot.theory} />
              <polyline className="complexity-measured-line" points={result.plot.measured} />
            </svg>
            <figcaption className="complexity-legend">
              <span className="complexity-legend-measured">measured</span>
              <span className="complexity-legend-theory">
                theory {BENCHMARKS[result.key].theory}
              </span>
            </figcaption>
          </figure>

          <p className="complexity-note">
            Benchmark: {BENCHMARKS[result.key].label} — primitive operations counted
            deterministically at each size.
          </p>
        </>
      )}
    </div>
  );
};

export default ComplexityLab;
