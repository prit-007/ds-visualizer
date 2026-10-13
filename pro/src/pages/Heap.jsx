import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MinHeap } from "../lib/heap";
import { buildInsertSteps, buildExtractSteps, buildPeekSteps } from "../lib/heapSteps";
import { layoutHeap, CANVAS_W } from "../lib/heapLayout";
import { HEAP_PSEUDOCODE } from "../lib/pseudocode";
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
import { sortedSequence, uniqueRandomValues } from "../lib/presets";
import "./Heap.css";

const TABS = [
  { id: "insert", label: "Insert" },
  { id: "extractMin", label: "Extract Min" },
  { id: "peek", label: "Peek" },
];

const BUTTON_LABEL = {
  insert: "Insert Key",
  extractMin: "Extract Minimum",
  peek: "Peek Minimum",
};

const COMPLEXITY = {
  insert: {
    operationName: "Insert",
    complexity: "O(log n)",
    explanation:
      "A new key is appended at the end, then bubbles up toward the root while it is smaller than its parent — at most the height of the complete tree, log₂ n.",
  },
  extractMin: {
    operationName: "Extract Minimum",
    complexity: "O(log n)",
    explanation:
      "The root is the minimum. Removing it moves the last key to the root and sifts it down, swapping with the smaller child each level — O(log n).",
  },
  peek: {
    operationName: "Peek Minimum",
    complexity: "O(1)",
    explanation: "The minimum of a min-heap is always at the root — a constant-time read.",
  },
};

const DEFAULT_VALUES = [5, 3, 8, 1, 9, 2, 7];

