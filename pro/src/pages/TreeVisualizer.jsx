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
import { BTree } from "../lib/btree";
import { layoutBTree } from "../lib/btreeLayout";
import { buildBTreeInsertSteps, buildBTreeSearchSteps, buildBTreeInOrderSteps } from "../lib/btreeSteps";
import { B_TREE_PSEUDOCODE } from "../lib/pseudocode";

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
  const [structure, setStructure] = useState(() => {
    const scenario = readScenario();
    return scenario && scenario.treeType === "btree" ? "btree" : "binary";
  });
  const [btree] = useState(() => {
    const instance = new BTree();
    const scenario = readScenario();
    if (scenario && scenario.treeType === "btree" && Array.isArray(scenario.values)) {
      scenario.values.forEach((v) => instance.insert(v));
    }
    return instance;
  });
  const [btreeTick, setBtreeTick] = useState(0);
  const [btreeInput, setBtreeInput] = useState("");
  const [btreeActiveKeys, setBTreeActiveKeys] = useState(null);
  const [btreeHighlightedKeys, setBTreeHighlightedKeys] = useState(null);
  const [algo, setAlgo] = useState("bfs");
  const [lcaA, setLcaA] = useState("");
  const [lcaB, setLcaB] = useState("");
  const [view, setView] = useState("story");
  const isBTree = structure === "btree";
  
  // Refs
  const containerRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const [wrapWidth, setWrapWidth] = useState(960);
  const [viewportH, setViewportH] = useState(900);
  
  // Measure the canvas wrapper so wide trees scale down instead of
  // forcing horizontal scroll. ResizeObserver when available; window
  // resize fallback (jsdom has neither measurement nor observer).
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return undefined;
    const update = () => {
      setWrapWidth(el.clientWidth || 960);
      setViewportH(window.innerHeight || 900);
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
  if (isBTree) {
    const collectB = (node) => {
      if (!node) return;
      memoryBlocks.push({
        address: addressOf(node),
        value: node.keys.join("/"),
        pointers: [],
      });
      node.children.forEach(collectB);
    };
    collectB(btree.root);
  } else {
    collectMemoryBlocks(tree.root);
  }

  const BTREE_DEMO = [8, 3, 10, 1, 6, 14, 4, 7, 13];

  const rebuildBTree = (values) => {
    btree.root = new BTree().root;
    btree.size = 0;
    values.forEach((v) => btree.insert(v));
    setBtreeTick((t) => t + 1);
  };

  const clearBTreeHighlights = () => {
    setBTreeActiveKeys(null);
    setBTreeHighlightedKeys(null);
  };

  const btreeUi = {
    setActiveNodeKeys: setBTreeActiveKeys,
    setHighlightedNodeKeys: setBTreeHighlightedKeys,
  };

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
  
  const handleBTreeInsert = () => {
    if (!btreeInput.trim()) {
      setError("Please enter a key");
      return;
    }
    const v = parseInt(btreeInput);
    if (isNaN(v)) {
      setError("Please enter a valid integer key");
      return;
    }
    const trace = [];
    btree.insert(v, trace);
    const steps = buildBTreeInsertSteps(btree.root, v, trace, btreeUi);
    const before = btree.inOrder();
    setPseudocodeKey("btree-insert");
    startRun(
      steps,
      withCleanup(() => {
        setBtreeTick((t) => t + 1);
        setBtreeInput("");
        clearBTreeHighlights();
      }),
      {
        before: trace.some((e) => e.type === "duplicate") ? before : before.filter((k) => k !== v),
        after: btree.inOrder(),
        label: `B-tree insert ${v}`,
        meta: { treeType: "btree" },
      }
    );
  };

  const handleBTreeSearch = () => {
    if (!btreeInput.trim()) {
      setError("Please enter a key");
      return;
    }
    const v = parseInt(btreeInput);
    if (isNaN(v)) {
      setError("Please enter a valid integer key");
      return;
    }
    const trace = [];
    btree.search(v, trace);
    const steps = buildBTreeSearchSteps(btree.root, v, trace, btreeUi);
    setPseudocodeKey("btree-search");
    startRun(
      steps,
      withCleanup(() => {
        setBtreeInput("");
        clearBTreeHighlights();
      }),
      {
        before: btree.inOrder(),
        after: btree.inOrder(),
        label: `B-tree search ${v}`,
        meta: { treeType: "btree" },
      }
    );
  };

  const handleBTreeInOrder = () => {
    const steps = buildBTreeInOrderSteps(btree.root, btreeUi);
    setPseudocodeKey("btree-inorder");
    setTraversalType("inOrder");
    setShowTraversalAnimation(true);
    const order = btree.inOrder();
    setTraversalResult(order);
    startRun(
      steps,
      withCleanup(() => {
        setShowTraversalAnimation(false);
        clearBTreeHighlights();
      }),
      {
        before: order,
        after: order,
        label: "B-tree in-order",
        meta: { treeType: "btree" },
      }
    );
  };

  const handleRunAlgo = () => {
    if (isBTree) {
      if (algo === "inorder") handleBTreeInOrder();
      return;
    }
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

  const handleReset = () => {
    if (isBTree) {
      rebuildBTree(BTREE_DEMO);
      clearBTreeHighlights();
      setError(null);
      setRun(null);
      setBtreeInput("");
      return;
    }
    applyPreset([50, 25, 75, 10, 30, 60, 90]);
  };

  const handleClear = () => {
    if (isBTree) {
      rebuildBTree([]);
      clearBTreeHighlights();
      setError(null);
      setRun(null);
      setBtreeInput("");
      return;
    }
    applyPreset([]);
  };

  const handleForkRun = (run) => {
    if (run.structure !== "tree") return;
    if (run.meta?.treeType === "btree") {
      setStructure("btree");
      rebuildBTree([...run.before]);
      clearBTreeHighlights();
      setError(null);
      setRun(null);
      setBtreeInput("");
      return;
    }
    applyPreset([...run.before]);
  };
  
  // Calculate tree properties
  const treeProperties = isBTree
    ? [
        { name: "Order", value: 3 },
        { name: "Keys", value: btree.size },
        { name: "Height", value: btree.height() },
      ]
    : [
        { name: "Node Count", value: tree.nodeCount },
        { name: "Height", value: tree.getHeight(tree.root) },
        { name: "Balanced", value: tree.isBalanced() ? "Yes" : "No" },
      ];

  // Define operation tabs
  const operationTabs = isBTree
    ? [
        { id: "insertKey", label: "Insert" },
        { id: "searchKey", label: "Search" },
      ]
    : [
        { id: "insert", label: "Insert" },
        { id: "delete", label: "Delete" },
        { id: "search", label: "Search" },
      ];

  // Get complexity explanation based on active tab
  const getComplexityInfo = () => {
    if (isBTree) {
      return {
        operationName: activeTab === "insertKey" ? "B-tree Insert" : "B-tree Search",
        complexity: "O(log n)",
        explanation:
          "Order-3 B-trees keep every node at most half full (except the root), so insert/search descend at most log₃(n) levels; leaf splits promote a median upward.",
      };
    }
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
  const layout = isBTree ? layoutBTree(btree.root) : layoutTree(treeRoot);
  // Fit the whole tree into the visible width AND height — scale down when
  // needed so the canvas never forces scrolling on any device.
  const widthFit = (wrapWidth - 8) / Math.max(layout.width, 1);
  const heightFit = (Math.max(220, viewportH - 300) - 16) / Math.max(layout.height, 1);
  // Floor the scale so nodes stay readable; the wrap scrolls if a very
  // wide tree still overflows after the floor.
  const fitScale = Math.max(0.45, Math.min(1, widthFit, heightFit));

  const edgeState = (edge) => {
    if (edge.childValue === removingNodeValue) return "tree-edge-removing";
    if (highlightedNodes.includes(edge.childValue)) return "tree-edge-highlighted";
    if (edge.parentValue === activeNodeValue) return "tree-edge-active";
    return "";
  };

  return (
    <div className="visualizer-container" ref={containerRef}>
      <h1>{isBTree ? "B-Tree Visualizer" : "AVL Tree Visualizer"}</h1>
      
      <div className="visualizer-grid">
        {/* Visualization area */}
        <div className="card visualization-area">
          <h2>Tree Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton
            structure="tree"
            values={isBTree ? btree.inOrder() : tree.preOrder(treeRoot)}
            extra={{ treeType: structure }}
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
            <div className="tree-container">
              {layout.nodes.length > 0 ? (
                <div
                  key={isBTree ? `btree-${btreeTick}` : "binary-canvas"}
                  className="tree-canvas-wrap"
                  style={{ height: `${Math.max(layout.height * fitScale, 240)}px` }}
                >
                <div
                  className="tree-canvas"
                  style={{
                    width: `${layout.width}px`,
                    height: `${layout.height}px`,
                    transform: `scale(${fitScale})`,
                    transformOrigin: 'top center',
                  }}
                >
                  {isBTree ? (
                    <>
                      <svg
                        className="tree-edges"
                        width={layout.width}
                        height={layout.height}
                        aria-hidden="true"
                      >
                        {layout.edges.map((edge, i) => (
                          <line
                            key={`e-${i}-${edge.fromKeys.join()}-${edge.toKeys.join()}`}
                            className="tree-edge"
                            x1={edge.x1}
                            y1={edge.y1}
                            x2={edge.x2}
                            y2={edge.y2}
                          />
                        ))}
                      </svg>
                      {layout.nodes.map((entry) => {
                        const sameAs = (target) =>
                          target &&
                          entry.keys.length === target.length &&
                          entry.keys.every((k, i) => k === target[i]);
                        const active = sameAs(btreeActiveKeys);
                        const highlighted = !active && sameAs(btreeHighlightedKeys);
                        return (
                          <div
                            key={`b-${entry.keys.join("-")}-${entry.depth}-${entry.x}`}
                            className={`btree-node${active ? " active" : ""}${highlighted ? " highlighted" : ""}`}
                            style={{ left: `${entry.x}px`, top: `${entry.y}px` }}
                          >
                            {entry.keys.map((k, ki) => (
                              <span key={`${k}-${ki}`} className="btree-key">
                                {k}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
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
                            index={entry.balance !== 0 ? `bf:${entry.balance}` : ""}
                            showIndex={entry.balance !== 0}
                            isActive={entry.value === activeNodeValue}
                            isHighlighted={highlightedNodes.includes(entry.value)}
                            isRemoving={entry.value === removingNodeValue}
                            className="tree-node"
                          />
                        </div>
                      ))}
                    </>
                  )}
                </div>
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
                pseudocodeKey === "btree-insert"
                  ? B_TREE_PSEUDOCODE.insert
                  : pseudocodeKey === "btree-search"
                    ? B_TREE_PSEUDOCODE.search
                    : pseudocodeKey === "btree-inorder"
                      ? B_TREE_PSEUDOCODE.inOrder
                      : pseudocodeKey === "bfs" ||
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

          <div className="tree-mode-row">
            <div className="algo-toggle" role="group" aria-label="Tree structure">
              <button
                type="button"
                aria-pressed={!isBTree}
                disabled={isAnimating}
                onClick={() => {
                  setStructure("binary");
                  setActiveTab("insert");
                  clearBTreeHighlights();
                  setError(null);
                  setRun(null);
                  setBtreeInput("");
                }}
              >
                Binary
              </button>
              <button
                type="button"
                aria-pressed={isBTree}
                disabled={isAnimating}
                onClick={() => {
                  setStructure("btree");
                  setActiveTab("insertKey");
                  setAlgo("inorder");
                  setHighlightedNodes([]);
                  setActiveNodeValue(null);
                  setError(null);
                  setRun(null);
                  setValue("");
                }}
              >
                B-Tree
              </button>
            </div>
            {!isBTree && (
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
            )}
          </div>
          {!isBTree && !rotations && (
            <span className="counterfactual-note">
              Rotations disabled — the tree may grow unbalanced
            </span>
          )}

          <TabNavigation
            tabs={operationTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={isAnimating}
          />

          {!isBTree && (
            <CasePresets
              disabled={isAnimating}
              presets={[
                { label: "Worst case", onClick: () => applyPreset(sortedSequence(8)) },
                { label: "Average case", onClick: () => applyPreset([50, 25, 75, 10, 30, 60, 90]) },
                { label: "Random case", onClick: () => applyPreset(uniqueRandomValues(7)) },
              ]}
            />
          )}

          <form className="operation-inputs" onSubmit={(e) => {
            e.preventDefault();
            if (isBTree) {
              if (activeTab === "insertKey") handleBTreeInsert();
              else handleBTreeSearch();
              return;
            }
            if (activeTab === "insert") handleInsert();
            else if (activeTab === "delete") handleDelete();
            else handleSearch();
          }}>
            <div className="input-group">
              <label>{isBTree ? "Key:" : "Value:"}</label>
              <input
                type="number"
                value={isBTree ? btreeInput : value}
                onChange={(e) =>
                  isBTree ? setBtreeInput(e.target.value) : setValue(e.target.value)
                }
                placeholder="Enter a number"
                disabled={isAnimating}
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-full operation-button"
              disabled={isAnimating}
            >
              {isBTree
                ? activeTab === "insertKey"
                  ? "Insert Key"
                  : "Search Key"
                : activeTab === "insert"
                  ? "Insert Node"
                  : activeTab === "delete"
                    ? "Delete Node"
                    : "Search Node"}
            </button>
          </form>
          
          {/* Traversals + algorithms, unified */}
          <div className="algo-panel">
            <h3>Traversals &amp; Algorithms</h3>
            <p className="algo-group-label">Traversals</p>
            <div className="algo-toggle" role="group" aria-label="Traversals">
              {["bfs", "dfs", "inorder", "postorder"].map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={algo === a}
                  disabled={isAnimating || (isBTree ? btree.size === 0 : !tree.root) || (isBTree && a !== "inorder")}
                  title={isBTree && a !== "inorder" ? "Binary trees only" : undefined}
                  onClick={() => setAlgo(a)}
                >
                  {a === "bfs" ? "BFS" : a === "dfs" ? "DFS" : a === "inorder" ? "In-order" : "Post-order"}
                </button>
              ))}
            </div>
            {!isBTree && (
              <>
                <p className="algo-group-label">Algorithms</p>
                <div className="algo-toggle" role="group" aria-label="Algorithms">
                  {["validate", "mirror", "lca"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={algo === a}
                      disabled={isAnimating || !tree.root}
                      onClick={() => setAlgo(a)}
                    >
                      {a === "validate" ? "Validate BST" : a === "mirror" ? "Mirror" : "LCA"}
                    </button>
                  ))}
                </div>
              </>
            )}
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
                  disabled={isAnimating || (isBTree ? btree.size === 0 : !tree.root)}
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
                disabled={isAnimating || (isBTree ? btree.size === 0 : !tree.root)}
              >
                {isBTree
                  ? "Run In-order"
                  : algo === "bfs"
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