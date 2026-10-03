import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  buildPushSteps,
  buildPopSteps,
  buildStackPeekSteps,
  buildEnqueueSteps,
  buildDequeueSteps,
  buildQueuePeekSteps,
} from "../lib/stackQueueSteps";
import { STACK_PSEUDOCODE, QUEUE_PSEUDOCODE } from "../lib/pseudocode";
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
import "./StackQueue.css";

const STACK_TABS = [
  { id: "push", label: "Push" },
  { id: "pop", label: "Pop" },
  { id: "peek", label: "Peek" },
];

const QUEUE_TABS = [
  { id: "enqueue", label: "Enqueue" },
  { id: "dequeue", label: "Dequeue" },
  { id: "peek", label: "Peek" },
];

const COMPLEXITY = {
  push: { operationName: "Push (top)", complexity: "O(1)", explanation: "Pushing onto the top of a stack is constant time — the new element is appended at the end." },
  pop: { operationName: "Pop (top)", complexity: "O(1)", explanation: "Popping the top of a stack is constant time — the last element is removed directly." },
  peek: { operationName: "Peek (top/front)", complexity: "O(1)", explanation: "Reading the top or front element is constant time — no elements are moved." },
  enqueue: { operationName: "Enqueue (rear)", complexity: "O(1)", explanation: "Enqueuing at the rear is constant time — the new element is appended at the end." },
  dequeue: { operationName: "Dequeue (front)", complexity: "O(n)", explanation: "With array backing, removing the front shifts every remaining element one index left, so the work grows with the queue size." },
};