const Heap = () => {
  const [heap] = useState(() => {
    const scenario = readScenario();
    const instance = new MinHeap();
    if (scenario && scenario.structure === "heap" && Array.isArray(scenario.values)) {
      scenario.values.forEach((v) => instance.insert(v));
    } else {
      DEFAULT_VALUES.forEach((v) => instance.insert(v));
    }
    return instance;
  });
  const [heapTick, setHeapTick] = useState(0);
  const [displayItems, setDisplayItems] = useState(() =>
    heap.items.map((v, i) => ({ id: i, value: v }))
  );
  const [value, setValue] = useState("");
  const [activeTab, setActiveTab] = useState("insert");
  const [activeIndex, setActiveIndex] = useState(null);
  const [comparePair, setComparePair] = useState(null);
  const [swapPair, setSwapPair] = useState(null);
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
    if (runMeta) recordRun({ structure: "heap", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveIndex(null);
    setComparePair(null);
    setSwapPair(null);
  };

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
    heap.items = [];
    values.forEach((v) => heap.insert(v));
    syncFromValues(heap.items);
    setHeapTick((t) => t + 1);
    clearHighlights();
    setError(null);
    setRun(null);
    setValue("");
  };

  const ui = {
    setActiveIndex,
    setComparePair,
    setSwapPair,
    setDisplayArray: syncFromValues,
  };

  const handleInsert = () => {
    if (!value.trim()) {
      setError("Please enter a key");
      return;
    }
    const v = parseInt(value);
    if (isNaN(v)) {
      setError("Please enter a valid integer key");
      return;
    }
    const pre = [...heap.items];
    const trace = [];
    heap.insert(v, trace);
    const steps = buildInsertSteps(pre, v, trace, ui);
    const nextItems = [...heap.items];
    startRun(
      steps,
      () => {
        syncFromValues(nextItems);
        setHeapTick((t) => t + 1);
        setValue("");
        clearHighlights();
      },
      { before: pre, after: nextItems, label: `Insert ${v}` }
    );
  };

  const handleExtract = () => {
    if (heap.size === 0) {
      setError("Heap is empty — insert a key first");
      return;
    }
    const pre = [...heap.items];
    const trace = [];
    const min = heap.extractMin(trace);
    const steps = buildExtractSteps(pre, trace, ui);
    const nextItems = [...heap.items];
    startRun(
      steps,
      () => {
        syncFromValues(nextItems);
        setHeapTick((t) => t + 1);
        clearHighlights();
      },
      { before: pre, after: nextItems, label: `Extract min ${min}` }
    );
  };

  const handlePeek = () => {
    if (heap.size === 0) {
      setError("Heap is empty — insert a key first");
      return;
    }
    const steps = buildPeekSteps(heap.items, ui);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      { before: [...heap.items], after: [...heap.items], label: "Peek minimum" }
    );
  };

  const handleOperation = () => {
    if (activeTab === "insert") handleInsert();
    else if (activeTab === "extractMin") handleExtract();
    else handlePeek();
  };

  const handleReset = () => applyPreset([...DEFAULT_VALUES]);
  const handleClear = () => applyPreset([]);

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "heap") applyPreset([...runEntry.before]);
  };

  const layout = layoutHeap(displayItems.length);
  const height = displayItems.length > 0 ? Math.floor(Math.log2(displayItems.length)) + 1 : 0;

  const memoryBlocks = heap.items.map((v, i) => ({
    address: `0x${(i * 4 + 100).toString(16).toUpperCase()}`,
    value: v,
    isActive: activeIndex === i,
    isShifting: swapPair !== null && (swapPair[0] === i || swapPair[1] === i),
  }));

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.insert;

  return (
    <div className="heap-page" ref={containerRef}>
      <h1>Interactive Binary Heap Visualizer</h1>
      <p className="page-tagline">A binary min-heap with dual array and tree views.</p>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Min-Heap Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="heap" values={heap.items} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
            <button type="button" className="data-action-btn danger" onClick={handleClear} disabled={isAnimating}>
              Clear
            </button>
          </div>

          {view === "story" ? (
            displayItems.length === 0 ? (
              <div className="heap-canvas">
                <p className="empty-state">Heap is empty — insert a key to get started.</p>
              </div>
            ) : (
              <div className="heap-canvas" key={`heap-${heapTick}`}>
                <div className="heap-array">
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
                        isHighlighted={swapPair !== null && (swapPair[0] === index || swapPair[1] === index)}
                        className="heap-element"
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="heap-tree" style={{ width: CANVAS_W, height: layout.height }}>
                  <svg width={CANVAS_W} height={layout.height} aria-hidden="true">
                    {layout.edges.map((e) => (
                      <line
                        key={`${e.parentIndex}-${e.childIndex}`}
                        className="heap-edge"
                        x1={e.x1}
                        y1={e.y1}
                        x2={e.x2}
                        y2={e.y2}
                      />
                    ))}
                  </svg>
                  {layout.nodes.map((n) => (
                    <div
                      key={n.index}
                      className="heap-node-slot"
                      style={{ left: `${n.x}px`, top: `${n.y}px` }}
                    >
                      <div className={`heap-node${activeIndex === n.index ? " active" : ""}`}>
                        {displayItems[n.index]?.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : displayItems.length === 0 ? (
            <p className="empty-state">No memory cells yet — insert a key to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`heap:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={HEAP_PSEUDOCODE[activeTab]}
            />
          )}

          {view === "story" && displayItems.length > 0 && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>Heap Operations</h2>

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
              { label: "Random case", onClick: () => applyPreset(uniqueRandomValues(8)) },
              { label: "Sorted case", onClick: () => applyPreset(sortedSequence(8)) },
              { label: "Reverse case", onClick: () => applyPreset([...sortedSequence(8)].reverse()) },
            ]}
          />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleOperation();
            }}
          >
            {activeTab === "insert" && (
              <div className="input-group">
                <label>Key:</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter a number"
                  disabled={isAnimating}
                />
              </div>
            )}

            <button type="submit" className="operation-button" disabled={isAnimating}>
              {BUTTON_LABEL[activeTab]}
            </button>
          </form>

          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />

          <PropertyDisplay
            title="Heap Properties"
            properties={[
              { name: "Size", value: heap.size },
              { name: "Root (min)", value: heap.size > 0 ? heap.peek() : "—" },
              { name: "Height", value: height },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("heap")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default Heap;
