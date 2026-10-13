import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import AlgoOverview from "../components/AlgoOverview";
import { buildFibSteps, buildGridPathsSteps, buildCoinChangeSteps } from "../lib/dpSteps";
import { DP_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import OperationPlayer from "../components/OperationPlayer";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import ShareButton from "../components/ShareButton";
import RunHistoryPanel from "../components/RunHistoryPanel";
import { readScenario } from "../lib/share";
import { recordRun, listRuns } from "../lib/timeTravel";
import "./DynamicProgramming.css";

const TABS = [
  { id: "fib", label: "Fibonacci" },
  { id: "grid", label: "Grid Paths" },
  { id: "coin", label: "Coin Change" },
];

const COMPLEXITY = {
  fib: { operationName: "Fibonacci (tabulation)", complexity: "O(n)", explanation: "Each of the n subproblems is computed once from two already-solved ones — linear, and far better than the exponential naive recursion." },
  grid: { operationName: "Grid Paths", complexity: "O(rows × cols)", explanation: "Every cell's count reuses the cell above and the cell to the left, filling the table once in row-major order." },
  coin: { operationName: "Coin Change (fewest coins)", complexity: "O(target × coins)", explanation: "Each amount tries every coin that fits and keeps the best: dp[i] = min(dp[i−c] + 1)." },
};

const OVERVIEW = {
  fib: {
    title: "Fibonacci (Dynamic Programming)",
    what: "Every Fibonacci number is the sum of the two before it. DP stores each subanswer once, so computing fib(n) is O(n) instead of the exponential recursion tree.",
    time: "O(n) time", space: "O(n) memo", when: "any recurrence where subproblems overlap.",
    note: "Compare bottom-up filling here with a naive recursive approach — the stored answers are the whole win.",
  },
  grid: {
    title: "Path Counting (Grid DP)",
    what: "Starting at (0,0) and moving only right/down, the number of ways to reach any cell is the sum of the ways to reach the cell above plus the cell to the left.",
    time: "O(rows × cols)", space: "O(rows × cols)", when: "counting paths or options along a grid with local rules.",
  },
  coin: {
    title: "Coin Change (Fewest Coins)",
    what: "dp[i] = the fewest coins that sum to i. Each amount tries every coin c ≤ i and keeps 1 + dp[i − c]. dp[0] = 0; unreachable amounts stay infinite.",
    time: "O(target × coins)", space: "O(target)", when: "minimum-pieces problems with denominations.",
    note: "DP gives the optimum — a greedy largest-first approach can fail on amounts like 6 with coins 4 and 3.",
  },
};

const emptyTable = () => ({});

const DynamicProgramming = () => {
  const seed = readScenario();
  const isScenario = seed && seed.structure === "dynamic-programming";
  const [tab, setTab] = useState(seed && seed.mode === "grid" ? "grid" : seed && seed.mode === "coin" ? "coin" : "fib");
  const [nInput, setNInput] = useState(String(seed && Number.isInteger(seed.n) ? seed.n : 6));
  const [rowsInput, setRowsInput] = useState(String(seed && Number.isInteger(seed.rows) ? seed.rows : 3));
  const [colsInput, setColsInput] = useState(String(seed && Number.isInteger(seed.cols) ? seed.cols : 3));
  const [targetInput, setTargetInput] = useState(String(seed && Number.isInteger(seed.target) ? seed.target : 7));
  const [activeKey, setActiveKey] = useState(null);
  const [highlightedKeys, setHighlightedKeys] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [table, setTable] = useState(() => (isScenario ? (seed.values ?? []) : emptyTable()));
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const emptyRef = useRef(emptyTable());

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "dynamic-programming", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveKey(null);
    setHighlightedKeys([]);
    setActiveCell(null);
    setHighlightedCells([]);
  };

  const ui = {
    setActiveKey,
    setHighlightedKeys,
    setActiveCell,
    setHighlightedCells,
    setTable,
  };

  const handleRun = () => {
    let steps;
    let label;
    if (tab === "fib") {
      const n = parseInt(nInput);
      if (!Number.isInteger(n) || n < 1 || n > 30) {
        setError("Please enter an n between 1 and 30");
        return;
      }
      steps = buildFibSteps(n, ui);
      label = `Fibonacci(${n})`;
    } else if (tab === "grid") {
      const rows = parseInt(rowsInput);
      const cols = parseInt(colsInput);
      if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || rows > 6 || cols < 1 || cols > 8) {
        setError("Please enter rows (1-6) and columns (1-8)");
        return;
      }
      steps = buildGridPathsSteps(rows, cols, ui);
      label = `Grid paths ${rows}×${cols}`;
    } else {
      const target = parseInt(targetInput);
      if (!Number.isInteger(target) || target < 1 || target > 60) {
        setError("Please enter a target amount (1-60)");
        return;
      }
      steps = buildCoinChangeSteps(target, [1, 2, 5], ui);
      label = `Coin change ${target}`;
    }

    startRun(steps, () => clearHighlights(), {
      before: { tab },
      after: { tab },
      label,
    });
  };

  const handleReset = () => {
    setNInput("6");
    setRowsInput("3");
    setColsInput("3");
    setTargetInput("7");
    setTable(emptyRef.current);
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const handleClear = () => {
    setTable(emptyRef.current);
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "dynamic-programming" && runEntry.before) {
      setTab(runEntry.before.tab ?? "fib");
      handleReset();
    }
  };

  const handleTabChange = (next) => {
    if (next === tab || isAnimating) return;
    setTab(next);
    setTable(emptyRef.current);
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const learn = OVERVIEW[tab] ?? OVERVIEW.fib;
  const complexityInfo = COMPLEXITY[tab] ?? COMPLEXITY.fib;

  const fibKeys = Array.from({ length: (parseInt(nInput) || 6) + 1 }, (_, i) => i);
  const gridCells = [];
  for (let r = 0; r < (parseInt(rowsInput) || 3); r += 1) {
    for (let c = 0; c < (parseInt(colsInput) || 3); c += 1) gridCells.push([r, c]);
  }
  const coinKeys = Array.from({ length: (parseInt(targetInput) || 7) + 1 }, (_, i) => i);

  const shareExtra = { mode: tab, n: parseInt(nInput) || 6, rows: parseInt(rowsInput) || 3, cols: parseInt(colsInput) || 3, target: parseInt(targetInput) || 7 };

  return (
    <div className="dp-page" ref={containerRef}>
      <h1>Dynamic Programming Visualizer</h1>
      <p className="page-tagline">Three classic problems, one idea: store subanswers and build up.</p>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>{learn.title}</h2>

          <AlgoOverview title={learn.title} what={learn.what} time={learn.time} space={learn.space} when={learn.when} note={learn.note} />

          <ShareButton structure="dynamic-programming" values={[]} extra={shareExtra} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>Reset</button>
            <button type="button" className="data-action-btn danger" onClick={handleClear} disabled={isAnimating}>Clear</button>
          </div>

          <div className="dp-canvas">
            {tab === "fib" && (
              <div className="dp-chips">
                {fibKeys.map((i) => (
                  <span key={i} className={`dp-chip${activeKey === i ? " active" : ""}${highlightedKeys.includes(i) ? " highlighted" : ""}`}>
                    <span className="dp-index">{i}</span>
                    {table[i] !== undefined ? table[i] : <span className="dp-empty">—</span>}
                  </span>
                ))}
              </div>
            )}
            {tab === "grid" && (
              <div
                className="dp-grid"
                style={{ gridTemplateColumns: `repeat(${parseInt(colsInput) || 3}, auto)` }}
              >
                {gridCells.map(([r, c]) => {
                  const key = `${r},${c}`;
                  const active = activeCell && activeCell[0] === r && activeCell[1] === c;
                  const highlighted =
                    highlightedCells.some(([hr, hc]) => hr === r && hc === c);
                  return (
                    <span key={key} className={`dp-grid-cell${active ? " active" : ""}${highlighted ? " highlighted" : ""}`}>
                      <span className="dp-index">
                        {r},{c}
                      </span>
                      {table[key] !== undefined ? table[key] : <span className="dp-empty">—</span>}
                    </span>
                  );
                })}
              </div>
            )}
            {tab === "coin" && (
              <div className="dp-chips">
                {coinKeys.map((i) => (
                  <span key={i} className={`dp-chip${activeKey === i ? " active" : ""}${highlightedKeys.includes(i) ? " highlighted" : ""}`}>
                    <span className="dp-index">{i}</span>
                    {table[i] !== undefined ? (table[i] === Infinity ? "∞" : table[i]) : <span className="dp-empty">—</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`dp:${tab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={DP_PSEUDOCODE[tab]}
            />
          )}

          <div className="info-panel">
            <h3>DP table</h3>
            <p className="ao-note">
              {tab === "fib" && "memo[n] = the n-th Fibonacci number."}
              {tab === "grid" && "ways[r][c] = paths from (0,0) to (r,c)."}
              {tab === "coin" && "dp[i] = fewest coins making amount i (∞ = unreachable)."}
            </p>
          </div>
        </div>

        <div className="controls-area">
          <h2>DP Settings</h2>
          <ErrorMessage message={error} />

          <TabNavigation tabs={TABS} activeTab={tab} onTabChange={handleTabChange} disabled={isAnimating} />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            {tab === "fib" && (
              <div className="input-group">
                <label>n:</label>
                <input type="number" value={nInput} onChange={(e) => setNInput(e.target.value)} disabled={isAnimating} placeholder="n" />
              </div>
            )}
            {tab === "grid" && (
              <>
                <div className="input-group">
                  <label>Rows:</label>
                  <input type="number" value={rowsInput} onChange={(e) => setRowsInput(e.target.value)} disabled={isAnimating} placeholder="rows" />
                </div>
                <div className="input-group">
                  <label>Cols:</label>
                  <input type="number" value={colsInput} onChange={(e) => setColsInput(e.target.value)} disabled={isAnimating} placeholder="cols" />
                </div>
              </>
            )}
            {tab === "coin" && (
              <div className="input-group">
                <label>Target:</label>
                <input type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} disabled={isAnimating} placeholder="target" />
              </div>
            )}
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {tab === "fib" ? "Run Fibonacci" : tab === "grid" ? "Count Paths" : "Run Coin Change"}
            </button>
          </form>

          <ComplexityInfo operationName={complexityInfo.operationName} complexity={complexityInfo.complexity} explanation={complexityInfo.explanation} />

          <PropertyDisplay
            title="DP Properties"
            properties={[
              { name: "Subproblems", value: tab === "fib" ? (parseInt(nInput) || 6) + 1 : tab === "grid" ? (parseInt(rowsInput) || 3) * (parseInt(colsInput) || 3) : (parseInt(targetInput) || 7) + 1 },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("dynamic-programming")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default DynamicProgramming;
