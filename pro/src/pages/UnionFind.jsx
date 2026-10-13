import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import AlgoOverview from "../components/AlgoOverview";
import { UnionFind } from "../lib/uf";
import {
  buildUfMakeSteps,
  buildUfFindSteps,
  buildUfUnionSteps,
} from "../lib/ufSteps";
import { layoutUf } from "../lib/ufLayout";
import { UNION_FIND_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import OperationPlayer from "../components/OperationPlayer";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import MemoryRepresentation from "../components/MemoryRepresentation";
import ViewToggle from "../components/ViewToggle";
import ShareButton from "../components/ShareButton";
import RunHistoryPanel from "../components/RunHistoryPanel";
import { readScenario } from "../lib/share";
import { recordRun, listRuns } from "../lib/timeTravel";
import "./UnionFind.css";

const TABS = [
  { id: "make", label: "Add Set" },
  { id: "union", label: "Union" },
  { id: "find", label: "Find" },
];

const BUTTON_LABEL = { make: "Make Set", union: "Union Nodes", find: "Find Root" };

const COMPLEXITY = {
  make: { operationName: "MakeSet", complexity: "O(1)", explanation: "A singleton is created by pointing an element at itself with rank 0." },
  union: { operationName: "Union", complexity: "O(α n) amortized", explanation: "Two finds followed by an attach — with path compression and union by rank, nearly constant in practice (inverse-Ackermann)." },
  find: { operationName: "Find", complexity: "O(α n) amortized", explanation: "Climbing the parent chain to the root flattens it on the way back, so later finds are faster." },
};

const seedDemo = (uf) => {
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((v) => uf.make(v));
  uf.union(1, 2);
  uf.union(2, 3);
  uf.union(4, 5);
};

const fromScenario = (uf, scenario) => {
  if (scenario && Array.isArray(scenario.values)) {
    scenario.values.forEach((v) => uf.make(v));
  }
};

const UnionFindPage = () => {
  const [uf] = useState(() => {
    const instance = new UnionFind();
    const scenario = readScenario();
    if (scenario && scenario.structure === "union-find" && Array.isArray(scenario.values)) {
      fromScenario(instance, scenario);
    } else {
      seedDemo(instance);
    }
    return instance;
  });
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("make");
  const [value, setValue] = useState("");
  const [aInput, setAInput] = useState("");
  const [bInput, setBInput] = useState("");
  const [activeValue, setActiveValue] = useState(null);
  const [highlightedValues, setHighlightedValues] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("story");

  const containerRef = useRef(null);
  const values = Object.keys(uf.parent).map(Number).sort((a, b) => a - b);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "union-find", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveValue(null);
    setHighlightedValues([]);
  };

  const ui = { setActiveValue, setHighlightedValues };

  const parseGuarded = (raw, label) => {
    if (!raw.trim()) {
      setError(`Please enter ${label}`);
      return null;
    }
    const v = parseInt(raw);
    if (isNaN(v)) {
      setError(`Please enter a valid integer ${label}`);
      return null;
    }
    return v;
  };

  const handleMake = () => {
    const v = parseGuarded(value, "a set value");
    if (v === null) return;
    const trace = [];
    uf.make(v, trace);
    const steps = buildUfMakeSteps(v, ui);
    startRun(
      steps,
      () => {
        setTick((t) => t + 1);
        setValue("");
        clearHighlights();
      },
      { before: null, after: null, label: `Add set ${v}` }
    );
  };

  const handleUnion = () => {
    if (!aInput.trim() || !bInput.trim()) {
      setError("Please enter both set values");
      return;
    }
    const a = parseInt(aInput);
    const b = parseInt(bInput);
    if (isNaN(a) || isNaN(b)) {
      setError("Please enter valid integers");
      return;
    }
    if (!(a in uf.parent)) {
      setError(`Add set ${a} first`);
      return;
    }
    if (!(b in uf.parent)) {
      setError(`Add set ${b} first`);
      return;
    }
    const trace = [];
    uf.union(a, b, trace);
    const steps = buildUfUnionSteps(a, b, trace, ui);
    startRun(
      steps,
      () => {
        setTick((t) => t + 1);
        setAInput("");
        setBInput("");
        clearHighlights();
      },
      { before: null, after: null, label: `Union ${a} — ${b}` }
    );
  };

  const handleFind = () => {
    const v = parseGuarded(value, "a set value");
    if (v === null) return;
    if (!(v in uf.parent)) {
      setError(`Add set ${v} first`);
      return;
    }
    const trace = [];
    uf.find(v, trace);
    const steps = buildUfFindSteps(v, trace, ui);
    startRun(
      steps,
      () => {
        setValue("");
        clearHighlights();
      },
      { before: null, after: null, label: `Find root ${v}` }
    );
  };

  const handleRun = () => {
    if (activeTab === "make") handleMake();
    else if (activeTab === "union") handleUnion();
    else handleFind();
  };

  const handleReset = () => {
    uf.parent = {};
    uf.rank = {};
    uf.size = 0;
    seedDemo(uf);
    setTick((t) => t + 1);
    clearHighlights();
    setError(null);
    setRun(null);
    setValue("");
    setAInput("");
    setBInput("");
  };

  const handleClear = () => {
    uf.parent = {};
    uf.rank = {};
    uf.size = 0;
    setTick((t) => t + 1);
    clearHighlights();
    setError(null);
    setRun(null);
    setValue("");
    setAInput("");
    setBInput("");
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "union-find") handleReset();
  };

  const handleTabChange = (next) => {
    if (next === activeTab || isAnimating) return;
    setActiveTab(next);
    setRun(null);
    setError(null);
    clearHighlights();
  };

  const layout = layoutUf(uf.parent, values);
  const roots = values.filter((v) => uf.parent[v] === v).length;
  const maxH = values.reduce((m, v) => Math.max(m, uf.height(v)), 0);

  const addressOf = (v) => {
    const idx = values.indexOf(v);
    return `0x${(idx * 4 + 100).toString(16).toUpperCase()}`;
  };
  const memoryBlocks = values.map((v) => {
    const parent = uf.parent[v];
    return {
      address: addressOf(v),
      value: v,
      pointers: [
        {
          label: parent == null ? 'unused' : parent === v ? 'root' : 'parent',
          target: parent == null || parent === v ? null : addressOf(parent),
        },
      ],
    };
  });

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.make;

  return (
    <div className="uf-page" ref={containerRef}>
      <h1>Union-Find Visualizer</h1>
      <p className="page-tagline">Disjoint sets — union by rank, find with path compression.</p>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Forest of Components</h2>

          <AlgoOverview
            title="Union-Find (Disjoint Set Union)"
            what="Elements live in trees; the root of each tree names its set. find follows parents to the root (compressing the path), and union attaches the smaller tree under the larger."
            time="O(α n) amortized"
            space="O(n)"
            when="connectivity and partition questions: network islands, equations, Kruskal's MST."
          />

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="union-find" values={values} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
            <button type="button" className="data-action-btn danger" onClick={handleClear} disabled={isAnimating}>
              Clear
            </button>
          </div>

          {view === "story" ? (
            values.length === 0 ? (
              <div className="uf-canvas">
                <p className="empty-state">No sets yet — add a set to get started.</p>
              </div>
            ) : (
              <div
                key={tick}
                className="uf-canvas"
                style={{ width: layout.width, height: layout.height }}
              >
                <svg width={layout.width} height={layout.height} aria-hidden="true">
                  {layout.edges.map((e, i) => (
                    <line
                      key={`${e.parentValue}-${e.childValue}-${i}`}
                      className={`uf-edge${activeValue === e.parentValue || highlightedValues.includes(e.parentValue) ? " active" : ""}`}
                      x1={e.x1}
                      y1={e.y1}
                      x2={e.x2}
                      y2={e.y2}
                    />
                  ))}
                </svg>
                {layout.nodes.map((n) => (
                  <div
                    key={n.value}
                    className="uf-node-slot"
                    style={{ left: `${n.x}px`, top: `${n.y}px` }}
                  >
                    <div
                      className={`uf-node${activeValue === n.value ? " active" : ""}${
                        highlightedValues.includes(n.value) ? " highlighted" : ""
                      }${n.isRoot ? " root" : ""}`}
                    >
                      {n.value}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : values.length === 0 ? (
            <p className="empty-state">No memory cells yet — add a set to get started.</p>
          ) : (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`uf:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={UNION_FIND_PSEUDOCODE[activeTab]}
            />
          )}

          {view === "story" && values.length > 0 && (
            <MemoryRepresentation blocks={memoryBlocks} />
          )}
        </div>

        <div className="controls-area">
          <h2>Operations</h2>
          <ErrorMessage message={error} />

          <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} disabled={isAnimating} />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            {(activeTab === "make" || activeTab === "find") && (
              <div className="input-group">
                <label>{activeTab === "make" ? "New set:" : "Find value:"}</label>
                <input type="number" value={value} onChange={(e) => setValue(e.target.value)} disabled={isAnimating} placeholder="Enter a number" />
              </div>
            )}
            {activeTab === "union" && (
              <>
                <div className="input-group">
                  <label>A:</label>
                  <input type="number" value={aInput} onChange={(e) => setAInput(e.target.value)} disabled={isAnimating} placeholder="Set A" />
                </div>
                <div className="input-group">
                  <label>B:</label>
                  <input type="number" value={bInput} onChange={(e) => setBInput(e.target.value)} disabled={isAnimating} placeholder="Set B" />
                </div>
              </>
            )}
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {BUTTON_LABEL[activeTab]}
            </button>
          </form>

          <ComplexityInfo operationName={complexityInfo.operationName} complexity={complexityInfo.complexity} explanation={complexityInfo.explanation} />

          <PropertyDisplay
            title="Union-Find Properties"
            properties={[
              { name: "Elements", value: values.length },
              { name: "Sets (roots)", value: roots },
              { name: "Max height", value: maxH },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("union-find")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default UnionFindPage;
