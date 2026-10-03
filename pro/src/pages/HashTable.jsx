import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  HASH_BUCKETS,
  hashKey,
  totalKeys,
  buildInsertSteps,
  buildSearchSteps,
  buildDeleteSteps,
} from "../lib/hashTableSteps";
import { HASH_TABLE_PSEUDOCODE } from "../lib/pseudocode";
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
import "./HashTable.css";

const TABS = [
  { id: "insert", label: "Insert" },
  { id: "search", label: "Search" },
  { id: "delete", label: "Delete" },
];

const COMPLEXITY = {
  insert: {
    operationName: "Insert Key",
    complexity: "O(1) avg · O(n) worst",
    explanation:
      "Hashing jumps straight to a bucket. With separate chaining the average insert appends to a short chain, but many collisions can grow one chain to length n.",
  },
  search: {
    operationName: "Search Key",
    complexity: "O(1) avg · O(n) worst",
    explanation:
      "Hashing jumps straight to a bucket, then the chain is walked. A good hash keeps chains short; a poor hash degrades search toward O(n).",
  },
  delete: {
    operationName: "Delete Key",
    complexity: "O(1) avg · O(n) worst",
    explanation:
      "Delete walks the bucket chain and shifts the remaining chain entries left — work proportional to the chain length, which averages O(1) with a good hash.",
  },
};

const rebuildBuckets = (values) => {
  const buckets = Array.from({ length: HASH_BUCKETS }, () => []);
  values.forEach((v) => {
    buckets[hashKey(v)].push(v);
  });
  return buckets;
};

const flattenKeys = (buckets) => buckets.flat();

