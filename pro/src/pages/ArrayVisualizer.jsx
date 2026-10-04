import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { buildAddSteps, buildInsertSteps, buildRemoveSteps } from "../lib/arraySteps";
import { ARRAY_PSEUDOCODE } from "../lib/pseudocode";
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

const ArrayVisualizer = ({ initialArray }) => {
  // State
  const [array, setArray] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "array" && Array.isArray(scenario.values)) {
      return scenario.values;
    }
    return initialArray ?? [10, 20, 30, 40, 50];
  });
  const [value, setValue] = useState("");
  const [position, setPosition] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const [activeElementIndex, setActiveElementIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [removingElementIndex, setRemovingElementIndex] = useState(null);
  const [shiftingElements, setShiftingElements] = useState([]);
  const [view, setView] = useState("story");

  // Refs
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
    if (runMeta) recordRun({ structure: "array", steps, ...runMeta });
  };

  const applyPreset = (values) => {
    setArray(values);
    setActiveElementIndex(null);
    setRemovingElementIndex(null);
    setShiftingElements([]);
    setError(null);
    setRun(null);
    setValue("");
    setPosition("");
  };
  
  // Operation handlers
  const handleAddElement = () => {
    if (!value.trim()) {
      setError("Please enter a value");
      return;
    }
    
    const newValue = parseInt(value);
    if (isNaN(newValue)) {
      setError("Please enter a valid number");
      return;
    }
    
    const steps = buildAddSteps(array, newValue, {
      setActiveElementIndex,
      setShiftingElements,
      setRemovingElementIndex,
    });
    
    // Run the animation
    const nextArray = [...array, newValue];
    startRun(
      steps,
      () => {
        // Update the array after animation
        setArray(nextArray);
        setValue("");
        setActiveElementIndex(null);
      },
      { before: [...array], after: nextArray, label: `Add ${newValue}` }
    );
  };
  
  const handleInsertElement = () => {
    if (!value.trim() || !position.trim()) {
      setError("Please enter both a value and position");
      return;
    }
    
    const newValue = parseInt(value);
    const pos = parseInt(position);
    
    if (isNaN(newValue) || isNaN(pos)) {
      setError("Please enter valid numbers");
      return;
    }
    
    if (pos < 0 || pos > array.length) {
      setError(`Position must be between 0 and ${array.length}`);
      return;
    }
    
    const steps = buildInsertSteps(array, newValue, pos, {
      setActiveElementIndex,
      setShiftingElements,
      setRemovingElementIndex,
    });
    
    // Run the animation
    const nextArray = [...array];
    nextArray.splice(pos, 0, newValue);
    startRun(
      steps,
      () => {
        // Update the array after animation
        setArray(nextArray);
        setValue("");
        setPosition("");
        setActiveElementIndex(null);
        setShiftingElements([]);
      },
      { before: [...array], after: nextArray, label: `Insert ${newValue} at ${pos}` }
    );
  };
  
  const handleRemoveElement = () => {
    if (!position.trim()) {
      setError("Please enter a position");
      return;
    }
    
    const pos = parseInt(position);
    
    if (isNaN(pos)) {
      setError("Please enter a valid position");
      return;
    }
    
    if (array.length === 0) {
      setError("Array is empty — add an element first");
      return;
    }
    
    if (pos < 0 || pos >= array.length) {
      setError(`Position must be between 0 and ${array.length - 1}`);
      return;
    }
    
    const steps = buildRemoveSteps(array, pos, {
      setActiveElementIndex,
      setShiftingElements,
      setRemovingElementIndex,
    });
    
    // Run the animation
    const nextArray = [...array];
    nextArray.splice(pos, 1);
    startRun(
      steps,
      () => {
        // Update the array after animation
        setArray(nextArray);
        setPosition("");
        setActiveElementIndex(null);
        setRemovingElementIndex(null);
        setShiftingElements([]);
      },
      { before: [...array], after: nextArray, label: `Remove at ${pos}` }
    );
  };

  const handleReset = () => {
    applyPreset(initialArray ?? [10, 20, 30, 40, 50]);
  };

  const handleClear = () => {
    applyPreset([]);
  };

  const handleForkRun = (run) => {
    if (run.structure === "array") applyPreset([...run.before]);
  };

  const memoryBlocks = array.map((value, index) => ({
    address: `0x${(index * 4 + 100).toString(16).toUpperCase()}`,
    value,
    isActive: activeElementIndex === index,
    isShifting: shiftingElements.includes(index),
  }));

  return (
    <div className="array-visualizer-container" ref={containerRef}>
      <h1>Interactive Array Visualizer</h1>

      <div className="visualizer-grid">
        {/* Visualization area */}
        <div className="visualization-area">
          <h2>Array Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="array" values={array} />

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
            <div className="array-container">
              {array.length === 0 ? (
                <p className="empty-state">Array is empty — add an element to get started.</p>
              ) : (
                <div className="array-display">
                  <div className="array-bracket">[</div>
                  <div className="array-elements">
                    <AnimatePresence mode="popLayout">
                      {array.map((value, index) => (
                        <ElementNode
                          key={`${index}-${value}`}
                          value={value}
                          index={index}
                          isActive={activeElementIndex === index}
                          isHighlighted={shiftingElements.includes(index)}
                          isRemoving={removingElementIndex === index}
                          className="array-element"
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="array-bracket">]</div>
                </div>
              )}
            </div>
          ) : array.length === 0 ? (
            <p className="empty-state">No memory cells yet — add an element to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`array:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={ARRAY_PSEUDOCODE[activeTab]}
            />
          )}

          {/* Memory representation (story view only — memory view shows it above) */}
          {view === "story" && <MemoryRepresentation blocks={memoryBlocks} />}
        </div>
        
        {/* Controls area */}
        <div className="controls-area">
          <h2>Array Operations</h2>
          
          <ErrorMessage message={error} />

          <TabNavigation
            tabs={[
              { id: "add", label: "Add (Push)" },
              { id: "insert", label: "Insert At" },
              { id: "remove", label: "Remove At" },
            ]}
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

          <form className="operation-inputs" onSubmit={(e) => {
            e.preventDefault();
            if (activeTab === "add") handleAddElement();
            else if (activeTab === "insert") handleInsertElement();
            else handleRemoveElement();
          }}>
            {(activeTab === "add" || activeTab === "insert") && (
              <div className="input-group">
                <label>Value:</label>
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="Enter a number"
                  disabled={isAnimating}
                />
              </div>
            )}
            
            {(activeTab === "insert" || activeTab === "remove") && (
              <div className="input-group">
                <label>Position:</label>
                <input
                  type="number"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder={
                    activeTab === "insert"
                      ? `Enter position (0-${array.length})`
                      : array.length === 0
                        ? "Enter position"
                        : `Enter position (0-${array.length - 1})`
                  }
                  disabled={isAnimating}
                />
              </div>
            )}
            
            <button
              type="submit"
              className="operation-button"
              disabled={isAnimating}
            >
              {activeTab === "add" 
                ? "Add to End" 
                : activeTab === "insert" 
                  ? "Insert at Position" 
                  : "Remove Element"}
            </button>
          </form>
          
          {/* Complexity info */}
          <ComplexityInfo
            operationName={
              activeTab === "add"
                ? "Add to End (Push)"
                : activeTab === "insert"
                  ? "Insert at Position"
                  : "Remove at Position"
            }
            complexity={activeTab === "add" ? "O(1)" : "O(n)"}
            explanation={
              activeTab === "add"
                ? "Adding to the end of an array is constant time because we directly access the end position."
                : activeTab === "insert"
                  ? "Insertion requires shifting elements to make space, which is proportional to array size."
                  : "Removal requires shifting elements to close the gap, which is proportional to array size."
            }
          />

          {/* Array properties */}
          <PropertyDisplay
            title="Array Properties"
            properties={[
              { name: "Length", value: array.length },
              { name: "Memory Size", value: `${array.length * 4} bytes` },
            ]}
          />
        </div>

        {/* Run history: fork rewinds to a run's before state */}
        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel
            runs={listRuns("array")}
            onFork={handleForkRun}
            disabled={isAnimating}
          />
        </div>
      </div>
    </div>
  );
};

export default ArrayVisualizer;