import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import { buildDijkstraSteps } from "../lib/dijkstraSteps";
import { buildTopoSteps } from "../lib/topoSteps";
import { buildBellmanFordSteps } from "../lib/bellmanFordSteps";
import { buildPrimSteps, buildKruskalSteps } from "../lib/mstSteps";
import { buildFloydWarshallSteps } from "../lib/floydWarshallSteps";
import { buildAstarSteps } from "../lib/astarSteps";
import { buildKosarajuSteps } from "../lib/kosarajuSteps";
import { buildCycleSteps } from "../lib/cycleSteps";
import { layoutGraph } from "../lib/graphLayout";
import {
  DIJKSTRA_PSEUDOCODE,
  TOPO_PSEUDOCODE,
  BELLMAN_FORD_PSEUDOCODE,
  MST_PSEUDOCODE,
  FLOYD_PSEUDOCODE,
  ASTAR_PSEUDOCODE,
  KOSARAJU_PSEUDOCODE,
  CYCLE_PSEUDOCODE,
} from "../lib/pseudocode";
import AlgoOverview from "../components/AlgoOverview";
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

// Directed DAGs for topological sort (edges carry a dummy weight slot).
const COURSE_NODES = [1, 2, 3, 4, 5];
const COURSE_EDGES = [
  [1, 2, 0],
  [1, 3, 0],
  [2, 4, 0],
  [3, 4, 0],
  [4, 5, 0],
];

const SMALL_DAG_NODES = [1, 2, 3, 4];
const SMALL_DAG_EDGES = [
  [1, 2, 0],
  [1, 3, 0],
  [2, 3, 0],
  [3, 4, 0],
];

const CYCLIC_NODES = [1, 2];
const CYCLIC_EDGES = [
  [1, 2, 0],
  [2, 1, 0],
];

// Kosaraju: two directed SCCs ({1,2,3} and {4,5,6}) joined by one edge.
const SCC_NODES = [1, 2, 3, 4, 5, 6];
const SCC_EDGES = [
  [1, 2, 0],
  [2, 3, 0],
  [3, 1, 0],
  [3, 4, 0],
  [4, 5, 0],
  [5, 6, 0],
  [6, 4, 0],
];

// Bellman-Ford: negative weights are welcome, negative cycles are caught.
const BF_NODES = [1, 2, 3, 4];
const BF_EDGES = [
  [1, 2, 4],
  [1, 3, 5],
  [2, 3, -2],
  [2, 4, 7],
  [3, 4, 1],
];

const BF_NEG_NODES = [1, 2];
const BF_NEG_EDGES = [[1, 2, -1]];

const BF_CYCLE_NODES = [1, 2, 3];
const BF_CYCLE_EDGES = [
  [1, 2, -8],
  [2, 3, 1],
  [3, 1, 1],
];

// MST presets (non-negative weights).
const MST_NODES = [1, 2, 3, 4, 5];
const MST_EDGES = [
  [1, 2, 4],
  [1, 3, 3],
  [2, 4, 2],
  [3, 4, 5],
  [3, 5, 1],
  [4, 5, 6],
];

const MST_DENSE_NODES = [1, 2, 3, 4];
const MST_DENSE_EDGES = [
  [1, 2, 1],
  [1, 3, 4],
  [2, 3, 2],
  [2, 4, 3],
  [3, 4, 5],
];

const MST_DISCONNECTED_EDGES = [[1, 2, 4]];

const TABS = [
  { id: "dijkstra", label: "Dijkstra" },
  { id: "topo", label: "Topological Sort" },
  { id: "bellman", label: "Bellman-Ford" },
  { id: "mst", label: "MST" },
  { id: "floyd", label: "Floyd-Warshall" },
  { id: "astar", label: "A*" },
  { id: "scc", label: "Kosaraju SCC" },
  { id: "cycle", label: "Cycle Detection" },
];

