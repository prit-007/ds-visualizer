import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import AlgoOverview from "../components/AlgoOverview";
import {
  buildKmpTableSteps,
  buildKmpSearchSteps,
  buildNaiveSearchSteps,
} from "../lib/kmpSteps";
import { buildRabinKarpSteps, buildZSearchSteps } from "../lib/rabinZSteps";
import { STRING_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import OperationPlayer from "../components/OperationPlayer";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import ShareButton from "../components/ShareButton";
import RunHistoryPanel from "../components/RunHistoryPanel";
import { readScenario } from "../lib/share";
import { recordRun, listRuns } from "../lib/timeTravel";
import "./Strings.css";

const TABS = [
  { id: "kmp", label: "KMP Search" },
  { id: "naive", label: "Naive Search" },
  { id: "rabin", label: "Rabin-Karp" },
  { id: "zalg", label: "Z Algorithm" },
  { id: "table", label: "Failure Table" },
];

const INPUT_LABEL = {
  kmp: "Run KMP",
  naive: "Run Naive",
  rabin: "Run Rabin-Karp",
  zalg: "Run Z Search",
  table: "Build π Table",
};

const LABEL_PREFIX = {
  kmp: "KMP",
  naive: "Naive",
  rabin: "Rabin-Karp",
  zalg: "Z search",
  table: "π table for",
};

const COMPLEXITY = {
  kmp: {
    operationName: "KMP Search",
    complexity: "O(n + m)",
    explanation:
      "The text advances one step at a time while the pattern slides along its failure table — every character is examined at most twice total, no re-scanning of matched text.",
  },
  naive: {
    operationName: "Naive Search",
    complexity: "O(n · m)",
    explanation:
      "Every character of text belongs to every window that overlaps it — worst case re-reads the whole text for each pattern position.",
  },
  rabin: {
    operationName: "Rabin-Karp",
    complexity: "O(n + m) average, O(n · m) worst",
    explanation:
      "Each window slides by hashing only its two changing characters — no character re-compared on a miss. Equal hashes trigger a character verification, so collisions can cost O(m) but never produce false matches.",
  },
  zalg: {
    operationName: "Z Algorithm",
    complexity: "O(n + m)",
    explanation:
      "One left-to-right pass fills Z[i] = the longest prefix match at each position, reusing the current [l..r] box so every comparison extends it — positions with Z[i] ≥ |pattern| are exact matches.",
  },
  table: {
    operationName: "Failure Table (π)",
    complexity: "O(m)",
    explanation:
      "One scan of the pattern computes how much of each prefix is also a suffix — the info KMP reuses to avoid re-matching.",
  },
};

const DEFAULT_TEXT = "ababcabcabab";
const DEFAULT_PATTERN = "abab";

const Strings = () => {
  const [text, setText] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "strings" && scenario.text) return scenario.text;
    return DEFAULT_TEXT;
  });
  const [pattern, setPattern] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "strings" && scenario.pattern) return scenario.pattern;
    return DEFAULT_PATTERN;
  });
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);
  const [activeTab, setActiveTab] = useState("kmp");
  const [, setHighlightRange] = useState([0, 0]);
  const [, setActiveCell] = useState(null);
  const [foundTarget, setFoundTarget] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "strings", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setHighlightRange([-1, -1]);
    setActiveCell(null);
    setFoundTarget(null);
  };

  const ui = {
    setHighlight: setHighlightRange,
    setActiveIndex: setActiveCell,
    setFound: setFoundTarget,
  };

  const loadInputs = () => {
    const t = textInput.trim();
    const p = patternInput.trim();
    if (!p) {
      setError("Please enter a pattern");
      return null;
    }
    if (!t) {
      setError("Please enter a text to search");
      return null;
    }
    if (p.length > t.length) {
      setError("Pattern longer than text — no match possible");
      return null;
    }
    return { t, p };
  };

  const handleRun = () => {
    const got = loadInputs();
    if (!got) return;
    const { t, p } = got;
    setText(t);
    setPattern(p);
    setTextInput(t);
    setPatternInput(p);
    let steps;
    if (activeTab === "naive") steps = buildNaiveSearchSteps(t, p, ui);
    else if (activeTab === "rabin") steps = buildRabinKarpSteps(t, p, ui);
    else if (activeTab === "zalg") steps = buildZSearchSteps(t, p, ui);
    else if (activeTab === "table") steps = buildKmpTableSteps(p, ui);
    else steps = buildKmpSearchSteps(t, p, ui);

    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: { text: t, pattern: p },
        after: { text: t, pattern: p },
        label: `${LABEL_PREFIX[activeTab]} "${p}"`,
      }
    );
  };

  const handleTabChange = (next) => {
    if (next === activeTab || isAnimating) return;
    setActiveTab(next);
    setRun(null);
    setError(null);
    clearHighlights();
  };

  const handleReset = () => {
    setText(DEFAULT_TEXT);
    setPattern(DEFAULT_PATTERN);
    setRun(null);
    setError(null);
    clearHighlights();
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "strings" && runEntry.before) {
      setText(runEntry.before.text);
      setPattern(runEntry.before.pattern);
      handleReset();
    }
  };

  return (
    <div className="strings-page" ref={containerRef}>
      <h1>String Matching Visualizer</h1>
      <p className="page-tagline">
        Find a pattern in text — and see why KMP never re-reads what it already matched.
      </p>

      <AlgoOverview
        title="String Matching (Naive, KMP, Rabin-Karp, Z)"
        what="Naive search re-checks every window. KMP reuses a failure table of prefix–suffix overlaps. Rabin-Karp slides a rolling hash and verifies only on hash hits. The Z algorithm fills a longest-prefix-match array in one pass — matches are positions where Z ≥ |pattern|."
        time="O(n · m) → O(n + m)"
        space="O(m) for the π table"
        when="searching logs, DNA strings, and text: any time 'find every occurrence of this short string' matters."
        note="Highlighted cells turn green on a match and red on a mismatch; a found occurrence puts a ring around its span."
      />

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Search over text</h2>

          <ShareButton structure="strings" values={[]} extra={{ text, pattern }} disabled={isAnimating} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
          </div>

          <div className="strings-canvas">
            <div className="text-row">
              {text.split("").map((ch, i) => (
                <div
                  key={`${ch}-${i}`}
                  className={`char-cell${
                    foundTarget !== null &&
                    i >= foundTarget &&
                    i < foundTarget + pattern.length
                      ? " found"
                      : ""
                  }`}
                >
                  {ch}
                </div>
              ))}
            </div>
            <div className="text-row">
              {text.split("").map((ch, i) => (
                <div key={`idx-${i}`} className="char-cell index">
                  {i}
                </div>
              ))}
            </div>
            <span className="pattern-chip">
              pattern: "{pattern}"
            </span>
          </div>

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`strings:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={STRING_PSEUDOCODE[activeTab]}
            />
          )}
        </div>

        <div className="controls-area">
          <h2>Search</h2>

          <ErrorMessage message={error} />

          <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} disabled={isAnimating} />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            <div className="input-group">
              <label>Text:</label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Text to search"
                disabled={isAnimating}
              />
            </div>
            <div className="input-group">
              <label>Pattern:</label>
              <input
                type="text"
                value={patternInput}
                onChange={(e) => setPatternInput(e.target.value)}
                placeholder="Pattern"
                disabled={isAnimating}
              />
            </div>
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {INPUT_LABEL[activeTab]}
            </button>
          </form>

          <ComplexityInfo
            operationName={COMPLEXITY[activeTab].operationName}
            complexity={COMPLEXITY[activeTab].complexity}
            explanation={COMPLEXITY[activeTab].explanation}
          />

          <PropertyDisplay
            title="Search Properties"
            properties={[
              { name: "Text length", value: text.length },
              { name: "Pattern length", value: pattern.length },
              { name: "Matches", value: run ? "(see run)" : "—" },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("strings")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default Strings;
