import React, { useState, useRef, useEffect } from "react";
import ElementNode from "../components/ElementNode";
import OperationPlayer from "../components/OperationPlayer";
import PropertyDisplay from "../components/PropertyDisplay";
import TabNavigation from "../components/TabNavigation";
import ComplexityInfo from "../components/ComplexityInfo";
import ErrorMessage from "../components/ErrorMessage";
import MemoryRepresentation from "../components/MemoryRepresentation";
import ViewToggle from "../components/ViewToggle";
import ShareButton from "../components/ShareButton";
import { readScenario } from "../lib/share";
import CasePresets from "../components/CasePresets";
import { sortedSequence, uniqueRandomValues } from "../lib/presets";
import "./TreeVisualizer.css";
import { AVLTree } from "../lib/avl";
import { buildInsertSteps, buildDeleteSteps, buildSearchSteps, buildTraversalSteps } from "../lib/treeSteps";
import { TREE_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import { layoutTree } from "../lib/treeLayout";

// Cubic connector from parent bottom to child top (pure; used by the svg layer)
const edgePath = ({ x1, y1, x2, y2 }) => {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
};

const TreeVisualizer = () => {
  // State
  const [tree] = useState(() => {
    const instance = new AVLTree();
    const scenario = readScenario();
    if (scenario && scenario.structure === "tree" && Array.isArray(scenario.values)) {
      scenario.values.forEach((v) => {
        instance.root = instance.insert(instance.root, v);
      });
    }
    return instance;
  });
  const [treeRoot, setTreeRoot] = useState(() => tree.root);
  const [value, setValue] = useState("");
  const [activeTab, setActiveTab] = useState("insert");
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [activeNodeValue, setActiveNodeValue] = useState(null);
  const [removingNodeValue, setRemovingNodeValue] = useState(null);
  const [traversalResult, setTraversalResult] = useState([]);
  const [traversalType, setTraversalType] = useState("inOrder");
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [pseudocodeKey, setPseudocodeKey] = useState("insert");
  const [error, setError] = useState(null);
  const [showTraversalAnimation, setShowTraversalAnimation] = useState(false);
  const [rotations, setRotations] = useState(true);
  const [view, setView] = useState("story");
  
  // Refs
  const containerRef = useRef(null);
  
  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Counterfactual toggle: strategy flag on the shared AVL instance;
  // applies to the next operation (existing nodes keep their shape).
  useEffect(() => {
    tree.rotations = rotations;
  }, [rotations, tree]);

  const startRun = (steps, onComplete) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
  };

  // Completion shared by every run: clear transient highlights first
  const withCleanup = (body) => () => {
    setHighlightedNodes([]);
    setActiveNodeValue(null);
    body();
  };

  // Stable heap addresses: assigned on first sight, never reused
  const addressMapRef = useRef(new Map());
  const addressOf = (node) => {
    if (!addressMapRef.current.has(node)) {
      const address = 0x3000 + addressMapRef.current.size * 16;
      addressMapRef.current.set(node, `0x${address.toString(16).toUpperCase()}`);
    }
    return addressMapRef.current.get(node);
  };
  const memoryBlocks = [];
  const collectMemoryBlocks = (node) => {
    if (!node) return;
    memoryBlocks.push({
      address: addressOf(node),
      value: node.value,
      pointers: [
        { label: "left", target: node.left ? addressOf(node.left) : null },
        { label: "right", target: node.right ? addressOf(node.right) : null },
      ],
    });
    collectMemoryBlocks(node.left);
    collectMemoryBlocks(node.right);
  };
  collectMemoryBlocks(tree.root);

  const applyPreset = (values) => {
    tree.root = null;
    tree.nodeCount = 0;
    values.forEach((v) => {
      tree.root = tree.insert(tree.root, v);
    });
    buildVisualTree();
    setActiveNodeValue(null);
    setHighlightedNodes([]);
    setRemovingNodeValue(null);
    setError(null);
    setRun(null);
    setValue("");
  };

  // Building the visual tree from the AVL tree
  const buildVisualTree = () => {
    setTreeRoot(tree.root);
  };

  // Operation handlers
  const handleInsert = () => {
    if (!value.trim()) {
      setError("Please enter a value");
      return;
    }
    
    const newValue = parseInt(value);
    if (isNaN(newValue)) {
      setError("Please enter a valid number");
      return;
    }
    
    if (tree.search(tree.root, newValue)) {
      setError("Value already exists in the tree");
      return;
    }
    
    const trace = [];
    tree.root = tree.insert(tree.root, newValue, trace);

    const steps = buildInsertSteps(trace, newValue, {
      setActiveNodeValue,
      setHighlightedNodes,
      setRemovingNodeValue,
    });

    setPseudocodeKey("insert");
    // Run the animation
    startRun(
      steps,
      withCleanup(() => {
        // Re-render from the already-updated tree after the animation
        buildVisualTree();
        setValue("");
      })
    );
  };
  
  const handleDelete = () => {
    if (!value.trim()) {
      setError("Please enter a value");
      return;
    }
    
    const deleteValue = parseInt(value);
    if (isNaN(deleteValue)) {
      setError("Please enter a valid number");
      return;
    }
    
    if (!tree.search(tree.root, deleteValue)) {
      setError("Value does not exist in the tree");
      return;
    }
    
    const trace = [];
    tree.root = tree.deleteNode(tree.root, deleteValue, trace);

    const steps = buildDeleteSteps(trace, deleteValue, {
      setActiveNodeValue,
      setHighlightedNodes,
      setRemovingNodeValue,
    });

    setPseudocodeKey("delete");
    // Run the animation
    startRun(
      steps,
      withCleanup(() => {
        // Re-render from the already-updated tree after the animation
        buildVisualTree();
        setRemovingNodeValue(null);
        setValue("");
      })
    );
  };
  
  const handleSearch = () => {
    if (!value.trim()) {
      setError("Please enter a value");
      return;
    }
    
    const searchValue = parseInt(value);
    if (isNaN(searchValue)) {
      setError("Please enter a valid number");
      return;
    }
    
    const steps = buildSearchSteps(tree.root, searchValue, {
      setActiveNodeValue,
      setHighlightedNodes,
      setRemovingNodeValue,
    });

    setPseudocodeKey("search");
    // Run the animation
    startRun(
      steps,
      withCleanup(() => {
        setValue("");
      })
    );
  };
  
  const handleTraversal = (type) => {
    setTraversalType(type);

    const steps = buildTraversalSteps(tree.root, type, {
      setActiveNodeValue,
      setHighlightedNodes,
      setTraversalResult,
    });

    setPseudocodeKey(`traversal-${type}`);
    // Show traversal animation panel
    setShowTraversalAnimation(true);

    // Run the animation
    startRun(
      steps,
      withCleanup(() => {
        setShowTraversalAnimation(false);
      })
    );
  };
  
  // Calculate tree properties
  const treeProperties = [
    { name: "Node Count", value: tree.nodeCount },
    { name: "Height", value: tree.getHeight(tree.root) },
    { name: "Balanced", value: tree.isBalanced() ? "Yes" : "No" }
  ];

  // Define operation tabs
  const operationTabs = [
    { id: "insert", label: "Insert" },
    { id: "delete", label: "Delete" },
    { id: "search", label: "Search" }
  ];

  // Get complexity explanation based on active tab
  const getComplexityInfo = () => {
    switch (activeTab) {
      case "insert":
        return {
          operationName: "Insert",
          complexity: "O(log n)",
          explanation: "Insertion requires traversing the tree to find the correct position, then possibly performing rotations to maintain balance."
        };
      case "delete":
        return {
          operationName: "Delete",
          complexity: "O(log n)",
          explanation: "Deletion requires finding the node, removing it according to its children configuration, then rebalancing the tree."
        };
      case "search":
        return {
          operationName: "Search",
          complexity: "O(log n)",
          explanation: "Search traverses the tree based on the value comparison at each node, always eliminating half of the remaining nodes."
        };
      default:
        return {
          operationName: "Operation",
          complexity: "O(log n)",
          explanation: "AVL trees maintain balance, ensuring logarithmic time complexity for operations."
        };
    }
  };

  const complexityInfo = getComplexityInfo();

  // Absolute layout for the coordinate canvas (empty when treeRoot is null)
  const layout = layoutTree(treeRoot);

  const edgeState = (edge) => {
    if (edge.childValue === removingNodeValue) return "tree-edge-removing";
    if (highlightedNodes.includes(edge.childValue)) return "tree-edge-highlighted";
    if (edge.parentValue === activeNodeValue) return "tree-edge-active";
    return "";
  };

  return (
    <div className="visualizer-container" ref={containerRef}>
      <h1>AVL Tree Visualizer</h1>
      
      <div className="visualizer-grid">
        {/* Visualization area */}
        <div className="card visualization-area">
          <h2>Tree Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="tree" values={tree.preOrder(treeRoot)} />

          {view === "story" ? (
            <div className="tree-container">
              {treeRoot ? (
                <div
                  className="tree-canvas"
                  style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
                >
                  <svg
                    className="tree-edges"
                    width={layout.width}
                    height={layout.height}
                    aria-hidden="true"
                  >
                    {layout.edges.map((edge) => (
                      <path
                        key={`${edge.parentValue}-${edge.childValue}`}
                        className={`tree-edge ${edgeState(edge)}`.trim()}
                        d={edgePath(edge)}
                      />
                    ))}
                  </svg>
                  {layout.nodes.map((entry) => (
                    <div
                      key={entry.value}
                      className="tree-node-slot"
                      style={{ left: `${entry.x}px`, top: `${entry.y}px` }}
                    >
                      <ElementNode
                        value={entry.value}
                        index={`h:${entry.height} bf:${entry.balance}`}
                        isActive={entry.value === activeNodeValue}
                        isHighlighted={highlightedNodes.includes(entry.value)}
                        isRemoving={entry.value === removingNodeValue}
                        className="tree-node"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Tree is empty. Insert some values to begin.</div>
              )}
            </div>
          ) : memoryBlocks.length === 0 ? (
            <div className="empty-state">No memory cells yet — insert some values to begin.</div>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`tree:${pseudocodeKey}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={TREE_PSEUDOCODE[pseudocodeKey]}
            />
          )}
          
            {showTraversalAnimation && (
              <div className="traversal-result">
                <h3>{traversalType} Traversal Result</h3>
                <div className="result-container">
                  {traversalResult.map((value, index) => (
                    <span key={index} className="traversal-item">
                      {value}{index < traversalResult.length - 1 ? " → " : ""}
                    </span>
                  ))}
                  {traversalResult.length === 0 && <span className="empty-result">No nodes visited yet</span>}
                </div>
              </div>
            )}

            {view === "story" && <MemoryRepresentation blocks={memoryBlocks} />}
          </div>
        
        {/* Controls area */}
        <div className="card controls-area">
          <h2>Tree Operations</h2>
          
          <ErrorMessage message={error} />
          
          <TabNavigation
            tabs={operationTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={isAnimating}
          />

          <CasePresets
            disabled={isAnimating}
            presets={[
              { label: "Worst case", onClick: () => applyPreset(sortedSequence(8)) },
              { label: "Average case", onClick: () => applyPreset([50, 25, 75, 10, 30, 60, 90]) },
              { label: "Random case", onClick: () => applyPreset(uniqueRandomValues(7)) },
            ]}
          />

          <div className="counterfactual-row">
            <button
              type="button"
              className={`btn traversal-btn${rotations ? " active" : ""}`}
              aria-label="Toggle AVL rotations"
              aria-pressed={rotations}
              onClick={() => setRotations(!rotations)}
              disabled={isAnimating}
            >
              Rotations {rotations ? "On" : "Off"}
            </button>
            {!rotations && (
              <span className="counterfactual-note">
                Rotations disabled — the tree may grow unbalanced
              </span>
            )}
          </div>

          <div className="operation-inputs">
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
            
            <button
              className="btn btn-primary btn-full operation-button"
              onClick={
                activeTab === "insert" 
                  ? handleInsert 
                  : activeTab === "delete" 
                    ? handleDelete 
                    : handleSearch
              }
              disabled={isAnimating}
            >
              {activeTab === "insert" 
                ? "Insert Node" 
                : activeTab === "delete" 
                  ? "Delete Node" 
                  : "Search Node"}
            </button>
          </div>
          
          {/* Traversal section */}
          <div className="traversal-section">
            <h3>Tree Traversals</h3>
            <div className="traversal-buttons">
              <button 
                className={`btn traversal-btn${showTraversalAnimation && traversalType === "preOrder" ? " active" : ""}`}
                onClick={() => handleTraversal("preOrder")}
                disabled={isAnimating || !tree.root}
              >
                Pre-order
              </button>
              <button 
                className={`btn traversal-btn${showTraversalAnimation && traversalType === "inOrder" ? " active" : ""}`}
                onClick={() => handleTraversal("inOrder")}
                disabled={isAnimating || !tree.root}
              >
                In-order
              </button>
              <button 
                className={`btn traversal-btn${showTraversalAnimation && traversalType === "postOrder" ? " active" : ""}`}
                onClick={() => handleTraversal("postOrder")}
                disabled={isAnimating || !tree.root}
              >
                Post-order
              </button>
              <button 
                className={`btn traversal-btn${showTraversalAnimation && traversalType === "levelOrder" ? " active" : ""}`}
                onClick={() => handleTraversal("levelOrder")}
                disabled={isAnimating || !tree.root}
              >
                Level-order
              </button>
            </div>
          </div>
          
          {/* Complexity info */}
          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />
          
          {/* Tree properties */}
          <PropertyDisplay 
            title="Tree Properties"
            properties={treeProperties}
          />
        </div>
      </div>
    </div>
  );
};

export default TreeVisualizer;