const RUN_LABEL = {
  dijkstra: "Run Dijkstra",
  topo: "Run Topological Sort",
  bellman: "Run Bellman-Ford",
  mst: "Run MST",
  floyd: "Run Floyd-Warshall",
  astar: "Run A*",
  scc: "Run Kosaraju",
  cycle: "Detect Cycle",
};

const TAGLINE = {
  dijkstra: "Dijkstra's shortest path on a weighted graph, edge by edge.",
  topo: "Topological sort on a directed acyclic graph — Kahn’s algorithm.",
  bellman: "Bellman-Ford shortest paths on weights that may be negative.",
  mst: "Minimum spanning tree — the cheapest edge set that connects every node.",
  floyd: "Floyd–Warshall — every pair of nodes at once.",
  astar: "A* — heuristic-guided shortest path that stops at the goal.",
  scc: "Strongly connected components via two passes over a directed graph.",
  cycle: "Back-edge detection — is this directed graph a DAG?",
};

const COMPLEXITY = {
  dijkstra: {
    operationName: "Dijkstra's Algorithm",
    complexity: "O((V + E) log V)",
    explanation:
      "Each node is settled once (V extractions) and every edge is relaxed once (E). With a binary heap the smallest-distance selection costs log V, giving O((V + E) log V).",
  },
  topo: {
    operationName: "Topological Sort (Kahn)",
    complexity: "O(V + E)",
    explanation:
      "Kahn's algorithm computes in-degrees once, then each node is enqueued and dequeued exactly once while every edge is examined — linear in V + E.",
  },
  bellman: {
    operationName: "Bellman-Ford",
    complexity: "O(V · E)",
    explanation:
      "Every edge is relaxed V − 1 times; each pass spreads a shortest distance one hop further. A final pass that still improves means a negative cycle exists.",
  },
  mst: {
    operationName: "MST (Prim / Kruskal)",
    complexity: "O(E log V) · O(E log E)",
    explanation:
      "Prim greedily grows one tree through the cheapest fringe edge (heap gives log V per step); Kruskal sorts all edges and accepts the cheapest safe one, tracking components with union-find (log E per step).",
  },
  floyd: {
    operationName: "Floyd–Warshall",
    complexity: "O(V³)",
    explanation:
      "Every ordered pair (i, j) is tested against every intermediate k — three nested loops through all V nodes — so all-pairs shortest distances drop out in one pass.",
  },
  astar: {
    operationName: "A* Search",
    complexity: "O((V + E) log V)",
    explanation:
      "Like Dijkstra, but the queue orders by f = g + h, expanding the most promising node first and stopping the moment the goal is selected. The heuristic is admissible (never overestimates), so the first time the goal is popped the path is still optimal.",
  },
  scc: {
    operationName: "Kosaraju's SCC",
    complexity: "O(V + E)",
    explanation:
      "Two depth-first passes: the first records finish order on the original graph, the second walks the reversed graph in decreasing finish order — each node and edge is touched exactly twice, and every second-pass tree is one strongly connected component.",
  },
  cycle: {
    operationName: "Cycle Detection (directed DFS)",
    complexity: "O(V + E)",
    explanation:
      "One DFS colors nodes white/gray/black. An edge into a gray node — one still on the recursion stack — is a back edge, and back edges are exactly what make a directed graph cyclic.",
  },
};

