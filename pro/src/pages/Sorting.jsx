import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  buildBubbleSteps,
  buildSelectionSteps,
  buildInsertionSteps,
  buildMergeSteps,
  buildQuickSteps,
  buildHeapSteps,
} from "../lib/sortingSteps";
import { SORTING_PSEUDOCODE } from "../lib/pseudocode";
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
import "./Sorting.css";

const TABS = [
  { id: "bubble", label: "Bubble" },
  { id: "selection", label: "Selection" },
  { id: "insertion", label: "Insertion" },
  { id: "merge", label: "Merge" },
  { id: "quick", label: "Quick" },
  { id: "heap", label: "Heap" },
];

const BUILDERS = {
  bubble: buildBubbleSteps,
  selection: buildSelectionSteps,
  insertion: buildInsertionSteps,
  merge: buildMergeSteps,
  quick: buildQuickSteps,
  heap: buildHeapSteps,
};

const ALGORITHM_NAME = {
  bubble: "Bubble",
  selection: "Selection",
  insertion: "Insertion",
  merge: "Merge",
  quick: "Quick",
  heap: "Heap",
};

const COMPLEXITY = {
  bubble: {
    operationName: "Bubble Sort",
    complexity: "O(n²)",
    explanation:
      "Bubble sort compares every adjacent pair each pass, bubbling the largest unsorted value to the end. Every pass is O(n) and there are up to n-1 passes.",
  },
  selection: {
    operationName: "Selection Sort",
    complexity: "O(n²)",
    explanation:
      "Selection sort scans the unsorted suffix for the minimum each pass, then swaps it into place. Always n-1 passes of O(n) scans.",
  },
  insertion: {
    operationName: "Insertion Sort",
    complexity: "O(n²)",
    explanation:
      "Insertion sort grows a sorted prefix one element at a time, shifting larger elements right. Fast on nearly-sorted input, quadratic in the worst case.",
  },
  merge: {
    operationName: "Merge Sort",
    complexity: "O(n log n)",
    explanation:
      "Merge sort splits the array in half recursively, then merges the sorted halves. Every level touches all n elements and there are log n levels.",
  },
  quick: {
    operationName: "Quick Sort",
    complexity: "O(n log n) avg",
    explanation:
      "Quick sort partitions around a pivot, then recurses on both sides. Average O(n log n); worst case O(n²) on already-sorted input with a bad pivot.",
  },
  heap: {
    operationName: "Heap Sort",
    complexity: "O(n log n)",
    explanation:
      "Heap sort builds a max-heap in place, then repeatedly extracts the maximum into the end of the array. Consistent O(n log n) with no extra memory.",
  },
};

const DEFAULT_ARRAY = [5, 3, 8, 1, 9, 2, 7, 4];

