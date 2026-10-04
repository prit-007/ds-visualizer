import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  buildPushSteps,
  buildPopSteps,
  buildStackPeekSteps,
  buildEnqueueSteps,
  buildDequeueSteps,
  buildQueuePeekSteps,
  buildPushFrontSteps,
  buildPopFrontSteps,
  buildPushRearSteps,
  buildPopRearSteps,
  buildCircularEnqueueSteps,
  buildCircularDequeueSteps,
  buildCircularPeekSteps,
} from "../lib/stackQueueSteps";
import {
  STACK_PSEUDOCODE,
  QUEUE_PSEUDOCODE,
  DEQUE_PSEUDOCODE,
  CIRCULAR_QUEUE_PSEUDOCODE,
} from "../lib/pseudocode";
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

const CAPACITY = 6;

const TABS_BY_STRUCTURE = {
  stack: [
    { id: "push", label: "Push" },
    { id: "pop", label: "Pop" },
    { id: "peek", label: "Peek" },
  ],
  queue: [
    { id: "enqueue", label: "Enqueue" },
    { id: "dequeue", label: "Dequeue" },
    { id: "peek", label: "Peek" },
  ],
  deque: [
    { id: "push-front", label: "Push Front" },
    { id: "push-rear", label: "Push Rear" },
    { id: "pop-front", label: "Pop Front" },
    { id: "pop-rear", label: "Pop Rear" },
  ],
  circular: [
    { id: "enqueue", label: "Enqueue" },
    { id: "dequeue", label: "Dequeue" },
    { id: "peek", label: "Peek" },
  ],
};

const FIRST_TAB = {
  stack: "push",
  queue: "enqueue",
  deque: "push-front",
  circular: "enqueue",
};

const STRUCTURE_LABEL = {
  stack: "Stack",
  queue: "Queue",
  deque: "Deque",
  circular: "Circular",
};

const COMPLEXITY = {
  push: { operationName: "Push (top)", complexity: "O(1)", explanation: "Pushing onto the top of a stack is constant time — the new element is appended at the end." },
  pop: { operationName: "Pop (top)", complexity: "O(1)", explanation: "Popping the top of a stack is constant time — the last element is removed directly." },
  peek: { operationName: "Peek (top/front)", complexity: "O(1)", explanation: "Reading the top or front element is constant time — no elements are moved." },
  enqueue: { operationName: "Enqueue (rear)", complexity: "O(1)", explanation: "Enqueuing at the rear is constant time — the new element is appended at the end." },
  dequeue: { operationName: "Dequeue (front)", complexity: "O(n)", explanation: "With array backing, removing the front shifts every remaining element one index left, so the work grows with the queue size." },
  "push-front": { operationName: "Push Front", complexity: "O(n)", explanation: "Writing at the front of an array-backed deque shifts every element one index right to make room." },
  "push-rear": { operationName: "Push Rear", complexity: "O(1)", explanation: "Appending at the rear is constant time — the new element lands at the end." },
  "pop-front": { operationName: "Pop Front", complexity: "O(n)", explanation: "Removing the front shifts every remaining element one index left — same cost as array-backed dequeue." },
  "pop-rear": { operationName: "Pop Rear", complexity: "O(1)", explanation: "Removing the rear element is constant time — no shifting needed." },
};

const CIRCULAR_COMPLEXITY = {
  enqueue: { operationName: "Ring Enqueue", complexity: "O(1)", explanation: "The rear slot is computed with modulo arithmetic — no shifting, just one write at (front + count) mod capacity." },
  dequeue: { operationName: "Ring Dequeue", complexity: "O(1)", explanation: "The front slot is read and the front index advances by one modulo capacity — no shifting." },
  peek: { operationName: "Ring Peek", complexity: "O(1)", explanation: "Reading the front slot is a direct index — constant time." },
};

const emptyRing = () => ({ slots: Array(CAPACITY).fill(null), front: 0, count: 0 });

