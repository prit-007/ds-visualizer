import React, { useState, useRef, useEffect } from "react";
import { buildDijkstraSteps } from "../lib/dijkstraSteps";
import { layoutGraph } from "../lib/graphLayout";
import { DIJKSTRA_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import OperationPlayer from "../components/OperationPlayer";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import ShareButton from "../components/ShareButton";
import RunHistoryPanel from "../components/RunHistoryPanel";
import CasePresets from "../components/CasePresets";
import { readScenario } from "../lib/share";
import { recordRun, listRuns } from "../lib/timeTravel";
import "./GraphAlgo.css";

const DEMO_NODES = [1, 2, 3, 4, 5, 6];
const DEMO_EDGES = [
  [1, 2, 7],
  [1, 3, 9],
  [1, 6, 14],
  [2, 3, 10],
  [2, 4, 15],
  [3, 4, 11],
  [3, 6, 2],
  [4, 5, 6],
  [6, 5, 9],
];

const SMALL_NODES = [1, 2, 3];
const SMALL_EDGES = [
  [1, 2, 4],
  [1, 3, 1],
  [3, 2, 1],
];

const COMPLEXITY = {
  operationName: "Dijkstra's Algorithm",
  complexity: "O((V + E) log V)",
  explanation:
    "Each node is settled once (V extractions) and every edge is relaxed once (E). With a binary heap the smallest-distance selection costs log V, giving O((V + E) log V).",
};

const emptyDistances = (nodes) => Object.fromEntries(nodes.map((n) => [n, Infinity]));

const GraphAlgo = () => {
  const [nodes, setNodes] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "graph-algo" && Array.isArray(scenario.values)) {
      return scenario.values;
    }
    return [...DEMO_NODES];
  });
  const [edges, setEdges] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "graph-algo" && Array.isArray(scenario.edges)) {
      return scenario.edges.map((e) => [...e]);
    }
    return DEMO_EDGES.map((e) => [...e]);
  });
  const [startInput, setStartInput] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "graph-algo" && scenario.start !== undefined) {
      return String(scenario.start);
    }
    return "1";
  });
  const [activeNode, setActiveNode] = useState(null);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [distances, setDistances] = useState(() => emptyDistances(DEMO_NODES));
  const [activeEdge, setActiveEdge] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);

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
    if (runMeta) recordRun({ structure: "graph-algo", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveNode(null);
    setVisitedNodes([]);
    setActiveEdge(null);
  };

  const applyPreset = (presetNodes, presetEdges, start = presetNodes[0]) => {
    setNodes([...presetNodes]);
    setEdges(presetEdges.map((e) => [...e]));
    setDistances(emptyDistances(presetNodes));
    setStartInput(String(start));
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const ui = {
    setActiveNode,
    setVisitedNodes,
    setDistances,
    setActiveEdge,
  };

  const handleRun = () => {
    if (nodes.length === 0) {
      setError("Graph is empty — load a preset first");
      return;
    }
    const start = parseInt(startInput);
    if (isNaN(start)) {
      setError("Please enter a start node");
      return;
    }
    if (!nodes.includes(start)) {
      setError(`Start node ${start} is not in the graph`);
      return;
    }
    const steps = buildDijkstraSteps(nodes, edges, start, ui);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      {
        before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
        after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
        label: `Dijkstra from ${start}`,
      }
    );
  };

  const handleReset = () => applyPreset(DEMO_NODES, DEMO_EDGES, 1);
  const handleClear = () => applyPreset([], [], "");

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "graph-algo" && runEntry.before) {
      applyPreset(runEntry.before.nodes, runEntry.before.edges);
    }
  };

  const edgePairs = edges.map(([u, v]) => [u, v]);
  const layout = layoutGraph(nodes, edgePairs);
  const weightOf = (a, b) => {
    const found = edges.find(
      ([u, v]) => (u === a && v === b) || (u === b && v === a)
    );
    return found ? found[2] : null;
  };

  const isEdgeActive = (e) =>
    activeEdge !== null &&
    ((activeEdge[0] === e.fromValue && activeEdge[1] === e.toValue) ||
      (activeEdge[0] === e.toValue && activeEdge[1] === e.fromValue));

  const orderedNodes = [...nodes].sort((a, b) => a - b);

  return (
    <div className="graph-algo-page" ref={containerRef}>
      <h1>Dijkstra Shortest Path Visualizer</h1>
      <p className="page-tagline">Dijkstra's shortest path on a weighted graph, edge by edge.</p>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Weighted Graph</h2>

          <ShareButton
            structure="graph-algo"
            values={nodes}
            extra={{ edges, start: parseInt(startInput) || null }}
          />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
            <button type="button" className="data-action-btn danger" onClick={handleClear} disabled={isAnimating}>
              Clear
            </button>
          </div>

          {nodes.length === 0 ? (
            <div className="graph-algo-canvas">
              <p className="empty-state">Graph is empty — load a preset to get started.</p>
            </div>
          ) : (
            <div
              className="graph-algo-canvas"
              style={{ width: layout.width, height: layout.height }}
            >
              <svg
                className="graph-algo-edges-svg"
                width={layout.width}
                height={layout.height}
                aria-hidden="true"
              >
                {layout.edges.map((e, i) => (
                  <g key={`${e.fromValue}-${e.toValue}-${i}`}>
                    <line
                      className={`graph-algo-edge${isEdgeActive(e) ? " active" : ""}`}
                      x1={e.x1}
                      y1={e.y1}
                      x2={e.x2}
                      y2={e.y2}
                    />
                    <text
                      className="graph-algo-weight"
                      x={(e.x1 + e.x2) / 2}
                      y={(e.y1 + e.y2) / 2}
                      textAnchor="middle"
                    >
                      {weightOf(e.fromValue, e.toValue)}
                    </text>
                  </g>
                ))}
              </svg>
              {layout.nodes.map((n) => (
                <div
                  key={n.value}
                  className="graph-algo-node-slot"
                  style={{ left: `${n.x}px`, top: `${n.y}px` }}
                >
                  <div
                    className={`graph-algo-node${activeNode === n.value ? " active" : ""}${
                      visitedNodes.includes(n.value) && activeNode !== n.value ? " visited" : ""
                    }`}
                  >
                    {n.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation("graph-algo:dijkstra");
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={DIJKSTRA_PSEUDOCODE}
            />
          )}

          <div className="info-panel dist-panel">
            <h3>Distance table</h3>
            <table className="dist-table">
              <thead>
                <tr>
                  <th>Node</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {orderedNodes.map((n) => (
                  <tr key={n} data-node={n}>
                    <td>{n}</td>
                    <td className={visitedNodes.includes(n) ? "dist-settled" : ""}>
                      {distances[n] === Infinity || distances[n] === undefined
                        ? "∞"
                        : distances[n]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="controls-area">
          <h2>Graph Algorithms</h2>

          <ErrorMessage message={error} />

          <CasePresets
            disabled={isAnimating}
            presets={[
              { label: "Demo graph", onClick: () => applyPreset(DEMO_NODES, DEMO_EDGES, 1) },
              { label: "Small graph", onClick: () => applyPreset(SMALL_NODES, SMALL_EDGES, 1) },
              {
                label: "Disconnected",
                onClick: () => applyPreset([...DEMO_NODES, 9], DEMO_EDGES, 1),
              },
            ]}
          />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            <div className="input-group">
              <label>Start node:</label>
              <input
                type="number"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                placeholder="Start node"
                disabled={isAnimating}
              />
            </div>
            <button type="submit" className="operation-button" disabled={isAnimating}>
              Run Dijkstra
            </button>
          </form>

          <ComplexityInfo
            operationName={COMPLEXITY.operationName}
            complexity={COMPLEXITY.complexity}
            explanation={COMPLEXITY.explanation}
          />

          <PropertyDisplay
            title="Graph Properties"
            properties={[
              { name: "Nodes", value: nodes.length },
              { name: "Edges", value: edges.length },
              {
                name: "Settled",
                value: `${visitedNodes.length} / ${nodes.length}`,
              },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("graph-algo")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default GraphAlgo;
