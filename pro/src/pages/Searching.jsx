import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { buildLinearSteps, buildBinarySteps } from "../lib/searchingSteps";
import { SEARCHING_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import ElementNode from "../components/ElementNode";
import OperationPlayer from "../components/OperationPlayer";
import TabNavigation from "../components/TabNavigation";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import MemoryRepresentation from "../components/MemoryRepresentation";
import ViewToggle from "../components/ViewToggle";
import ShareButton from "../components/ShareButton";
import RunHistoryPanel from "../components/RunHistoryPanel";
import { readScenario } from "../lib/share";
import { recordRun, listRuns } from "../lib/timeTravel";
import CasePresets from "../components/CasePresets";
import { randomValues, sortedSequence } from "../lib/presets";
import "./Searching.css";

const TABS = [
  { id: "linear", label: "Linear" },
  { id: "binary", label: "Binary" },
];

const BUILDERS = {
  linear: buildLinearSteps,
  binary: buildBinarySteps,
};

const ALGORITHM_NAME = { linear: "Linear", binary: "Binary" };

const COMPLEXITY = {
  linear: {
    operationName: "Linear Search",
    complexity: "O(n)",
    explanation:
      "Linear search walks the array from index 0, comparing each element until it finds the target or exhausts the array — no ordering required.",
  },
  binary: {
    operationName: "Binary Search",
    complexity: "O(n log n) build · O(log n) search",
    explanation:
      "Binary search halves the search window each step (mid comparison), so lookup is O(log n) — but the array must already be sorted.",
  },
};

const DEFAULT_ARRAY = [2, 4, 6, 8, 10, 12, 14];
const DEFAULT_TARGET = 8;

const Searching = ({ initialArray, initialTarget }) => {
  const [array, setArray] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "searching" && Array.isArray(scenario.values)) {
      return scenario.values;
    }
    return initialArray ?? [...DEFAULT_ARRAY];
  });
  const [target, setTarget] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "searching" && scenario.target !== undefined) {
      return String(scenario.target);
    }
    return String(initialTarget ?? DEFAULT_TARGET);
  });
  const [arrayInput, setArrayInput] = useState("");
  const [activeTab, setActiveTab] = useState("linear");
  const [comparePair, setComparePair] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("story");

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
    if (runMeta) recordRun({ structure: "searching", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setComparePair(null);
    setActiveIndex(null);
  };

  const applyPreset = (values, targetValue) => {
    setArray([...values]);
    if (targetValue !== undefined) setTarget(String(targetValue));
    clearHighlights();
    setError(null);
    setRun(null);
    setArrayInput("");
  };

  const ui = { setComparePair, setActiveIndex };

  const handleLoadArray = () => {
    const parts = arrayInput.split(/[,\s]+/).filter((p) => p.length > 0);
    const parsed = parts.map((p) => parseInt(p, 10));
    if (parsed.length < 2 || parsed.some((v) => isNaN(v))) {
      setError("Please enter at least two numbers to search");
      return;
    }
    if (parsed.length > 20) {
      setError("Please enter up to 20 numbers");
      return;
    }
    applyPreset(parsed);
  };

  const handleSearch = () => {
    const t = parseInt(target);
    if (isNaN(t)) {
      setError("Please enter a valid target");
      return;
    }
    if (array.length < 2) {
      setError("Please enter at least two numbers to search");
      return;
    }
    if (activeTab === "binary") {
      const sorted = [...array].sort((a, b) => a - b);
      if (array.some((v, i) => v !== sorted[i])) {
        setError("Binary search requires a sorted array — use the Sorted case preset");
        return;
      }
    }

    const builder = BUILDERS[activeTab] ?? buildLinearSteps;
    const steps = builder(array, t, ui);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: [...array],
        after: [...array],
        label: `${ALGORITHM_NAME[activeTab]} search ${t}`,
      }
    );
  };

  const handleReset = () => {
    applyPreset([...DEFAULT_ARRAY], DEFAULT_TARGET);
  };

  const handleClear = () => {
    applyPreset([], "");
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "searching") applyPreset([...runEntry.before]);
  };

  const memoryBlocks = array.map((value, index) => ({
    address: `0x${(index * 4 + 100).toString(16).toUpperCase()}`,
    value,
    isActive: activeIndex === index,
    isShifting: comparePair !== null && (comparePair[0] === index || comparePair[1] === index),
  }));

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.linear;

  return (
    <div className="searching-page" ref={containerRef}>
      <h1>Interactive Searching Visualizer</h1>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Searching Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="searching" values={array} extra={{ target: t2i(target) }} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
            <button type="button" className="data-action-btn danger" onClick={handleClear} disabled={isAnimating}>
              Clear
            </button>
          </div>

          {view === "story" ? (
            array.length === 0 ? (
              <div className="searching-canvas">
                <p className="empty-state">
                  No elements yet — load an array to get started.
                </p>
              </div>
            ) : (
              <div className="searching-canvas">
                <AnimatePresence mode="popLayout">
                  {array.map((value, index) => (
                    <ElementNode
                      key={`${index}-${value}`}
                      value={value}
                      index={index}
                      isActive={activeIndex === index}
                      isHighlighted={
                        comparePair !== null &&
                        (comparePair[0] === index || comparePair[1] === index)
                      }
                      className="searching-element"
                    />
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : array.length === 0 ? (
            <p className="empty-state">No memory cells yet — load an array to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`searching:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={SEARCHING_PSEUDOCODE[activeTab]}
            />
          )}

          {view === "story" && array.length > 0 && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>Searching Operations</h2>

          <ErrorMessage message={error} />

          <TabNavigation
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={isAnimating}
          />

          <CasePresets
            disabled={isAnimating}
            presets={[
              { label: "Random case", onClick: () => applyPreset(randomValues(8)) },
              { label: "Sorted case", onClick: () => applyPreset(sortedSequence(8)) },
            ]}
          />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="input-group">
              <label>Array:</label>
              <input
                type="text"
                value={arrayInput}
                onChange={(e) => setArrayInput(e.target.value)}
                placeholder="e.g. 2, 4, 6, 8"
                disabled={isAnimating}
              />
            </div>
            <div className="input-group">
              <label>Target:</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter a number"
                disabled={isAnimating}
              />
            </div>

            <button type="button" className="operation-button secondary" onClick={handleLoadArray} disabled={isAnimating}>
              Load Array
            </button>

            <button type="button" className="operation-button" onClick={handleSearch} disabled={isAnimating}>
              {`Run ${ALGORITHM_NAME[activeTab]} Search`}
            </button>
          </form>

          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />

          <PropertyDisplay
            title="Searching Properties"
            properties={[
              { name: "Elements", value: array.length },
              { name: "Algorithm", value: `${ALGORITHM_NAME[activeTab]} search` },
              { name: "Target", value: target || "—" },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel
            runs={listRuns("searching")}
            onFork={handleForkRun}
            disabled={isAnimating}
          />
        </div>
      </div>
    </div>
  );
};

// tiny helper so the share payload always carries a number
function t2i(t) {
  const n = parseInt(t);
  return isNaN(n) ? null : n;
}

export default Searching;