const StackQueue = ({ initialItems }) => {
  const [items, setItems] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "stack-queue" && Array.isArray(scenario.values)) {
      return scenario.values;
    }
    return initialItems ?? [10, 20, 30];
  });
  const [structure, setStructure] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "stack-queue") {
      if (scenario.mode === "deque" || scenario.mode === "circular" || scenario.mode === "queue") {
        return scenario.mode;
      }
    }
    return "stack";
  });
  const [circular, setCircular] = useState(emptyRing);
  const [value, setValue] = useState("");
  const [activeTab, setActiveTab] = useState("push");
  const [activeElementIndex, setActiveElementIndex] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [removingSlot, setRemovingSlot] = useState(null);
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

  const isCircular = structure === "circular";
  const emptyLabel = STRUCTURE_LABEL[structure] ?? "Structure";
  const tabs = TABS_BY_STRUCTURE[structure] ?? TABS_BY_STRUCTURE.stack;

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
    setActiveSlot(null);
    setRemovingSlot(null);
  };

  const ui = {
    setActiveElementIndex,
    setShiftingElements,
    setRemovingElementIndex,
  };

  const ringUi = { setActiveSlot, setRemovingSlot };

  const parseIntField = (raw, emptyMessage) => {
    if (!raw.trim()) {
      setError(emptyMessage);
      return null;
    }
    const v = parseInt(raw);
    if (isNaN(v)) {
      setError("Please enter a valid number");
      return null;
    }
    return v;
  };

  const guardEmpty = () => {
    if (items.length === 0) {
      setError(
        isCircular
          ? "Circular queue is empty — enqueue an element first"
          : structure === "stack"
            ? "Stack is empty — push an element first"
            : structure === "deque"
              ? "Deque is empty — insert an element first"
              : "Queue is empty — enqueue an element first"
      );
      return false;
    }
    return true;
  };

  const handlePushOrEnqueue = () => {
    const newValue = parseIntField(value, "Please enter a value");
    if (newValue === null) return;

    const isPush = structure === "stack" || structure === "deque";
    const steps = isPush
      ? structure === "stack"
        ? buildPushSteps(items, newValue, ui)
        : buildPushRearSteps(items, newValue, ui)
      : buildEnqueueSteps(items, newValue, ui);
    const nextItems = [...items, newValue];
    const label = isPush
      ? structure === "stack"
        ? `Push ${newValue}`
        : `Push rear ${newValue}`
      : `Enqueue ${newValue}`;
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
        label,
        meta: { mode: structure },
      }
    );
  };

  const handlePushFront = () => {
    const newValue = parseIntField(value, "Please enter a value");
    if (newValue === null) return;

    const steps = buildPushFrontSteps(items, newValue, ui);
    const nextItems = [newValue, ...items];
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
        label: `Push front ${newValue}`,
        meta: { mode: "deque" },
      }
    );
  };

  const handlePopOrDequeue = () => {
    if (!guardEmpty()) return;

    const steps =
      structure === "stack"
        ? buildPopSteps(items, ui)
        : structure === "deque"
          ? buildPopRearSteps(items, ui)
          : buildDequeueSteps(items, ui);
    const removed = structure === "stack" || structure === "deque" ? items[items.length - 1] : items[0];
    const nextItems = structure === "stack" || structure === "deque" ? items.slice(0, -1) : items.slice(1);
    const label = structure === "stack"
      ? `Pop ${removed}`
      : structure === "deque"
        ? `Pop rear ${removed}`
        : `Dequeue ${removed}`;
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
        label,
        meta: { mode: structure },
      }
    );
  };

  const handlePopFront = () => {
    if (!guardEmpty()) return;

    const steps = buildPopFrontSteps(items, ui);
    const removed = items[0];
    const nextItems = items.slice(1);
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
        label: `Pop front ${removed}`,
        meta: { mode: "deque" },
      }
    );
  };

  const handlePeek = () => {
    if (!guardEmpty()) return;

    let steps;
    if (structure === "stack") {
      steps = buildStackPeekSteps(items, ui);
    } else if (structure === "queue") {
      steps = buildQueuePeekSteps(items, ui);
    } else {
      // Deque peek: highlight the rear without removing.
      steps = [
        {
          description: `Finding the rear of the deque (index ${items.length - 1})`,
          kind: "compare",
          line: 2,
          vars: { n: items.length },
          action: () => {
            setActiveElementIndex(items.length - 1);
            setRemovingElementIndex?.(null);
            setShiftingElements?.([]);
          },
        },
        {
          description: `Rear of the deque is ${items[items.length - 1]}`,
          kind: "found",
          line: 4,
          vars: { rear: items[items.length - 1] },
          action: () => {},
        },
      ];
    }
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: [...items],
        after: [...items],
        label: structure === "stack" ? "Peek top" : structure === "deque" ? "Peek rear" : "Peek front",
        meta: { mode: structure },
      }
    );
  };

  const handleCircularEnqueue = () => {
    const newValue = parseIntField(value, "Please enter a value");
    if (newValue === null) return;
    if (circular.count >= CAPACITY) {
      setError(`Circular queue is full (capacity ${CAPACITY}) — dequeue first`);
      return;
    }

    const steps = buildCircularEnqueueSteps(circular, newValue, ringUi);
    const rear = (circular.front + circular.count) % CAPACITY;
    const nextSlots = [...circular.slots];
    nextSlots[rear] = newValue;
    const nextState = { slots: nextSlots, front: circular.front, count: circular.count + 1 };
    startRun(
      steps,
      () => {
        setCircular(nextState);
        setValue("");
        clearHighlights();
      },
      {
        before: { slots: [...circular.slots], front: circular.front, count: circular.count },
        after: { slots: [...nextSlots], front: circular.front, count: circular.count + 1 },
        label: `Ring enqueue ${newValue}`,
        meta: { mode: "circular" },
      }
    );
  };

  const handleCircularDequeue = () => {
    if (circular.count === 0) {
      setError("Circular queue is empty — enqueue an element first");
      return;
    }

    const steps = buildCircularDequeueSteps(circular, ringUi);
    const front = circular.front;
    const removed = circular.slots[front];
    const nextSlots = [...circular.slots];
    nextSlots[front] = null;
    const nextFront = (front + 1) % CAPACITY;
    const nextCount = circular.count - 1;
    startRun(
      steps,
      () => {
        setCircular({ slots: nextSlots, front: nextFront, count: nextCount });
        setValue("");
        clearHighlights();
      },
      {
        before: { slots: [...circular.slots], front: circular.front, count: circular.count },
        after: { slots: [...nextSlots], front: nextFront, count: nextCount },
        label: `Ring dequeue ${removed}`,
        meta: { mode: "circular" },
      }
    );
  };

  const handleCircularPeek = () => {
    if (circular.count === 0) {
      setError("Circular queue is empty — enqueue an element first");
      return;
    }

    const steps = buildCircularPeekSteps(circular, ringUi);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: { slots: [...circular.slots], front: circular.front, count: circular.count },
        after: { slots: [...circular.slots], front: circular.front, count: circular.count },
        label: "Ring peek",
        meta: { mode: "circular" },
      }
    );
  };

  const handleStructureChange = (next) => {
    if (next === structure || isAnimating) return;
    setStructure(next);
    setActiveTab(FIRST_TAB[next]);
    if (next === "circular" && circular.count === 0 && items.length > 0) {
      const seeded = items.slice(0, CAPACITY);
      setCircular({ slots: [...seeded, ...Array(CAPACITY - seeded.length).fill(null)], front: 0, count: seeded.length });
    }
    setError(null);
    setRun(null);
    clearHighlights();
    setValue("");
  };

  const handleReset = () => {
    setStructure("stack");
    setActiveTab("push");
    setItems(initialItems ?? [10, 20, 30]);
    setCircular(emptyRing());
    clearHighlights();
    setError(null);
    setRun(null);
    setValue("");
  };

  const handleClear = () => {
    setItems([]);
    setCircular(emptyRing());
    clearHighlights();
    setError(null);
    setRun(null);
    setValue("");
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure !== "stack-queue") return;
    if (runEntry.meta?.mode === "circular" && runEntry.before) {
      setStructure("circular");
      setActiveTab("enqueue");
      setCircular({
        slots: [...runEntry.before.slots],
        front: runEntry.before.front,
        count: runEntry.before.count,
      });
      clearHighlights();
      setError(null);
      setRun(null);
      setValue("");
    } else {
      applyPreset([...runEntry.before]);
    }
  };

  const handleOperation = () => {
    if (isCircular) {
      if (activeTab === "enqueue") handleCircularEnqueue();
      else if (activeTab === "dequeue") handleCircularDequeue();
      else handleCircularPeek();
      return;
    }
    if (structure === "deque") {
      if (activeTab === "push-front") handlePushFront();
      else if (activeTab === "push-rear") handlePushOrEnqueue();
      else if (activeTab === "pop-front") handlePopFront();
      else handlePopOrDequeue();
      return;
    }
    if (activeTab === "push" || activeTab === "enqueue") handlePushOrEnqueue();
    else if (activeTab === "pop" || activeTab === "dequeue") handlePopOrDequeue();
    else handlePeek();
  };

  const operationButtonLabel = () => {
    if (isCircular) {
      return activeTab === "enqueue"
        ? "Enqueue into Ring"
        : activeTab === "dequeue"
          ? "Dequeue from Ring"
          : "Peek Ring Front";
    }
    if (structure === "deque") {
      return activeTab === "push-front"
        ? "Push at Front"
        : activeTab === "push-rear"
          ? "Push at Rear"
          : activeTab === "pop-front"
            ? "Pop at Front"
            : "Pop at Rear";
    }
    return activeTab === "push"
      ? "Push onto Stack"
      : activeTab === "pop"
        ? "Pop from Stack"
        : activeTab === "enqueue"
          ? "Enqueue at Rear"
          : activeTab === "dequeue"
            ? "Dequeue at Front"
            : structure === "stack"
              ? "Peek Top"
              : "Peek Front";
  };

  const pseudocodeFor = () => {
    if (structure === "stack") return STACK_PSEUDOCODE[activeTab];
    if (structure === "queue") return QUEUE_PSEUDOCODE[activeTab];
    if (structure === "deque") return DEQUE_PSEUDOCODE[activeTab];
    return CIRCULAR_QUEUE_PSEUDOCODE[activeTab];
  };

  const complexityInfo = (() => {
    if (structure === "circular") {
      return CIRCULAR_COMPLEXITY[activeTab] ?? CIRCULAR_COMPLEXITY.enqueue;
    }
    return COMPLEXITY[activeTab] ?? COMPLEXITY.push;
  })();

  const showValueInput =
    (isCircular && activeTab === "enqueue") ||
    (!isCircular &&
      (activeTab === "push" ||
        activeTab === "enqueue" ||
        activeTab === "push-front" ||
        activeTab === "push-rear"));

  const ringSlots = circular.slots.map((slotValue, i) => ({
    index: i,
    value: slotValue,
    isFront: i === circular.front && circular.count > 0,
    isRear:
      circular.count > 0 &&
      i === (circular.front + circular.count) % CAPACITY &&
      circular.count < CAPACITY,
    isActive: activeSlot === i,
    isRemoving: removingSlot === i,
  }));

  const memoryBlocks = isCircular
    ? Array.from({ length: circular.count }, (_, k) => {
        const slot = (circular.front + k) % CAPACITY;
        return {
          address: `0x${(k * 4 + 100).toString(16).toUpperCase()}`,
          value: circular.slots[slot],
          isActive: activeSlot === slot,
          isShifting: false,
        };
      })
    : items.map((itemValue, index) => ({
        address: `0x${(index * 4 + 100).toString(16).toUpperCase()}`,
        value: itemValue,
        isActive: activeElementIndex === index,
        isShifting: shiftingElements.includes(index),
      }));

  return (
    <div className="stack-queue-page" ref={containerRef}>
      <h1>Interactive Stack & Queue Visualizer</h1>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Stack & Queue Visualization</h2>

          <div className="structure-toggle" role="group" aria-label="Structure">
            {["stack", "queue", "deque", "circular"].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={structure === s}
                onClick={() => handleStructureChange(s)}
                disabled={isAnimating}
              >
                {STRUCTURE_LABEL[s]}
              </button>
            ))}
          </div>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton
            structure="stack-queue"
            values={items}
            extra={{ mode: structure }}
          />

          <div className="data-actions">
            <button
              type="button"
              className="data-action-btn"
              onClick={handleReset}
              disabled={isAnimating}
            >
              Reset
            </button>
            <button
              type="button"
              className="data-action-btn danger"
              onClick={handleClear}
              disabled={isAnimating}
            >
              Clear
            </button>
          </div>


          {view === "story" ? (
            isCircular ? (
              <div className="stack-queue-container">
                <div className="ring-slots">
                  {ringSlots.map((slot) => (
                    <div
                      key={slot.index}
                      className={`ring-slot${slot.isFront ? " front" : ""}${slot.isRear ? " rear" : ""}${slot.isActive ? " active" : ""}${slot.isRemoving ? " removing" : ""}`}
                    >
                      <span className="ring-index">{slot.index}</span>
                      <span className="ring-value">{slot.value ?? "—"}</span>
                      {slot.isFront && <span className="ring-badge">front</span>}
                      {slot.isRear && <span className="ring-badge rear-badge">rear</span>}
                    </div>
                  ))}
                </div>
                {circular.count === 0 && (
                  <p className="empty-state">
                    Circular queue is empty — enqueue to get started.
                  </p>
                )}
              </div>
            ) : items.length === 0 ? (
              <div className="stack-queue-container">
                <p className="empty-state">
                  {emptyLabel} is empty —{" "}
                  {structure === "stack"
                    ? "push"
                    : structure === "deque"
                      ? "insert at either end"
                      : "enqueue"}{" "}
                  an element to get started.
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
          ) : isCircular && circular.count === 0 ? (
            <p className="empty-state">No memory cells yet — enqueue an element to get started.</p>
          ) : !isCircular && items.length === 0 ? (
            <p className="empty-state">No memory cells yet — add an element to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`stack-queue:${structure}:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={pseudocodeFor()}
            />
          )}

          {view === "story" && ((isCircular && circular.count > 0) || (!isCircular && items.length > 0)) && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>{emptyLabel} Operations</h2>

          <ErrorMessage message={error} />

          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={isAnimating}
          />

          {!isCircular && (
            <CasePresets
              disabled={isAnimating}
              presets={[
                { label: "Worst case", onClick: () => applyPreset(sortedSequence(12)) },
                { label: "Average case", onClick: () => applyPreset([5, 3, 8]) },
                { label: "Random case", onClick: () => applyPreset(randomValues(8)) },
              ]}
            />
          )}

          <form className="operation-inputs" onSubmit={(e) => {
            e.preventDefault();
            handleOperation();
          }}>
            {showValueInput && (
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
              type="submit"
              className="operation-button"
              disabled={isAnimating}
            >
              {operationButtonLabel()}
            </button>
          </form>

          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />

          <PropertyDisplay
            title="Stack & Queue Properties"
            properties={
              isCircular
                ? [
                    { name: "Capacity", value: CAPACITY },
                    { name: "Front", value: circular.front },
                    { name: "Filled", value: circular.count },
                  ]
                : [
                    { name: "Length", value: items.length },
                    { name: "Memory Size", value: `${items.length * 4} bytes` },
                  ]
            }
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
