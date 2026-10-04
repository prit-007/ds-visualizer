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
import RunHistoryPanel from "../components/RunHistoryPanel";
import { readScenario } from "../lib/share";
import { recordRun, listRuns } from "../lib/timeTravel";
import CasePresets from "../components/CasePresets";
import { sortedSequence, uniqueRandomValues } from "../lib/presets";
import "./TreeVisualizer.css";
import { AVLTree } from "../lib/avl";
import { buildInsertSteps, buildDeleteSteps, buildSearchSteps, buildTraversalSteps } from "../lib/treeSteps";
import { buildValidateBSTSteps, buildMirrorSteps, buildLCASteps, buildBFSSteps, buildDFSTreeSteps } from "../lib/treeAlgoSteps";
import { TREE_PSEUDOCODE, TREE_ALGO_PSEUDOCODE } from "../lib/pseudocode";
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
  const [algo, setAlgo] = useState("bfs");
  const [lcaA, setLcaA] = useState("");
  const [lcaB, setLcaB] = useState("");
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

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "tree", steps, ...runMeta });
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
    
    const beforeValues = tree.preOrder(tree.root);
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
      }),
      {
        before: beforeValues,
        after: tree.preOrder(tree.root),
        label: `Insert ${newValue}`,
        meta: { rotations: tree.rotations },
      }
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
    
    const beforeValues = tree.preOrder(tree.root);
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
      }),
      {
        before: beforeValues,
        after: tree.preOrder(tree.root),
        label: `Delete ${deleteValue}`,
        meta: { rotations: tree.rotations },
      }
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
      }),
      {
        before: tree.preOrder(tree.root),
        after: tree.preOrder(tree.root),
        label: `Search ${searchValue}`,
        meta: { rotations: tree.rotations },
      }
    );
  };
  
  const handleRunAlgo = () => {
    if (!tree.root && algo !== "validate") {
      // validate on an empty tree is trivially valid; others need nodes
      if (algo === "mirror" || algo === "lca" || algo === "bfs" || algo === "dfs" || algo === "inorder" || algo === "postorder") {
        setError("Tree is empty — insert a node first");
        return;
      }
    }

    if (algo === "bfs" || algo === "dfs") {
      const steps =
        algo === "bfs"
          ? buildBFSSteps(tree.root, { setActiveNodeValue, setHighlightedNodes, setTraversalResult })
          : buildDFSTreeSteps(tree.root, { setActiveNodeValue, setHighlightedNodes, setTraversalResult });
      setPseudocodeKey(algo);
      setTraversalType(algo === "bfs" ? "levelOrder" : "preOrder");
      setShowTraversalAnimation(true);
      startRun(
        steps,
        withCleanup(() => {
          setShowTraversalAnimation(false);
        }),
        {
          before: tree.preOrder(tree.root),
          after: tree.preOrder(tree.root),
          label: algo === "bfs" ? "BFS traversal" : "DFS traversal",
          meta: { rotations: tree.rotations, algo },
        }
      );
      return;
    }

    if (algo === "inorder" || algo === "postorder") {
      const type = algo === "inorder" ? "inOrder" : "postOrder";
      setTraversalType(type);
      const steps = buildTraversalSteps(tree.root, type, {
        setActiveNodeValue,
        setHighlightedNodes,
        setTraversalResult,
      });
      setPseudocodeKey(`traversal-${type}`);
      setShowTraversalAnimation(true);
      startRun(
        steps,
        withCleanup(() => {
          setShowTraversalAnimation(false);
        }),
        {
          before: tree.preOrder(tree.root),
          after: tree.preOrder(tree.root),
          label: `${type} traversal`,
          meta: { rotations: tree.rotations, algo },
        }
      );
      return;
    }

    if (algo === "validate") {
      handleValidate();
      return;
    }
    if (algo === "mirror") {
      handleMirror();
      return;
    }
    if (algo === "lca") {
      handleLCA();
      return;
    }
  };

  const algoUi = { setActiveNodeValue, setHighlightedNodes };

  const handleValidate = () => {
    if (!tree.root) {
      setError("Tree is empty — insert a node first");
      return;
    }
    const steps = buildValidateBSTSteps(tree.root, algoUi);
    setPseudocodeKey("validate");
    startRun(
      steps,
      withCleanup(() => {}),
      {
        before: tree.preOrder(tree.root),
        after: tree.preOrder(tree.root),
        label: "Validate BST",
        meta: { rotations: tree.rotations, algo: "validate" },
      }
    );
  };

  const mirrorInPlace = (node) => {
    if (!node) return;
    const t = node.left;
    node.left = node.right;
    node.right = t;
    mirrorInPlace(node.left);
    mirrorInPlace(node.right);
  };

  const mirroredOrder = (node) => {
    if (!node) return [];
    return [node.value, ...mirroredOrder(node.right), ...mirroredOrder(node.left)];
  };

  const handleMirror = () => {
    if (!tree.root) {
      setError("Tree is empty — insert a node first");
      return;
    }
    const steps = buildMirrorSteps(tree.root, algoUi);
    setPseudocodeKey("mirror");
    startRun(
      steps,
      withCleanup(() => {
        mirrorInPlace(tree.root);
        buildVisualTree();
      }),
      {
        before: tree.preOrder(tree.root),
        after: mirroredOrder(tree.root),
        label: "Mirror tree",
        meta: { rotations: tree.rotations, algo: "mirror" },
      }
    );
  };

  const handleLCA = () => {
    const a = parseInt(lcaA);
    const b = parseInt(lcaB);
    if (isNaN(a) || isNaN(b)) {
      setError("Please enter both values for LCA");
      return;
    }
    if (!tree.root) {
      setError("Tree is empty — insert a node first");
      return;
    }
    const steps = buildLCASteps(tree.root, a, b, algoUi);
    setPseudocodeKey("lca");
    startRun(
      steps,
      withCleanup(() => {
        setLcaA("");
        setLcaB("");
      }),
      {
        before: tree.preOrder(tree.root),
        after: tree.preOrder(tree.root),
        label: `LCA ${a}, ${b}`,
        meta: { rotations: tree.rotations, algo: "lca" },
      }
    );
  };

  const handleForkRun = (run) => {
    if (run.structure === "tree") applyPreset([...run.before]);
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
              pseudocode={
                pseudocodeKey === "bfs" ||
                pseudocodeKey === "dfs" ||
                pseudocodeKey === "validate" ||
                pseudocodeKey === "mirror" ||
                pseudocodeKey === "lca"
                  ? TREE_ALGO_PSEUDOCODE[pseudocodeKey]
                  : TREE_PSEUDOCODE[pseudocodeKey]
              }
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

          <form className="operation-inputs" onSubmit={(e) => {
            e.preventDefault();
            if (activeTab === "insert") handleInsert();
            else if (activeTab === "delete") handleDelete();
            else handleSearch();
          }}>
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
              type="submit"
              className="btn btn-primary btn-full operation-button"
              disabled={isAnimating}
            >
              {activeTab === "insert" 
                ? "Insert Node" 
                : activeTab === "delete" 
                  ? "Delete Node" 
                  : "Search Node"}
            </button>
          </form>
          
          {/* Traversals + algorithms, unified */}
          <div className="algo-panel">
            <h3>Traversals &amp; Algorithms</h3>
            <div className="algo-toggle" role="group" aria-label="Algorithm">
              {["bfs", "dfs", "inorder", "postorder", "validate", "mirror", "lca"].map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={algo === a}
                  disabled={isAnimating || !tree.root}
                  onClick={() => setAlgo(a)}
                >
                  {a === "bfs"
                    ? "BFS"
                    : a === "dfs"
                      ? "DFS"
                      : a === "inorder"
                        ? "In-order"
                        : a === "postorder"
                          ? "Post-order"
                          : a === "validate"
                            ? "Validate BST"
                            : a === "mirror"
                              ? "Mirror"
                              : "LCA"}
                </button>
              ))}
            </div>
            {algo === "lca" && (
              <form
                className="algo-inputs"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunAlgo();
                }}
              >
                <div className="input-group">
                  <label>Value A:</label>
                  <input
                    type="number"
                    value={lcaA}
                    onChange={(e) => setLcaA(e.target.value)}
                    placeholder="Enter value A"
                    disabled={isAnimating}
                  />
                </div>
                <div className="input-group">
                  <label>Value B:</label>
                  <input
                    type="number"
                    value={lcaB}
                    onChange={(e) => setLcaB(e.target.value)}
                    placeholder="Enter value B"
                    disabled={isAnimating}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full operation-button algo-run"
                  disabled={isAnimating || !tree.root}
                >
                  Find LCA
                </button>
              </form>
            )}
            {algo !== "lca" && (
              <button
                type="button"
                className="btn btn-primary btn-full operation-button algo-run"
                onClick={handleRunAlgo}
                disabled={isAnimating || !tree.root}
              >
                {algo === "bfs"
                  ? "Run BFS"
                  : algo === "dfs"
                    ? "Run DFS"
                    : algo === "inorder"
                      ? "Run In-order"
                      : algo === "postorder"
                        ? "Run Post-order"
                        : algo === "validate"
                          ? "Run Validation"
                          : "Mirror Tree"}
              </button>
            )}
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

          {/* Run history: fork rewinds to a run's before state */}
          <div className="info-panel">
            <h3>Run history</h3>
            <RunHistoryPanel
              runs={listRuns("tree")}
              onFork={handleForkRun}
              disabled={isAnimating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeVisualizer;