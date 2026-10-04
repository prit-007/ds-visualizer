import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  buildAddNodeSteps,
  buildAddEdgeSteps,
  buildBFSSteps,
  buildDFSSteps,
} from "../lib/graphSteps";
import { layoutGraph } from "../lib/graphLayout";
import { GRAPH_PSEUDOCODE } from "../lib/pseudocode";
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
import { uniqueRandomValues } from "../lib/presets";
import "./Graph.css";

const TABS = [
  { id: "addNode", label: "Add Node" },
  { id: "addEdge", label: "Add Edge" },
  { id: "bfs", label: "BFS" },
  { id: "dfs", label: "DFS" },
];

const DEMO_NODES = [1, 2, 3, 4];
const DEMO_EDGES = [
  [1, 2],
  [1, 3],
  [2, 4],
];

const COMPLEXITY = {
  addNode: {
    operationName: "Add Node",
    complexity: "O(1)",
    explanation:
      "Appending a node to the graph's node list is constant time — the canvas simply places one more circle.",
  },
  addEdge: {
    operationName: "Add Edge",
    complexity: "O(V)",
    explanation:
      "Both endpoints must exist, so their presence is checked by scanning the node list; appending the edge pair itself is O(1).",
  },
  bfs: {
    operationName: "Breadth-First Search",
    complexity: "O(V + E)",
    explanation:
      "BFS visits every node and examines every edge once, using a queue to explore neighbors level by level.",
  },
  dfs: {
    operationName: "Depth-First Search",
    complexity: "O(V + E)",
    explanation:
      "DFS visits every node and examines every edge once, descending along one path before backtracking.",
  },
};

const copyState = (nodes, edges) => ({
  nodes: [...nodes],
  edges: edges.map((e) => [...e]),
});

const uniqueEdges = (edges) => {
  const seen = new Set();
  const out = [];
  edges.forEach(([a, b]) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push([a, b]);
    }
  });
  return out;
};

const randomGraph = () => {
  const vals = uniqueRandomValues(6);
  const edges = [];
  for (let i = 0; i < vals.length; i += 1) {
    edges.push([vals[i], vals[(i + 1) % vals.length]]);
    if (vals.length > 3) {
      edges.push([vals[i], vals[(i + 2) % vals.length]]);
    }
  }
  return { nodes: vals, edges: uniqueEdges(edges) };
};

