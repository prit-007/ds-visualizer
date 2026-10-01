import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import "./LinkedListVisualizer.css";
import { buildAddSteps, buildInsertSteps, buildRemoveSteps } from "../lib/linkedListSteps";
import { LINKED_LIST_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import { prefersReducedMotion } from "../lib/motionPrefs";
import OperationPlayer from "../components/OperationPlayer";
import TabNavigation from "../components/TabNavigation";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import MemoryRepresentation from "../components/MemoryRepresentation";
import CasePresets from "../components/CasePresets";
import { randomValues, sortedSequence } from "../lib/presets";

const LinkedListNode = ({ value, index, isActive, isHighlighted, isRemoving }) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    if (isActive) {
      const target = {
        scale: 1.1,
        boxShadow: "0 0 20px rgba(99, 102, 241, 0.6)",
        duration: 0.3
      };
      if (prefersReducedMotion()) {
        gsap.set(nodeRef.current, { scale: target.scale, boxShadow: target.boxShadow });
      } else {
        gsap.to(nodeRef.current, target);
      }
    } else {
      const target = {
        scale: 1,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        duration: 0.3
      };
      if (prefersReducedMotion()) {
        gsap.set(nodeRef.current, { scale: target.scale, boxShadow: target.boxShadow });
      } else {
        gsap.to(nodeRef.current, target);
      }
    }
  }, [isActive]);

  return (
    <motion.div
      ref={nodeRef}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isRemoving ? 0 : 1, 
        opacity: isRemoving ? 0 : 1,
        backgroundColor: isHighlighted ? "#4f46e5" : "#ffffff"
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 12 }}
      className={`linked-list-node ${isActive ? 'active' : ''} ${isHighlighted ? 'highlighted' : ''}`}
    >
      <span className="node-value">{value}</span>
      <span className="node-index">{index}</span>
    </motion.div>
  );
};