const emptyDistances = (nodes) => Object.fromEntries(nodes.map((n) => [n, Infinity]));
const zeroIndegrees = (nodes) => Object.fromEntries(nodes.map((n) => [n, 0]));

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
  const [algo, setAlgo] = useState("dijkstra");
  const [activeNode, setActiveNode] = useState(null);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [topoHighlighted, setTopoHighlighted] = useState([]);
  const [distances, setDistances] = useState(() => emptyDistances(DEMO_NODES));
  const [indegrees, setIndegrees] = useState(() => zeroIndegrees(DEMO_NODES));
  const [topoOrder, setTopoOrder] = useState([]);
  const [activeEdge, setActiveEdge] = useState(null);
  const [treeEdges, setTreeEdges] = useState([]);
  const [mstMethod, setMstMethod] = useState("prim");
  const [goalInput, setGoalInput] = useState("4");
  const [sccOf, setSccOf] = useState({});
  const [algoResult, setAlgoResult] = useState(null);
  const [fwMatrix, setFwMatrix] = useState([]);
  const [fwActiveCell, setFwActiveCell] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const isTopo = algo === "topo";
  const isBellman = algo === "bellman";
  const isMst = algo === "mst";
  const isFloyd = algo === "floyd";
  const isAstar = algo === "astar";
  const isScc = algo === "scc";
  const isCycle = algo === "cycle";
  const isDirected = isTopo || isScc || isCycle;

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

  const clearHighlights = ({ keepTree = false } = {}) => {
    setActiveNode(null);
    setVisitedNodes([]);
    setActiveEdge(null);
    setTopoHighlighted([]);
    if (!keepTree) setTreeEdges([]);
  };

  const applyPreset = (presetNodes, presetEdges, start = presetNodes[0]) => {
    setNodes([...presetNodes]);
    setEdges(presetEdges.map((e) => [...e]));
    setDistances(emptyDistances(presetNodes));
    setIndegrees(zeroIndegrees(presetNodes));
    setStartInput(String(start));
    setTopoOrder([]);
    setSccOf({});
    setAlgoResult(null);
    setFwMatrix([]);
    setFwActiveCell(null);
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const dijkstraUi = { setActiveNode, setVisitedNodes, setDistances, setActiveEdge };
  const topoUi = {
    setActiveNode,
    setHighlightedNodes: setTopoHighlighted,
    setIndegrees,
    setOrder: setTopoOrder,
  };

  const handleRun = () => {
    if (nodes.length === 0) {
      setError("Graph is empty — load a preset first");
      return;
    }

    if (isAstar) {
      const start = parseInt(startInput);
      const goal = parseInt(goalInput);
      if (isNaN(start)) {
        setError("Please enter a start node");
        return;
      }
      if (!nodes.includes(start)) {
        setError(`Start node ${start} is not in the graph`);
        return;
      }
      if (isNaN(goal)) {
        setError("Please enter a goal node");
        return;
      }
      if (!nodes.includes(goal)) {
        setError(`Goal node ${goal} is not in the graph`);
        return;
      }
      const steps = buildAstarSteps(nodes, edges, start, goal, {
        setActiveNode,
        setVisitedNodes,
        setActiveEdge,
        setDistances,
        setResult: setAlgoResult,
      });
      startRun(
        steps,
        () => {
          clearHighlights();
        },
        {
          before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          label: `A* ${start} → ${goal}`,
        }
      );
      return;
    }

    if (isScc) {
      const steps = buildKosarajuSteps(nodes, edges, {
        setActiveNode,
        setVisitedNodes,
        setActiveEdge,
        setSccOf,
        setResult: setAlgoResult,
      });
      startRun(
        steps,
        () => {
          clearHighlights();
        },
        {
          before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          label: "Kosaraju SCC",
        }
      );
      return;
    }

    if (isCycle) {
      const steps = buildCycleSteps(nodes, edges, {
        setActiveNode,
        setVisitedNodes,
        setActiveEdge,
        setResult: setAlgoResult,
      });
      startRun(
        steps,
        () => {
          clearHighlights();
        },
        {
          before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          label: "Cycle detection",
        }
      );
      return;
    }

    if (isFloyd) {
      const steps = buildFloydWarshallSteps(nodes, edges, {
        setMatrix: setFwMatrix,
        setActiveCell: setFwActiveCell,
      });
      startRun(
        steps,
        () => {
          clearHighlights();
        },
        {
          before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          label: "Floyd-Warshall",
        }
      );
      return;
    }

    if (isMst) {
      if (mstMethod === "prim") {
        const start = parseInt(startInput);
        if (isNaN(start)) {
          setError("Please enter a start node");
          return;
        }
        if (!nodes.includes(start)) {
          setError(`Start node ${start} is not in the graph`);
          return;
        }
        const steps = buildPrimSteps(nodes, edges, start, {
          setActiveNode,
          setVisitedNodes,
          setActiveEdge,
          setTreeEdges,
        });
        startRun(
          steps,
          () => {
            clearHighlights({ keepTree: true });
          },
          {
            before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
            after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
            label: `Prim MST from ${start}`,
          }
        );
      } else {
        const steps = buildKruskalSteps(nodes, edges, {
          setActiveNode,
          setVisitedNodes,
          setActiveEdge,
          setTreeEdges,
        });
        startRun(
          steps,
          () => {
            clearHighlights({ keepTree: true });
          },
          {
            before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
            after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
            label: "Kruskal MST",
          }
        );
      }
      return;
    }

    if (isBellman) {
      const start = parseInt(startInput);
      if (isNaN(start)) {
        setError("Please enter a start node");
        return;
      }
      if (!nodes.includes(start)) {
        setError(`Start node ${start} is not in the graph`);
        return;
      }
      const steps = buildBellmanFordSteps(nodes, edges, start, {
        setActiveNode,
        setActiveEdge,
        setDistances,
      });
      startRun(
        steps,
        () => {
          clearHighlights();
        },
        {
          before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          label: `Bellman-Ford from ${start}`,
        }
      );
      return;
    }

    if (isTopo) {
      const steps = buildTopoSteps(
        nodes,
        edges.map(([u, v]) => [u, v]),
        topoUi
      );
      startRun(
        steps,
        () => {
          clearHighlights();
        },
        {
          before: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          after: { nodes: [...nodes], edges: edges.map((e) => [...e]) },
          label: "Topological sort",
        }
      );
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
    const steps = buildDijkstraSteps(nodes, edges, start, dijkstraUi);
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

  const handleAlgoChange = (next) => {
    if (next === algo || isAnimating) return;
    setAlgo(next);
    if (next === "bellman" && edges.some((e) => e[2] < 0) === false) {
      applyPreset(BF_NODES, BF_EDGES, 1);
    }
    if (next === "mst") {
      setMstMethod("prim");
      applyPreset(MST_NODES, MST_EDGES, 1);
      return;
    }
    if (next === "floyd") {
      applyPreset(SMALL_NODES, SMALL_EDGES, 1);
      return;
    }
    if (next === "scc") {
      applyPreset(SCC_NODES, SCC_EDGES, 1);
      return;
    }
    if (next === "cycle") {
      applyPreset(CYCLIC_NODES, CYCLIC_EDGES, 1);
      return;
    }
    if (next === "astar") {
      const g = parseInt(goalInput);
      if (!nodes.includes(g)) {
        setGoalInput(nodes.length > 0 ? String(nodes[nodes.length - 1]) : "");
      }
    }
    setDistances(emptyDistances(nodes));
    setIndegrees(zeroIndegrees(nodes));
    setTopoOrder([]);
    setSccOf({});
    setAlgoResult(null);
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const handleReset = () =>
    applyPreset(
      isTopo
        ? COURSE_NODES
        : isBellman
          ? BF_NODES
          : isMst
            ? MST_NODES
            : isFloyd
              ? SMALL_NODES
              : isScc
                ? SCC_NODES
                : isCycle
                  ? CYCLIC_NODES
                  : DEMO_NODES,
      isTopo
        ? COURSE_EDGES
        : isBellman
          ? BF_EDGES
          : isMst
            ? MST_EDGES
            : isFloyd
              ? SMALL_EDGES
              : isScc
                ? SCC_EDGES
                : isCycle
                  ? CYCLIC_EDGES
                  : DEMO_EDGES,
      isBellman ? 1 : 1
    );
  const handleClear = () => applyPreset([], [], "");

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "graph-algo" && runEntry.before) {
      applyPreset(runEntry.before.nodes, runEntry.before.edges);
    }
  };

  const edgePairs = edges.map(([u, v]) => [u, v]);
  const layout = layoutGraph(nodes, edgePairs);
  const weightOf = (a, b) => {
    const found = edges.find(([u, v]) => (u === a && v === b) || (u === b && v === a));
    return found ? found[2] : null;
  };

  const isEdgeActive = (e) =>
    activeEdge !== null &&
    ((activeEdge[0] === e.fromValue && activeEdge[1] === e.toValue) ||
      (activeEdge[0] === e.toValue && activeEdge[1] === e.fromValue));

  const orderedNodes = [...nodes].sort((a, b) => a - b);
  const complexityInfo = COMPLEXITY[algo] ?? COMPLEXITY.dijkstra;

  return (
    <div className="graph-algo-page" ref={containerRef}>
      <h1>Graph Algorithms Visualizer</h1>
      <p className="page-tagline">
        {TAGLINE[algo] ?? TAGLINE.dijkstra}
      </p>

      <AlgoOverview
        title="Shortest paths, DAGs, MST & connectivity"
        what="Dijkstra and A* settle nodes nearest-first (A* steers with an admissible heuristic and stops at the goal); Kahn topologically sorts a DAG; Bellman-Ford accepts negative weights; Prim and Kruskal build the minimum spanning tree; Floyd–Warshall fills all pairs at once; Kosaraju splits a directed graph into strongly connected components; a DFS back-edge scan detects cycles."
        time="O((V+E) log V) · O(V + E) · O(V·E) · O(V³)"
        space="O(V)"
        when="shortest paths (any weights, any pairs); dependency ordering; connectivity of directed graphs; acyclicity checks."
        note="Directed edges (topo/SCC/cycle) wear arrows; unreachable nodes stay at ∞ honestly; Bellman-Ford catches negative cycles; A*'s heuristic never overestimates."
      />
      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Graph</h2>

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
                {isDirected && (
                  <defs>
                    <marker
                      id="arrow"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" />
                    </marker>
                  </defs>
                )}
                {layout.edges.map((e, i) => {
                  const inMst = isMst && treeEdges.some(
                    ([u, v]) =>
                      (u === e.fromValue && v === e.toValue) ||
                      (u === e.toValue && v === e.fromValue)
                  );
                  return (
                  <g key={`${e.fromValue}-${e.toValue}-${i}`}>
                    <line
                      className={`graph-algo-edge${isEdgeActive(e) ? " active" : ""}${inMst ? " mst-edge" : ""}`}
                      x1={e.x1}
                      y1={e.y1}
                      x2={e.x2}
                      y2={e.y2}
                      markerEnd={isDirected ? "url(#arrow)" : undefined}
                    />
                    {!isDirected && (
                      <text
                        className="graph-algo-weight"
                        x={(e.x1 + e.x2) / 2}
                        y={(e.y1 + e.y2) / 2}
                        textAnchor="middle"
                      >
                        {weightOf(e.fromValue, e.toValue)}
                      </text>
                    )}
                  </g>
                );
                })}
              </svg>
              {layout.nodes.map((n) => (
                <div
                  key={n.value}
                  className="graph-algo-node-slot"
                  style={{ left: `${n.x}px`, top: `${n.y}px` }}
                >
                  <div
                    className={`graph-algo-node${activeNode === n.value ? " active" : ""}${
                      activeNode !== n.value &&
                      (isTopo ? topoHighlighted.includes(n.value) : visitedNodes.includes(n.value))
                        ? " visited"
                        : ""
                    }`}
                  >
                    {n.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isFloyd && (
            <div className="info-panel dist-panel">
              <h3>All-pairs distance matrix</h3>
              <table className="fw-matrix">
                <thead>
                  <tr>
                    <th></th>
                    {orderedNodes.map((n) => (
                      <th key={n}>{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderedNodes.map((r) => (
                    <tr key={r}>
                      <td className="fw-header">{r}</td>
                      {orderedNodes.map((c) => {
                        const cell = fwMatrix[orderedNodes.indexOf(r)]?.[orderedNodes.indexOf(c)];
                        const active =
                          fwActiveCell &&
                          fwActiveCell[0] === orderedNodes.indexOf(r) &&
                          fwActiveCell[1] === orderedNodes.indexOf(c);
                        return (
                          <td
                            key={`${r}-${c}`}
                            className={active ? "fw-active" : ""}
                          >
                            {cell === undefined || cell === Infinity ? "∞" : cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`graph-algo:${algo}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={
                {
                  topo: TOPO_PSEUDOCODE,
                  bellman: BELLMAN_FORD_PSEUDOCODE,
                  mst: MST_PSEUDOCODE[mstMethod],
                  floyd: FLOYD_PSEUDOCODE,
                  astar: ASTAR_PSEUDOCODE,
                  scc: KOSARAJU_PSEUDOCODE,
                  cycle: CYCLE_PSEUDOCODE,
                }[algo] ?? DIJKSTRA_PSEUDOCODE
              }
            />
          )}

          <div className="info-panel dist-panel">
            <h3>
              {isTopo
                ? "In-degree table"
                : isScc
                  ? "Component table"
                  : isCycle
                    ? "Visited table"
                    : "Distance table"}
            </h3>
            <table className="dist-table">
              <thead>
                <tr>
                  <th>Node</th>
                  <th>
                    {isTopo ? "In-degree" : isScc ? "Component" : isCycle ? "Visited" : "Distance"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderedNodes.map((n) => (
                  <tr key={n} data-node={n}>
                    <td>{n}</td>
                    <td
                      className={
                        isTopo
                          ? "dist-settled"
                          : isScc
                            ? sccOf[n] !== undefined
                              ? "dist-settled"
                              : ""
                            : visitedNodes.includes(n)
                              ? "dist-settled"
                              : ""
                      }
                    >
                      {isTopo
                        ? indegrees[n] ?? 0
                        : isScc
                          ? sccOf[n] ?? "—"
                          : isCycle
                            ? visitedNodes.includes(n) ? "✓" : "—"
                            : distances[n] === Infinity || distances[n] === undefined
                              ? "∞"
                              : distances[n]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isTopo && topoOrder.length > 0 && (
              <p className="topo-order">
                Order: {topoOrder.join(" → ")}
              </p>
            )}
            {algoResult && <p className="algo-result">{algoResult}</p>}
          </div>
        </div>

        <div className="controls-area">
          <h2>Graph Algorithms</h2>

          <ErrorMessage message={error} />

          <TabNavigation
            tabs={TABS}
            activeTab={algo}
            onTabChange={handleAlgoChange}
            disabled={isAnimating}
          />

          <CasePresets
            disabled={isAnimating}
            presets={
              isTopo
                ? [
                    { label: "Course DAG", onClick: () => applyPreset(COURSE_NODES, COURSE_EDGES) },
                    { label: "Small DAG", onClick: () => applyPreset(SMALL_DAG_NODES, SMALL_DAG_EDGES) },
                    { label: "Cyclic", onClick: () => applyPreset(CYCLIC_NODES, CYCLIC_EDGES) },
                  ]
                : isBellman
                  ? [
                      { label: "Negative weights", onClick: () => applyPreset(BF_NODES, BF_EDGES, 1) },
                      { label: "Two + negative", onClick: () => applyPreset(BF_NEG_NODES, BF_NEG_EDGES, 1) },
                      { label: "Negative cycle", onClick: () => applyPreset(BF_CYCLE_NODES, BF_CYCLE_EDGES, 1) },
                    ]
                  : isMst
                    ? [
                        { label: "Classic", onClick: () => applyPreset(MST_NODES, MST_EDGES, 1) },
                        { label: "Dense", onClick: () => applyPreset(MST_DENSE_NODES, MST_DENSE_EDGES, 1) },
                        { label: "Disconnected", onClick: () => applyPreset(MST_NODES, MST_DISCONNECTED_EDGES, 1) },
                      ]
                    : isFloyd
                      ? [
                          { label: "Small graph", onClick: () => applyPreset(SMALL_NODES, SMALL_EDGES, 1) },
                          { label: "Classic", onClick: () => applyPreset(MST_NODES, MST_EDGES, 1) },
                          {
                            label: "Negative cycle",
                            onClick: () => applyPreset(BF_CYCLE_NODES, BF_CYCLE_EDGES, 1),
                          },
                        ]
                      : isAstar
                        ? [
                            { label: "Demo graph", onClick: () => applyPreset(DEMO_NODES, DEMO_EDGES, 1) },
                            { label: "Small graph", onClick: () => applyPreset(SMALL_NODES, SMALL_EDGES, 1) },
                          ]
                        : isScc
                          ? [
                              { label: "Two components", onClick: () => applyPreset(SCC_NODES, SCC_EDGES, 1) },
                              {
                                label: "Course DAG (singletons)",
                                onClick: () => applyPreset(COURSE_NODES, COURSE_EDGES, 1),
                              },
                            ]
                          : isCycle
                            ? [
                                { label: "Cyclic (2-cycle)", onClick: () => applyPreset(CYCLIC_NODES, CYCLIC_EDGES, 1) },
                                {
                                  label: "Course DAG (acyclic)",
                                  onClick: () => applyPreset(COURSE_NODES, COURSE_EDGES, 1),
                                },
                              ]
                            : [
                    { label: "Demo graph", onClick: () => applyPreset(DEMO_NODES, DEMO_EDGES, 1) },
                    { label: "Small graph", onClick: () => applyPreset(SMALL_NODES, SMALL_EDGES, 1) },
                    {
                      label: "Disconnected",
                      onClick: () => applyPreset([...DEMO_NODES, 9], DEMO_EDGES, 1),
                    },
                  ]
            }
          />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            {!isTopo && !isScc && !isCycle && (!isMst || mstMethod === "prim") && (
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
            )}
            {isAstar && (
              <div className="input-group">
                <label>Goal node:</label>
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Goal node"
                  disabled={isAnimating}
                />
              </div>
            )}
            {isMst && (
              <div className="method-toggle" aria-label="MST method">
                <button
                  type="button"
                  className={`method-chip${mstMethod === "prim" ? " active" : ""}`}
                  aria-pressed={mstMethod === "prim"}
                  onClick={() => setMstMethod("prim")}
                  disabled={isAnimating}
                >
                  Prim
                </button>
                <button
                  type="button"
                  className={`method-chip${mstMethod === "kruskal" ? " active" : ""}`}
                  aria-pressed={mstMethod === "kruskal"}
                  onClick={() => setMstMethod("kruskal")}
                  disabled={isAnimating}
                >
                  Kruskal
                </button>
              </div>
            )}
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {RUN_LABEL[algo] ?? "Run Dijkstra"}
            </button>
          </form>

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
              {
                name: isTopo
                  ? "Ordered"
                  : isMst
                    ? "Tree edges"
                    : isFloyd
                      ? "Matrix"
                      : isScc
                        ? "Components"
                        : isCycle
                          ? "Visited"
                          : "Settled",
                value: isTopo
                  ? `${topoOrder.length} / ${nodes.length}`
                  : isMst
                    ? `${treeEdges.length} / ${nodes.length - 1}`
                    : isFloyd
                      ? `${nodes.length} × ${nodes.length}`
                      : isBellman
                        ? `${nodes.filter((n) => distances[n] !== Infinity && distances[n] !== undefined).length} / ${nodes.length}`
                        : `${visitedNodes.length} / ${nodes.length}`,
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