import React, { useState } from "react";
import { CHALLENGE, evaluateChallenge } from "../lib/challenges";
import { recordOperation } from "../lib/progress";
import "./Challenges.css";

const parseValues = (text) =>
  text
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number);

const parseTarget = (text) => {
  const trimmed = text.trim();
  return trimmed === "" ? NaN : Number(trimmed);
};

const VERDICTS = {
  perfect: "Perfect — you found a worst case!",
  good: "Close — a better insertion order exists.",
  poor: "Weak — there is a much worse order out there.",
};

const Challenges = () => {
  const [valuesText, setValuesText] = useState("10, 20, 30, 40, 50");
  const [targetText, setTargetText] = useState("50");
  const [rotations, setRotations] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleEvaluate = () => {
    const outcome = evaluateChallenge({
      values: parseValues(valuesText),
      target: parseTarget(targetText),
      rotations,
    });
    if (!outcome.ok) {
      setResult(null);
      setError(outcome.error);
      return;
    }
    setError(null);
    setResult(outcome);
    if (outcome.grade === "perfect") {
      recordOperation(`challenges:${CHALLENGE.id}`);
    }
  };

  const ratio = result && result.max > 0 ? result.comparisons / result.max : 0;

  return (
    <div className="challenge-page">
      <h1>Adversarial Challenges</h1>

      <section className="challenge-card">
        <h2>{CHALLENGE.title}</h2>
        <p className="challenge-brief">{CHALLENGE.brief}</p>

        <div className="challenge-controls">
          <label htmlFor="challenge-values">Insertion order</label>
          <input
            id="challenge-values"
            type="text"
            value={valuesText}
            onChange={(event) => setValuesText(event.target.value)}
            placeholder="e.g. 10, 20, 30"
          />

          <label htmlFor="challenge-target">Search target</label>
          <input
            id="challenge-target"
            type="text"
            value={targetText}
            onChange={(event) => setTargetText(event.target.value)}
            placeholder="value to search"
          />

          <button
            type="button"
            className={`btn challenge-rotations${rotations ? " active" : ""}`}
            aria-label="Toggle AVL rotations"
            aria-pressed={rotations}
            onClick={() => setRotations(!rotations)}
          >
            Rotations {rotations ? "On" : "Off"}
          </button>

          <button type="button" className="btn btn-primary" onClick={handleEvaluate}>
            Evaluate attempt
          </button>
        </div>

        {error && (
          <p className="challenge-error" role="alert">
            {error}
          </p>
        )}

        {!result && !error && (
          <p className="challenge-empty">
            No attempt yet — pick an insertion order and press Evaluate. Rotations are{" "}
            {rotations ? "on" : "off"}.
          </p>
        )}

        {result && (
          <div className="challenge-result">
            <span className={`challenge-grade-${result.grade}`}>
              {result.grade === "perfect" ? "Perfect" : result.grade === "good" ? "Good" : "Poor"}
            </span>
            <p className="challenge-score">
              {result.comparisons} / max {result.max} comparisons
            </p>
            <div
              className="challenge-bar"
              role="img"
              aria-label={`${Math.round(ratio * 100)} percent of the maximum`}
            >
              <span className="challenge-bar-fill" style={{ width: `${ratio * 100}%` }} />
            </div>
            <p className="challenge-verdict">{VERDICTS[result.grade]}</p>
            <p className="challenge-note">
              n = {result.n} · rotations {result.rotations ? "on" : "off"} · maximum brute-forced
              over every insertion order
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Challenges;