const Graph = ({ initialNodes, initialEdges }) => {
  const [nodes, setNodes] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "graph" && Array.isArray(scenario.values)) {
      return scenario.values;
    }
    return initialNodes ?? [...DEMO_NODES];
  });
  const [edges, setEdges] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "graph" && Array.isArray(scenario.values)) {
      return Array.isArray(scenario.edges) ? scenario.edges.map((e) => [...e]) : [];
    }
    return (initialEdges ?? (initialNodes === undefined ? DEMO_EDGES : [])).map((e) => [...e]);
  });
  const [nodeInput, setNodeInput] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [startInput, setStartInput] = useState("");
  const [activeTab, setActiveTab] = useState("addNode");
  const [activeValue, setActiveValue] = useState(null);
  const [highlightedEdge, setHighlightedEdge] = useState(null);
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

  const layout = layoutGraph(nodes, edges);

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "graph", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveValue(null);
    setHighlightedEdge(null);
  };

  const applyPreset = (preset) => {
    setNodes([...preset.nodes]);
    setEdges(preset.edges.map((e) => [...e]));
    clearHighlights();
    setError(null);
    setRun(null);
    setNodeInput("");
    setFromInput("");
    setToInput("");
    setStartInput("");
  };

  const ui = { setActiveValue, setHighlightedEdge };

  const parseIntField = (raw, emptyMessage) => {
    if (!raw.trim()) {
      setError(emptyMessage);
      return null;
    }
    const v = parseInt(raw);
    if (isNaN(v)) {
      setError("Please enter a valid integer");
      return null;
    }
    return v;
  };

  const handleAddNode = () => {
    const value = parseIntField(nodeInput, "Please enter a value");
    if (value === null) return;
    if (nodes.includes(value)) {
      setError(`Node ${value} already exists`);
      return;
    }

    const steps = buildAddNodeSteps(nodes, value, ui);
    const nextNodes = [...nodes, value];
    startRun(
      steps,
      () => {
        setNodes(nextNodes);
        setNodeInput("");
        clearHighlights();
      },
      {
        before: copyState(nodes, edges),
        after: copyState(nextNodes, edges),
        label: `Add node ${value}`,
      }
    );
  };

  const handleAddEdge = () => {
    if (!fromInput.trim() || !toInput.trim()) {
      setError("Please enter both a from and to node");
      return;
    }
    const from = parseInt(fromInput);
    const to = parseInt(toInput);
    if (isNaN(from) || isNaN(to)) {
      setError("Please enter valid integers");
      return;
    }
    if (!nodes.includes(from)) {
      setError(`Node ${from} does not exist`);
      return;
    }
    if (!nodes.includes(to)) {
      setError(`Node ${to} does not exist`);
      return;
    }
    if (from === to) {
      setError("Self-loops are not allowed");
      return;
    }
    const duplicate = edges.some(
      ([a, b]) => (a === from && b === to) || (a === to && b === from)
    );
    if (duplicate) {
      setError(`Edge ${from} — ${to} already exists`);
      return;
    }

    const steps = buildAddEdgeSteps(nodes, edges, from, to, ui);
    const nextEdges = [...edges, [from, to]];
    startRun(
      steps,
      () => {
        setEdges(nextEdges);
        setFromInput("");
        setToInput("");
        clearHighlights();
      },
      {
        before: copyState(nodes, edges),
        after: copyState(nodes, nextEdges),
        label: `Add edge ${from} — ${to}`,
      }
    );
  };

  const handleTraversal = (kind) => {
    const start = parseIntField(startInput, "Please enter a start node");
    if (start === null) return;
    if (nodes.length === 0) {
      setError("Graph needs at least one node");
      return;
    }
    if (!nodes.includes(start)) {
      setError(`Start node ${start} does not exist`);
      return;
    }

    const steps =
      kind === "bfs"
        ? buildBFSSteps(nodes, edges, start, ui)
        : buildDFSSteps(nodes, edges, start, ui);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: copyState(nodes, edges),
        after: copyState(nodes, edges),
        label: `${kind.toUpperCase()} from ${start}`,
      }
    );
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "graph" && runEntry.before) {
      applyPreset({
        nodes: [...runEntry.before.nodes],
        edges: runEntry.before.edges.map((e) => [...e]),
      });
    }
  };

  const memoryBlocks = nodes.map((value, index) => ({
    address: `0x${(index * 4 + 100).toString(16).toUpperCase()}`,
    value,
    isActive: activeValue === value,
    isShifting: false,
  }));

  const isEdgeActive = (e) =>
    highlightedEdge !== null &&
    ((highlightedEdge[0] === e.fromValue && highlightedEdge[1] === e.toValue) ||
      (highlightedEdge[0] === e.toValue && highlightedEdge[1] === e.fromValue));

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.addNode;

  return (
    <div className="graph-page" ref={containerRef}>
      <h1>Interactive Graph Visualizer</h1>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Graph Visualization</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="graph" values={nodes} extra={{ edges }} />

          {view === "story" ? (
            nodes.length === 0 ? (
              <div className="graph-canvas">
                <p className="empty-state">
                  Graph is empty — add a node to get started.
                </p>
              </div>
            ) : (
              <div
                className="graph-canvas"
                style={{ width: layout.width, height: layout.height }}
              >
                <svg
                  className="graph-edges-svg"
                  width={layout.width}
                  height={layout.height}
                  aria-hidden="true"
                >
                  {layout.edges.map((e, i) => (
                    <line
                      key={`${e.fromValue}-${e.toValue}-${i}`}
                      className={`graph-edge${isEdgeActive(e) ? " active" : ""}`}
                      x1={e.x1}
                      y1={e.y1}
                      x2={e.x2}
                      y2={e.y2}
                    />
                  ))}
                </svg>
                <AnimatePresence mode="popLayout">
                  {layout.nodes.map((n) => (
                    <div
                      key={n.value}
                      className="graph-node-slot"
                      style={{ left: `${n.x}px`, top: `${n.y}px` }}
                    >
                      <ElementNode
                        value={n.value}
                        isActive={activeValue === n.value}
                        showIndex={false}
                        className="graph-node"
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : nodes.length === 0 ? (
            <p className="empty-state">No memory cells yet — add a node to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`graph:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={GRAPH_PSEUDOCODE[activeTab]}
            />
          )}

          {view === "story" && nodes.length > 0 && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>Graph Operations</h2>

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
              {
                label: "Worst case",
                onClick: () =>
                  applyPreset({
                    nodes: Array.from({ length: 10 }, (_, i) => i + 1),
                    edges: Array.from({ length: 9 }, (_, i) => [i + 1, i + 2]),
                  }),
              },
              {
                label: "Average case",
                onClick: () =>
                  applyPreset({ nodes: [...DEMO_NODES], edges: DEMO_EDGES.map((e) => [...e]) }),
              },
              { label: "Random case", onClick: () => applyPreset(randomGraph()) },
            ]}
          />

          <div className="operation-inputs">
            {activeTab === "addNode" && (
              <div className="input-group">
                <label>Node value:</label>
                <input
                  type="number"
                  value={nodeInput}
                  onChange={(e) => setNodeInput(e.target.value)}
                  placeholder="Enter a node value"
                  disabled={isAnimating}
                />
              </div>
            )}

            {activeTab === "addEdge" && (
              <>
                <div className="input-group">
                  <label>From:</label>
                  <input
                    type="number"
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    placeholder="From node"
                    disabled={isAnimating}
                  />
                </div>
                <div className="input-group">
                  <label>To:</label>
                  <input
                    type="number"
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    placeholder="To node"
                    disabled={isAnimating}
                  />
                </div>
              </>
            )}

            {(activeTab === "bfs" || activeTab === "dfs") && (
              <div className="input-group">
                <label>Start:</label>
                <input
                  type="number"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  placeholder="Start node"
                  disabled={isAnimating}
                />
              </div>
            )}

            <button
              className="operation-button"
              onClick={
                activeTab === "addNode"
                  ? handleAddNode
                  : activeTab === "addEdge"
                    ? handleAddEdge
                    : () => handleTraversal(activeTab)
              }
              disabled={isAnimating}
            >
              {activeTab === "addNode"
                ? "Place Node"
                : activeTab === "addEdge"
                  ? "Connect Nodes"
                  : activeTab === "bfs"
                    ? "Run BFS"
                    : "Run DFS"}
            </button>
          </div>

          <ComplexityInfo
            operationName={complexityInfo.operationName}
            complexity={complexityInfo.complexity}
            explanation={complexityInfo.explanation}
          />

          <PropertyDisplay
            title="Graph Properties"
            properties={[
              { name: "Nodes", value: nodes.length },
              { name: "Edges", value: edges.length },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel
            runs={listRuns("graph")}
            onFork={handleForkRun}
            disabled={isAnimating}
          />
        </div>
      </div>
    </div>
  );
};

export default Graph;