const Sorting = ({ initialArray }) => {
  const [array, setArray] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "sorting" && Array.isArray(scenario.values)) {
      return scenario.values;
    }
    return initialArray ?? [...DEFAULT_ARRAY];
  });
  // Animated canvas state: stable per-element ids so framer-motion `layout`
  // can move nodes when a swap step reorders the display array.
  const [displayItems, setDisplayItems] = useState(() =>
    (initialArray ?? [...DEFAULT_ARRAY]).map((v, i) => ({ id: i, value: v }))
  );
  const [arrayInput, setArrayInput] = useState("");
  const [activeTab, setActiveTab] = useState("bubble");
  const [comparePair, setComparePair] = useState(null);
  const [swapPair, setSwapPair] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [sortedIndexes, setSortedIndexes] = useState([]);
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
    if (runMeta) recordRun({ structure: "sorting", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setComparePair(null);
    setSwapPair(null);
    setActiveIndex(null);
    setSortedIndexes([]);
  };

  // Rebuild displayItems for a new value list, reusing ids where values
  // match so framer-motion animates position changes instead of remounting.
  const syncFromValues = (values) => {
    setDisplayItems((prev) => {
      const used = new Set();
      return values.map((v) => {
        const match = prev.find((it) => it.value === v && !used.has(it.id));
        if (match) {
          used.add(match.id);
          return match;
        }
        return { id: `n-${v}-${Math.random().toString(36).slice(2, 7)}`, value: v };
      });
    });
  };

  const applyPreset = (values) => {
    setArray([...values]);
    syncFromValues(values);
    clearHighlights();
    setError(null);
    setRun(null);
    setArrayInput("");
  };

  const ui = {
    setComparePair,
    setSwapPair,
    setActiveIndex,
    setSortedIndexes,
    setDisplayArray: syncFromValues,
  };

  const handleLoadArray = () => {
    const parts = arrayInput.split(/[,\s]+/).filter((p) => p.length > 0);
    const parsed = parts.map((p) => parseInt(p, 10));
    if (parsed.length < 2 || parsed.some((v) => isNaN(v))) {
      setError("Please enter at least two numbers to sort");
      return;
    }
    if (parsed.length > 20) {
      setError("Please enter up to 20 numbers");
      return;
    }
    applyPreset(parsed);
  };

  const handleRunSort = () => {
    if (array.length < 2) {
      setError("Please enter at least two numbers to sort");
      return;
    }

    const builder = BUILDERS[activeTab] ?? buildBubbleSteps;
    const steps = builder(array, ui);
    const sorted = [...array].sort((a, b) => a - b);
    startRun(
      steps,
      () => {
        setArray(sorted);
        syncFromValues(sorted);
        clearHighlights();
        setArrayInput("");
      },
      {
        before: [...array],
        after: sorted,
        label: `${ALGORITHM_NAME[activeTab]} sort`,
      }
    );
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "sorting") applyPreset([...runEntry.before]);
  };

  const memoryBlocks = array.map((value, index) => ({
    address: `0x${(index * 4 + 100).toString(16).toUpperCase()}`,
    value,
    isActive:
      activeIndex === index ||
      (comparePair !== null && (comparePair[0] === index || comparePair[1] === index)),
    isShifting: swapPair !== null && (swapPair[0] === index || swapPair[1] === index),
  }));

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.bubble;

  return (
    <div className="sorting-page" ref={containerRef}>
      <h1>Interactive Sorting Visualizer</h1>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Sorting Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="sorting" values={array} />

          {view === "story" ? (
            array.length === 0 ? (
              <div className="sorting-canvas">
                <p className="empty-state">
                  No elements yet — load an array to get started.
                </p>
              </div>
            ) : (
              <div className="sorting-canvas">
                <AnimatePresence mode="popLayout">
                  {displayItems.map((item, index) => (
                    <ElementNode
                      key={item.id}
                      value={item.value}
                      index={index}
                      layout
                      isActive={
                        activeIndex === index ||
                        (comparePair !== null &&
                          (comparePair[0] === index || comparePair[1] === index))
                      }
                      isHighlighted={
                        swapPair !== null && (swapPair[0] === index || swapPair[1] === index)
                      }
                      isSorted={sortedIndexes.includes(index)}
                      className="sorting-element"
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
                recordOperation(`sorting:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={SORTING_PSEUDOCODE[activeTab]}
            />
          )}

          {view === "story" && array.length > 0 && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>Sorting Operations</h2>

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
              {
                label: "Reverse case",
                onClick: () => applyPreset([...sortedSequence(8)].reverse()),
              },
              {
                label: "Nearly sorted",
                onClick: () => applyPreset([1, 2, 4, 3, 5, 6, 8, 7]),
              },
            ]}
          />

          <div className="operation-inputs">
            <div className="input-group">
              <label>Array:</label>
              <input
                type="text"
                value={arrayInput}
                onChange={(e) => setArrayInput(e.target.value)}
                placeholder="e.g. 5, 3, 8, 1"
                disabled={isAnimating}
              />
            </div>

            <button
              className="operation-button secondary"
              onClick={handleLoadArray}
              disabled={isAnimating}
            >
              Load Array
            </button>

            <button
              className="operation-button"
              onClick={handleRunSort}
              disabled={isAnimating}
            >
              {`Run ${ALGORITHM_NAME[activeTab]} Sort`}
            </button>
          </div>

          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />

          <PropertyDisplay
            title="Sorting Properties"
            properties={[
              { name: "Elements", value: array.length },
              { name: "Algorithm", value: `${ALGORITHM_NAME[activeTab]} sort` },
              { name: "Memory Size", value: `${array.length * 4} bytes` },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel
            runs={listRuns("sorting")}
            onFork={handleForkRun}
            disabled={isAnimating}
          />
        </div>
      </div>
    </div>
  );
};

export default Sorting;