const StackQueue = ({ initialItems }) => {
  const [items, setItems] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "stack-queue" && Array.isArray(scenario.values)) {
      return scenario.values;
    }
    return initialItems ?? [10, 20, 30];
  });
  const [structure, setStructure] = useState("stack");
  const [value, setValue] = useState("");
  const [activeTab, setActiveTab] = useState("push");
  const [activeElementIndex, setActiveElementIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [removingElementIndex, setRemovingElementIndex] = useState(null);
  const [shiftingElements, setShiftingElements] = useState([]);
  const [view, setView] = useState("story");

  const containerRef = useRef(null);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const isStack = structure === "stack";
  const emptyLabel = isStack ? "Stack" : "Queue";

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "stack-queue", steps, ...runMeta });
  };

  const applyPreset = (values) => {
    setItems(values);
    setActiveElementIndex(null);
    setRemovingElementIndex(null);
    setShiftingElements([]);
    setError(null);
    setRun(null);
    setValue("");
  };

  const clearHighlights = () => {
    setActiveElementIndex(null);
    setRemovingElementIndex(null);
    setShiftingElements([]);
  };

  const ui = {
    setActiveElementIndex,
    setShiftingElements,
    setRemovingElementIndex,
  };

  const guardEmpty = () => {
    if (items.length === 0) {
      setError(
        isStack
          ? "Stack is empty — push an element first"
          : "Queue is empty — enqueue an element first"
      );
      return false;
    }
    return true;
  };

  const handlePushOrEnqueue = () => {
    if (!value.trim()) {
      setError("Please enter a value");
      return;
    }

    const newValue = parseInt(value);
    if (isNaN(newValue)) {
      setError("Please enter a valid number");
      return;
    }

    const steps = isStack
      ? buildPushSteps(items, newValue, ui)
      : buildEnqueueSteps(items, newValue, ui);
    const nextItems = [...items, newValue];
    startRun(
      steps,
      () => {
        setItems(nextItems);
        setValue("");
        clearHighlights();
      },
      {
        before: [...items],
        after: nextItems,
        label: `${isStack ? "Push" : "Enqueue"} ${newValue}`,
      }
    );
  };

  const handlePopOrDequeue = () => {
    if (!guardEmpty()) return;

    const steps = isStack ? buildPopSteps(items, ui) : buildDequeueSteps(items, ui);
    const removed = isStack ? items[items.length - 1] : items[0];
    const nextItems = isStack ? items.slice(0, -1) : items.slice(1);
    startRun(
      steps,
      () => {
        setItems(nextItems);
        setValue("");
        clearHighlights();
      },
      {
        before: [...items],
        after: nextItems,
        label: `${isStack ? "Pop" : "Dequeue"} ${removed}`,
      }
    );
  };

  const handlePeek = () => {
    if (!guardEmpty()) return;

    const steps = isStack
      ? buildStackPeekSteps(items, ui)
      : buildQueuePeekSteps(items, ui);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: [...items],
        after: [...items],
        label: isStack ? "Peek top" : "Peek front",
      }
    );
  };

  const handleStructureChange = (next) => {
    if (next === structure || isAnimating) return;
    setStructure(next);
    setActiveTab(next === "stack" ? "push" : "enqueue");
    setError(null);
    setRun(null);
    clearHighlights();
    setValue("");
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "stack-queue") applyPreset([...runEntry.before]);
  };

  const memoryBlocks = items.map((itemValue, index) => ({
    address: `0x${(index * 4 + 100).toString(16).toUpperCase()}`,
    value: itemValue,
    isActive: activeElementIndex === index,
    isShifting: shiftingElements.includes(index),
  }));

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.push;

  return (
    <div className="stack-queue-page" ref={containerRef}>
      <h1>Interactive Stack & Queue Visualizer</h1>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Stack & Queue Visualization</h2>

          <div className="structure-toggle" role="group" aria-label="Structure">
            <button
              type="button"
              aria-pressed={isStack}
              onClick={() => handleStructureChange("stack")}
              disabled={isAnimating}
            >
              Stack
            </button>
            <button
              type="button"
              aria-pressed={!isStack}
              onClick={() => handleStructureChange("queue")}
              disabled={isAnimating}
            >
              Queue
            </button>
          </div>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="stack-queue" values={items} />

          {view === "story" ? (
            items.length === 0 ? (
              <div className="stack-queue-container">
                <p className="empty-state">
                  {emptyLabel} is empty — {isStack ? "push" : "enqueue"} an element to get started.
                </p>
              </div>
            ) : (
              <div className="stack-queue-container">
                <div className="stack-queue-bracket" aria-hidden="true">[</div>
                <div className="stack-queue-elements">
                  <AnimatePresence mode="popLayout">
                    {items.map((itemValue, index) => (
                      <ElementNode
                        key={`${index}-${itemValue}`}
                        value={itemValue}
                        index={index}
                        isActive={activeElementIndex === index}
                        isHighlighted={shiftingElements.includes(index)}
                        isRemoving={removingElementIndex === index}
                        className="stack-queue-element"
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="stack-queue-bracket" aria-hidden="true">]</div>
              </div>
            )
          ) : items.length === 0 ? (
            <p className="empty-state">No memory cells yet — add an element to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`stack-queue:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={(isStack ? STACK_PSEUDOCODE : QUEUE_PSEUDOCODE)[activeTab]}
            />
          )}

          {view === "story" && items.length > 0 && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>{emptyLabel} Operations</h2>

          <ErrorMessage message={error} />

          <TabNavigation
            tabs={isStack ? STACK_TABS : QUEUE_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={isAnimating}
          />

          <CasePresets
            disabled={isAnimating}
            presets={[
              { label: "Worst case", onClick: () => applyPreset(sortedSequence(12)) },
              { label: "Average case", onClick: () => applyPreset([5, 3, 8]) },
              { label: "Random case", onClick: () => applyPreset(randomValues(8)) },
            ]}
          />

          <div className="operation-inputs">
            {(activeTab === "push" || activeTab === "enqueue") && (
              <div className="input-group">
                <label>Value:</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter a number"
                  disabled={isAnimating}
                />
              </div>
            )}

            <button
              className="operation-button"
              onClick={
                activeTab === "push" || activeTab === "enqueue"
                  ? handlePushOrEnqueue
                  : activeTab === "pop" || activeTab === "dequeue"
                    ? handlePopOrDequeue
                    : handlePeek
              }
              disabled={isAnimating}
            >
              {activeTab === "push"
                ? "Push onto Stack"
                : activeTab === "pop"
                  ? "Pop from Stack"
                  : activeTab === "enqueue"
                    ? "Enqueue at Rear"
                    : activeTab === "dequeue"
                      ? "Dequeue at Front"
                      : isStack
                        ? "Peek Top"
                        : "Peek Front"}
            </button>
          </div>

          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />

          <PropertyDisplay
            title="Stack & Queue Properties"
            properties={[
              { name: "Length", value: items.length },
              { name: "Memory Size", value: `${items.length * 4} bytes` },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel
            runs={listRuns("stack-queue")}
            onFork={handleForkRun}
            disabled={isAnimating}
          />
        </div>
      </div>
    </div>
  );
};

export default StackQueue;