const HashTable = ({ initialKeys }) => {
  const [buckets, setBuckets] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "hash-table" && Array.isArray(scenario.values)) {
      return rebuildBuckets(scenario.values);
    }
    return rebuildBuckets(initialKeys ?? [2, 14, 25, 36]);
  });
  const [keyInput, setKeyInput] = useState("");
  const [activeTab, setActiveTab] = useState("insert");
  const [activeBucket, setActiveBucket] = useState(null);
  const [activeChainIndex, setActiveChainIndex] = useState(null);
  const [shiftingChain, setShiftingChain] = useState([]);
  const [removingCell, setRemovingCell] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("story");

  const containerRef = useRef(null);
  const count = totalKeys(buckets);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "hash-table", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveBucket(null);
    setActiveChainIndex(null);
    setShiftingChain([]);
    setRemovingCell(null);
  };

  const applyPreset = (values) => {
    setBuckets(rebuildBuckets(values));
    clearHighlights();
    setError(null);
    setRun(null);
    setKeyInput("");
  };

  const ui = {
    setActiveBucket,
    setActiveChainIndex,
    setShiftingChain,
    setRemovingCell,
  };

  const parseKey = () => {
    if (!keyInput.trim()) {
      setError("Please enter a key");
      return null;
    }
    const k = parseInt(keyInput);
    if (isNaN(k)) {
      setError("Please enter a valid integer key");
      return null;
    }
    return k;
  };

  const guardEmpty = () => {
    if (count === 0) {
      setError("Hash table is empty — insert a key first");
      return false;
    }
    return true;
  };

  const handleInsert = () => {
    const k = parseKey();
    if (k === null) return;

    const h = hashKey(k);
    if (buckets[h].includes(k)) {
      setError(`Key ${k} already exists in the table`);
      return;
    }

    const steps = buildInsertSteps(buckets, k, ui);
    const next = buckets.map((chain, i) => (i === h ? [...chain, k] : chain));
    startRun(
      steps,
      () => {
        setBuckets(next);
        setKeyInput("");
        clearHighlights();
      },
      {
        before: flattenKeys(buckets),
        after: flattenKeys(next),
        label: `Insert ${k}`,
      }
    );
  };

  const handleSearch = () => {
    const k = parseKey();
    if (k === null) return;
    if (!guardEmpty()) return;

    const steps = buildSearchSteps(buckets, k, ui);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: flattenKeys(buckets),
        after: flattenKeys(buckets),
        label: `Search ${k}`,
      }
    );
  };

  const handleDelete = () => {
    const k = parseKey();
    if (k === null) return;
    if (!guardEmpty()) return;

    const h = hashKey(k);
    if (!buckets[h].includes(k)) {
      setError(`Key ${k} not present in the table`);
      return;
    }

    const steps = buildDeleteSteps(buckets, k, ui);
    const next = buckets.map((chain, i) =>
      i === h ? chain.filter((entry) => entry !== k) : chain
    );
    startRun(
      steps,
      () => {
        setBuckets(next);
        setKeyInput("");
        clearHighlights();
      },
      {
        before: flattenKeys(buckets),
        after: flattenKeys(next),
        label: `Delete ${k}`,
      }
    );
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "hash-table") applyPreset([...runEntry.before]);
  };

  const memoryBlocks = flattenKeys(buckets).map((k, index) => ({
    address: `0x${(index * 4 + 100).toString(16).toUpperCase()}`,
    value: k,
    isActive:
      activeBucket !== null &&
      buckets[activeBucket][activeChainIndex] === k &&
      activeChainIndex !== null
        ? true
        : removingCell &&
            buckets[removingCell.bucket][removingCell.index] === k,
    isShifting: shiftingChain.some(
      (cell) => buckets[cell.bucket][cell.index] === k
    ),
  }));

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.insert;

  return (
    <div className="hash-table-page" ref={containerRef}>
      <h1>Interactive Hash Table Visualizer</h1>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Hash Table Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="hash-table" values={flattenKeys(buckets)} />

          {view === "story" ? (
            count === 0 ? (
              <div className="hash-table-canvas">
                <p className="empty-state">
                  Hash table is empty — insert a key to get started.
                </p>
              </div>
            ) : (
              <div className="hash-table-canvas">
                {buckets.map((chain, h) => (
                  <div
                    key={h}
                    className={`hash-bucket${activeBucket === h ? " active" : ""}`}
                    data-bucket={h}
                  >
                    <span className="hash-bucket-index">bucket[{h}]</span>
                    <div className="hash-chain">
                      {chain.length === 0 ? (
                        <span className="hash-empty">empty</span>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          {chain.map((k, i) => (
                            <ElementNode
                              key={`${h}-${i}-${k}`}
                              value={k}
                              index={i}
                              isActive={activeBucket === h && activeChainIndex === i}
                              isHighlighted={shiftingChain.some(
                                (cell) => cell.bucket === h && cell.index === i
                              )}
                              isRemoving={
                                removingCell &&
                                removingCell.bucket === h &&
                                removingCell.index === i
                              }
                              className="hash-key"
                            />
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : count === 0 ? (
            <p className="empty-state">No memory cells yet — insert a key to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`hash-table:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={HASH_TABLE_PSEUDOCODE[activeTab]}
            />
          )}

          {view === "story" && count > 0 && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>Hash Table Operations</h2>

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
              { label: "Worst case", onClick: () => applyPreset(sortedSequence(12)) },
              { label: "Average case", onClick: () => applyPreset([5, 3, 8]) },
              { label: "Random case", onClick: () => applyPreset(uniqueRandomValues(8)) },
            ]}
          />

          <div className="operation-inputs">
            <div className="input-group">
              <label>Key:</label>
              <input
                type="number"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter a key"
                disabled={isAnimating}
              />
            </div>

            <button
              className="operation-button"
              onClick={
                activeTab === "insert"
                  ? handleInsert
                  : activeTab === "search"
                    ? handleSearch
                    : handleDelete
              }
              disabled={isAnimating}
            >
              {activeTab === "insert"
                ? "Insert Key"
                : activeTab === "search"
                  ? "Search Key"
                  : "Delete Key"}
            </button>
          </div>

          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />

          <PropertyDisplay
            title="Hash Table Properties"
            properties={[
              { name: "Buckets", value: HASH_BUCKETS },
              { name: "Keys", value: count },
              { name: "Load factor", value: (count / HASH_BUCKETS).toFixed(2) },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel
            runs={listRuns("hash-table")}
            onFork={handleForkRun}
            disabled={isAnimating}
          />
        </div>
      </div>
    </div>
  );
};

export default HashTable;