const LinkedListPointer = ({ isActive }) => {
  const arrowRef = useRef(null);
  
  useEffect(() => {
    if (isActive) {
      if (prefersReducedMotion()) {
        gsap.set(arrowRef.current, { stroke: "#4f46e5", strokeWidth: 3, x: 0 });
      } else {
        gsap.to(arrowRef.current, {
          stroke: "#4f46e5",
          strokeWidth: 3,
          duration: 0.3
        });
        gsap.to(arrowRef.current, {
          x: "+=5",
          repeat: 3,
          yoyo: true,
          duration: 0.2
        });
      }
    } else {
      if (prefersReducedMotion()) {
        gsap.set(arrowRef.current, { stroke: "#94a3b8", strokeWidth: 2, x: 0 });
      } else {
        gsap.to(arrowRef.current, {
          stroke: "#94a3b8",
          strokeWidth: 2,
          x: 0,
          duration: 0.3
        });
      }
    }
  }, [isActive]);

  return (
    <div className="pointer-container">
      <motion.div 
        className="line"
        initial={{ width: 0 }}
        animate={{ 
          width: "2rem",
          backgroundColor: isActive ? "#4f46e5" : "#cbd5e1",
          height: isActive ? 3 : 2
        }}
        exit={{ width: 0 }}
      />
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path
          ref={arrowRef}
          d="M5 12H19M19 12L12 5M19 12L12 19"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const LinkedListVisualizer = ({ initialNodes }) => {
  // State
  const [nodes, setNodes] = useState(() => initialNodes ?? [10, 20, 30, 40].map(createNode));
  const [value, setValue] = useState("");
  const [position, setPosition] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const [activeNodeIndex, setActiveNodeIndex] = useState(null);
  const [activePointerIndex, setActivePointerIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [removingNodeIndex, setRemovingNodeIndex] = useState(null);
  
  // Refs
  const containerRef = useRef(null);
  
  // Helper functions
  function createNode(value) {
    return { id: generateId(), value };
  }
  
  function generateId() {
    return `node-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Stable heap addresses: first-seen order, never reused after removals
  const addressMapRef = useRef(new Map());
  const addressOf = (node) => {
    if (!addressMapRef.current.has(node)) {
      const address = 0x2000 + addressMapRef.current.size * 16;
      addressMapRef.current.set(node, `0x${address.toString(16).toUpperCase()}`);
    }
    return addressMapRef.current.get(node);
  };
  const memoryBlocks = nodes.map((node, index) => ({
    address: addressOf(node),
    value: node.value,
    pointers: [
      {
        label: "next",
        target: index + 1 < nodes.length ? addressOf(nodes[index + 1]) : null,
      },
    ],
  }));
  
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const startRun = (steps, onComplete) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
  };

  const applyPreset = (values) => {
    setNodes(values.map(createNode));
    setActiveNodeIndex(null);
    setActivePointerIndex(null);
    setRemovingNodeIndex(null);
    setError(null);
    setRun(null);
    setValue("");
    setPosition("");
  };
  
  // Operation handlers
  const handleAddNode = () => {
    if (!value.trim()) {
      setError("Please enter a value");
      return;
    }
    
    const newValue = parseInt(value);
    if (isNaN(newValue)) {
      setError("Please enter a valid number");
      return;
    }
    
    // Create new node
    const newNode = createNode(newValue);
    
    const steps = buildAddSteps(nodes, newValue, {
      setActiveNodeIndex,
      setActivePointerIndex,
      setRemovingNodeIndex,
    });
    
    // Run the animation
    startRun(steps, () => {
      // Update the list after animation
      setNodes([...nodes, newNode]);
      setValue("");
      setActiveNodeIndex(null);
      setActivePointerIndex(null);
    });
  };
  
  const handleInsertNode = () => {
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
    
    if (pos < 0 || pos > nodes.length) {
      setError(`Position must be between 0 and ${nodes.length}`);
      return;
    }
    
    // Create new node
    const newNode = createNode(newValue);
    
    const steps = buildInsertSteps(nodes, newValue, pos, {
      setActiveNodeIndex,
      setActivePointerIndex,
      setRemovingNodeIndex,
    });
    
    // Run the animation
    startRun(steps, () => {
      // Update the list after animation
      const updatedNodes = [
        ...nodes.slice(0, pos),
        newNode,
        ...nodes.slice(pos)
      ];
      setNodes(updatedNodes);
      setValue("");
      setPosition("");
      setActiveNodeIndex(null);
      setActivePointerIndex(null);
    });
  };
  
  const handleRemoveNode = () => {
    if (!position.trim()) {
      setError("Please enter a position");
      return;
    }
    
    const pos = parseInt(position);
    
    if (isNaN(pos)) {
      setError("Please enter a valid position");
      return;
    }
    
    if (nodes.length === 0) {
      setError("List is empty — add a node first");
      return;
    }
    
    if (pos < 0 || pos >= nodes.length) {
      setError(`Position must be between 0 and ${nodes.length - 1}`);
      return;
    }
    
    const steps = buildRemoveSteps(nodes, pos, {
      setActiveNodeIndex,
      setActivePointerIndex,
      setRemovingNodeIndex,
    });
    
    // Run the animation
    startRun(steps, () => {
      // Update the list after animation
      const updatedNodes = [
        ...nodes.slice(0, pos),
        ...nodes.slice(pos + 1)
      ];
      setNodes(updatedNodes);
      setPosition("");
      setActiveNodeIndex(null);
      setActivePointerIndex(null);
      setRemovingNodeIndex(null);
    });
  };

  return (
    <div className="linked-list-visualizer-container" ref={containerRef}>
      <h1>Interactive Linked List Visualizer</h1>
      
      <div className="visualizer-grid">
        {/* Visualization area */}
        <div className="visualization-area">
          <h2>Linked List Visualization</h2>
          
          <div className="linked-list-display">
            {nodes.length === 0 ? (
              <p className="empty-state">Linked list is empty — add a node to get started.</p>
            ) : (
              <AnimatePresence mode="popLayout">
                {nodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <LinkedListNode 
                      value={node.value}
                      index={index}
                      isActive={activeNodeIndex === index}
                      isHighlighted={false}
                      isRemoving={removingNodeIndex === index}
                    />
                    
                    {index < nodes.length - 1 && (
                      <LinkedListPointer isActive={activePointerIndex === index} />
                    )}
                  </React.Fragment>
                ))}
              </AnimatePresence>
            )}
          </div>
          
          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`linked-list:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={LINKED_LIST_PSEUDOCODE[activeTab]}
            />
          )}

          <MemoryRepresentation blocks={memoryBlocks} />
        </div>
        
        {/* Controls area */}
        <div className="controls-area">
          <h2>Linked List Operations</h2>
          
          <ErrorMessage message={error} />

          <TabNavigation
            tabs={[
              { id: "add", label: "Add" },
              { id: "insert", label: "Insert" },
              { id: "remove", label: "Remove" },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={isAnimating}
          />

          <CasePresets
            disabled={isAnimating}
            presets={[
              { label: "Worst case", onClick: () => applyPreset(sortedSequence(12)) },
              { label: "Average case", onClick: () => applyPreset([10, 20, 30, 40]) },
              { label: "Random case", onClick: () => applyPreset(randomValues(8)) },
            ]}
          />

          <div className="operation-inputs">
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
                      ? `Enter position (0-${nodes.length})`
                      : nodes.length === 0
                        ? "Enter position"
                        : `Enter position (0-${nodes.length - 1})`
                  }
                  disabled={isAnimating}
                />
              </div>
            )}
            
            <button
              className="operation-button"
              onClick={
                activeTab === "add" 
                  ? handleAddNode 
                  : activeTab === "insert" 
                    ? handleInsertNode 
                    : handleRemoveNode
              }
              disabled={isAnimating}
            >
              {activeTab === "add" 
                ? "Add to End" 
                : activeTab === "insert" 
                  ? "Insert at Position" 
                  : "Remove Node"}
            </button>
          </div>

          <ComplexityInfo
            operationName={
              activeTab === "add"
                ? "Add to End"
                : activeTab === "insert"
                  ? "Insert at Position"
                  : "Remove at Position"
            }
            complexity="O(n)"
            explanation={
              activeTab === "add"
                ? "Appending walks the chain to the tail first, so time grows with list length — unlike an array push."
                : activeTab === "insert"
                  ? "Insertion walks to the position, then relinks a single pointer — no elements are shifted."
                  : "Removal walks to the position, then relinks the previous pointer — no elements are shifted."
            }
          />

          <PropertyDisplay
            title="Linked List Properties"
            properties={[
              { name: "Length", value: nodes.length },
              { name: "Memory Size", value: `${nodes.length * 16} bytes` },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default LinkedListVisualizer;