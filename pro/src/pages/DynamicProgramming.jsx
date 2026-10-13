import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import CasePresets from "../components/CasePresets";
import AlgoOverview from "../components/AlgoOverview";
import {
  buildFibSteps,
  buildGridPathsSteps,
  buildCoinChangeSteps,
  buildLCSSteps,
  buildZeroOneKnapsackSteps,
  buildHouseRobberSteps,
} from "../lib/dpSteps";
import { buildEditDistanceSteps, buildLISSteps } from "../lib/dpExtraSteps";
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
  { id: "lcs", label: "Longest Common Subsequence" },
  { id: "knap01", label: "0/1 Knapsack" },
  { id: "robber", label: "House Robber" },
  { id: "edit", label: "Edit Distance" },
  { id: "lis", label: "Longest Increasing Subsequence" },
];

const COMPLEXITY = {
  fib: { operationName: "Fibonacci (tabulation)", complexity: "O(n)", explanation: "Each of the n subproblems is computed once from two already-solved ones — linear, and far better than the exponential naive recursion." },
  grid: { operationName: "Grid Paths", complexity: "O(rows × cols)", explanation: "Every cell's count reuses the cell above and the cell to the left, filling the table once in row-major order." },
  coin: { operationName: "Coin Change (fewest coins)", complexity: "O(target × coins)", explanation: "Each amount tries every coin that fits and keeps the best: dp[i] = min(dp[i−c] + 1)." },
  lcs: { operationName: "Longest Common Subsequence", complexity: "O(len(a) × len(b))", explanation: "A 2D table where every match extends a diagonal and every mismatch keeps the best of up/left — every pair of prefixes is solved once." },
  knap01: { operationName: "0/1 Knapsack", complexity: "O(items × capacity)", explanation: "dp[i][w] = best value from the first i items within weight w — take-or-skip over every item/weight pair. Contrast with the fractional (greedy) knapsack." },
  robber: { operationName: "House Robber", complexity: "O(n)", explanation: "dp[i] = best loot from the first i houses: either skip house i (keep dp[i−1]) or rob it and add dp[i−2] — never two adjacent." },
  edit: { operationName: "Edit Distance (Levenshtein)", complexity: "O(len(a) × len(b))", explanation: "dp[i][j] = fewest single-character edits to turn a[:i] into b[:j]: diagonal when the chars match, otherwise 1 + min(insert, delete, replace)." },
  lis: { operationName: "Longest Increasing Subsequence", complexity: "O(n²)", explanation: "dp[i] = length of the longest increasing subsequence ending at i: scan every earlier j < i with A[j] < A[i] and take dp[j] + 1." },
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
  lcs: {
    title: "Longest Common Subsequence",
    what: "How many characters can we line up from two strings in order? If the current chars match, the diagonal answer grows; otherwise keep the best of the cell above and the cell to the left.",
    time: "O(len(a) × len(b))", space: "O(len(a) × len(b))", when: "diff tools, DNA alignment, and any 'longest shared pattern' problem.",
  },
  knap01: {
    title: "0/1 Knapsack",
    what: "Best value you can carry with at most weight W, each item either fully taken or skipped. dp[i][w] = max(skip, take) where take = dp[i−1][w − wi] + vi.",
    time: "O(items × capacity)", space: "O(items × capacity)", when: "indivisible resource allocation — luggage, budgets, portfolios.",
    note: "The greedy fractional version is optimal when you may split items; the 0/1 version (no splitting) needs DP.",
  },
  robber: {
    title: "House Robber",
    what: "Steal the most value from a line of houses without robbing two adjacent ones: dp[i] = max(dp[i−1], dp[i−2] + houses[i]).",
    time: "O(n)", space: "O(n) memo (O(1) with two slots)", when: "any 'max sum with a no-adjacent constraint' problem.",
  },
  edit: {
    title: "Edit Distance (Levenshtein)",
    what: "How many single-character inserts, deletes, or replaces turn one string into another? dp[i][j] = 0 on a perfect diagonal match, otherwise 1 + min of the three edits.",
    time: "O(len(a) × len(b))", space: "O(len(a) × len(b))", when: "spell-checkers, fuzzy search, DNA alignment, diff tools.",
    note: "Contrast with LCS — LCS counts the longest shared subsequence; edit distance counts the cost of transforming one string into the other.",
  },
  lis: {
    title: "Longest Increasing Subsequence",
    what: "Find the longest subsequence (not necessarily contiguous) that is strictly increasing. dp[i] = 1 + the best dp[j] among all earlier smaller elements.",
    time: "O(n²)", space: "O(n)", when: "patience sorting, box-stacking, and many scheduling/resource problems.",
    note: "A binary-search + patience-sorting variant gives O(n log n) — the O(n²) DP here is the clearest starting point.",
  },
};

const emptyTable = () => ({});

const DynamicProgramming = () => {
  const seed = readScenario();
  const isScenario = seed && seed.structure === "dynamic-programming";
  const [tab, setTab] = useState(
    seed && ["grid", "coin", "lcs", "knap01", "robber", "edit", "lis"].includes(seed.mode) ? seed.mode : "fib"
  );
  const [nInput, setNInput] = useState(String(seed && Number.isInteger(seed.n) ? seed.n : 6));
  const [rowsInput, setRowsInput] = useState(String(seed && Number.isInteger(seed.rows) ? seed.rows : 3));
  const [colsInput, setColsInput] = useState(String(seed && Number.isInteger(seed.cols) ? seed.cols : 3));
  const [targetInput, setTargetInput] = useState(String(seed && Number.isInteger(seed.target) ? seed.target : 7));
  const [strA, setStrA] = useState(seed && seed.strA ? seed.strA : "ABCBDAB");
  const [strB, setStrB] = useState(seed && seed.strB ? seed.strB : "BDCABA");
  const [capacity01Input, setCapacity01Input] = useState(String(seed && Number.isInteger(seed.cap) ? seed.cap : 5));
  const [knap01Items, setKnap01Items] = useState([[2, 3], [3, 4], [4, 5], [5, 6]]);
  const [robValuesInput, setRobValuesInput] = useState("2, 7, 9, 3, 1");
  const [lisInput, setLisInput] = useState(seed && seed.lis ? seed.lis : "3, 1, 4, 1, 5, 9, 2, 6");
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
    } else if (tab === "coin") {
      const target = parseInt(targetInput);
      if (!Number.isInteger(target) || target < 1 || target > 60) {
        setError("Please enter a target amount (1-60)");
        return;
      }
      steps = buildCoinChangeSteps(target, [1, 2, 5], ui);
      label = `Coin change ${target}`;
    } else if (tab === "lcs") {
      if (!strA.trim() || !strB.trim()) {
        setError("Please enter both strings");
        return;
      }
      steps = buildLCSSteps(strA, strB, ui);
      label = `LCS ${strA} / ${strB}`;
    } else if (tab === "knap01") {
      const capacity = parseInt(capacity01Input);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
        setError("Please enter a capacity (1-20)");
        return;
      }
      steps = buildZeroOneKnapsackSteps(knap01Items, capacity, ui);
      label = `Knapsack × ${capacity}`;
    } else if (tab === "robber") {
      const values = robValuesInput.split(/[,\s]+/).filter((x) => x !== "").map((x) => parseInt(x, 10));
      if (values.length < 1 || values.some((v) => !Number.isInteger(v))) {
        setError("Please enter one or more house values, e.g. 2, 7, 9, 3, 1");
        return;
      }
      steps = buildHouseRobberSteps(values, ui);
      label = `Robber (${values.length} houses)`;
    } else if (tab === "edit") {
      if (!strA.trim() || !strB.trim()) {
        setError("Please enter both strings");
        return;
      }
      steps = buildEditDistanceSteps(strA, strB, ui);
      label = `Edit distance ${strA} / ${strB}`;
    } else {
      const values = lisInput.split(/[,\s]+/).filter((x) => x !== "").map((x) => parseInt(x, 10));
      if (values.length < 1 || values.some((v) => !Number.isInteger(v))) {
        setError("Please enter one or more integers, e.g. 3, 1, 4, 1, 5");
        return;
      }
      steps = buildLISSteps(values, ui);
      label = `LIS (${values.length} values)`;
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
    setStrA("ABCBDAB");
    setStrB("BDCABA");
    setCapacity01Input("5");
    setKnap01Items([[2, 3], [3, 4], [4, 5], [5, 6]]);
    setRobValuesInput("2, 7, 9, 3, 1");
    setLisInput("3, 1, 4, 1, 5, 9, 2, 6");
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

  const capacity01InputNum = parseInt(capacity01Input) || 5;
  const lcsCells = () => {
    const out = [];
    for (let i = 0; i <= strA.length; i += 1) {
      for (let j = 0; j <= strB.length; j += 1) out.push([i, j]);
    }
    return out;
  };
  const knap01Cells = () => {
    const out = [];
    for (let i = 0; i <= knap01Items.length; i += 1) {
      for (let w = 0; w <= capacity01InputNum; w += 1) out.push([i, w]);
    }
    return out;
  };
  const robberValues = () =>
    robValuesInput
      .split(/[,\s]+/)
      .filter((x) => x !== "")
      .map((x) => parseInt(x, 10));

  const shareExtra = {
    mode: tab,
    n: parseInt(nInput) || 6,
    rows: parseInt(rowsInput) || 3,
    cols: parseInt(colsInput) || 3,
    target: parseInt(targetInput) || 7,
    strA,
    strB,
    cap: capacity01InputNum,
  };

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
            {tab === "lcs" && (
              <div className="dp-grid" style={{ gridTemplateColumns: `repeat(${strB.length + 1}, auto)` }}>
                {lcsCells().map(([i, j]) => {
                  const key = `${i},${j}`;
                  const active = activeCell && activeCell[0] === i && activeCell[1] === j;
                  const highlighted = highlightedCells.some(([h1, h2]) => h1 === i && h2 === j);
                  const label = (i === 0 ? "·" : strA[i - 1]) + "" + (j === 0 ? "·" : strB[j - 1]);
                  return (
                    <span key={key} className={`dp-grid-cell${active ? " active" : ""}${highlighted ? " highlighted" : ""}`}>
                      <span className="dp-index">{label}</span>
                      {table[key] !== undefined ? table[key] : <span className="dp-empty">—</span>}
                    </span>
                  );
                })}
              </div>
            )}
            {tab === "knap01" && (
              <div className="dp-grid" style={{ gridTemplateColumns: `repeat(${capacity01InputNum + 1}, auto)` }}>
                {knap01Cells().map(([i, w]) => {
                  const key = `${i},${w}`;
                  const active = activeCell && activeCell[0] === i && activeCell[1] === w;
                  const highlighted = highlightedCells.some(([h1, h2]) => h1 === i && h2 === w);
                  const label = i === 0 ? "·w" : `#${i}`;
                  return (
                    <span key={key} className={`dp-grid-cell${active ? " active" : ""}${highlighted ? " highlighted" : ""}`}>
                      <span className="dp-index">{label}</span>
                      {table[key] !== undefined ? table[key] : <span className="dp-empty">—</span>}
                    </span>
                  );
                })}
              </div>
            )}
            {tab === "robber" && (
              <div className="dp-chips">
                {robberValues().map((v, i) => (
                  <span key={i} className={`dp-chip${activeKey === i ? " active" : ""}${highlightedKeys.includes(i) ? " highlighted" : ""}`}>
                    <span className="dp-index">house {i}</span>
                    {table[i] !== undefined ? table[i] : v}
                  </span>
                ))}
              </div>
            )}
            {tab === "edit" && (
              <div className="dp-grid" style={{ gridTemplateColumns: `repeat(${strB.length + 1}, auto)` }}>
                {lcsCells().map(([i, j]) => {
                  const key = `${i},${j}`;
                  const active = activeCell && activeCell[0] === i && activeCell[1] === j;
                  const highlighted = highlightedCells.some(([h1, h2]) => h1 === i && h2 === j);
                  const label = (i === 0 ? "·" : strA[i - 1]) + "" + (j === 0 ? "·" : strB[j - 1]);
                  return (
                    <span key={key} className={`dp-grid-cell${active ? " active" : ""}${highlighted ? " highlighted" : ""}`}>
                      <span className="dp-index">{label}</span>
                      {table[key] !== undefined ? table[key] : <span className="dp-empty">—</span>}
                    </span>
                  );
                })}
              </div>
            )}
            {tab === "lis" && (
              <div className="dp-chips">
                {lisInput.split(/[,\s]+/).filter((x) => x !== "").map((x, i) => (
                  <span key={i} className={`dp-chip${activeKey === i ? " active" : ""}${highlightedKeys.includes(i) ? " highlighted" : ""}`}>
                    <span className="dp-index">dp[{i}]</span>
                    {table[i] !== undefined ? table[i] : <span className="dp-empty">—</span>}
                    <span className="dp-index">{x}</span>
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
            {tab === "lcs" && "dp[i][j] = LCS length of the first i chars of A and first j of B."}
            {tab === "knap01" && "dp[i][w] = best value from the first i items within weight w."}
              {tab === "robber" && "dp[i] = best loot from the first i houses (never adjacent)."}
              {tab === "edit" && "dp[i][j] = fewest edits to turn a[:i] into b[:j]."}
              {tab === "lis" && "dp[i] = length of the longest increasing subsequence ending at i."}
            </p>
          </div>
        </div>

        <div className="controls-area">
          <h2>DP Settings</h2>
          <ErrorMessage message={error} />

          <TabNavigation tabs={TABS} activeTab={tab} onTabChange={handleTabChange} disabled={isAnimating} />

          {tab === "knap01" && (
            <CasePresets
              disabled={isAnimating}
              presets={[
                { label: "Classic", onClick: () => setKnap01Items([[2, 3], [3, 4], [4, 5], [5, 6]]) },
                { label: "Tiny", onClick: () => setKnap01Items([[1, 1], [2, 3], [3, 6]]) },
              ]}
            />
          )}

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
            {tab === "lcs" && (
              <>
                <div className="input-group">
                  <label>String A:</label>
                  <input type="text" value={strA} onChange={(e) => setStrA(e.target.value)} disabled={isAnimating} placeholder="ABCBDAB" />
                </div>
                <div className="input-group">
                  <label>String B:</label>
                  <input type="text" value={strB} onChange={(e) => setStrB(e.target.value)} disabled={isAnimating} placeholder="BDCABA" />
                </div>
              </>
            )}
            {tab === "knap01" && (
              <div className="input-group">
                <label>Capacity:</label>
                <input type="number" value={capacity01Input} onChange={(e) => setCapacity01Input(e.target.value)} disabled={isAnimating} placeholder="capacity" />
              </div>
            )}
            {tab === "robber" && (
              <div className="input-group">
                <label>House values:</label>
                <input type="text" value={robValuesInput} onChange={(e) => setRobValuesInput(e.target.value)} disabled={isAnimating} placeholder="2, 7, 9, 3, 1" />
              </div>
            )}
            {tab === "edit" && (
              <>
                <div className="input-group">
                  <label>String A:</label>
                  <input type="text" value={strA} onChange={(e) => setStrA(e.target.value)} disabled={isAnimating} placeholder="kitten" />
                </div>
                <div className="input-group">
                  <label>String B:</label>
                  <input type="text" value={strB} onChange={(e) => setStrB(e.target.value)} disabled={isAnimating} placeholder="sitting" />
                </div>
              </>
            )}
            {tab === "lis" && (
              <div className="input-group">
                <label>Values:</label>
                <input type="text" value={lisInput} onChange={(e) => setLisInput(e.target.value)} disabled={isAnimating} placeholder="3, 1, 4, 1, 5, 9, 2, 6" />
              </div>
            )}
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {tab === "fib"
                ? "Run Fibonacci"
                : tab === "grid"
                  ? "Count Paths"
                  : tab === "coin"
                    ? "Run Coin Change"
                    : tab === "lcs"
                      ? "Compute LCS"
                      : tab === "knap01"
                        ? "Fill Knapsack"
                        : tab === "robber"
                          ? "Run House Robber"
                          : tab === "edit"
                            ? "Compute Edit Distance"
                            : "Run LIS"}
            </button>
          </form>

          <ComplexityInfo operationName={complexityInfo.operationName} complexity={complexityInfo.complexity} explanation={complexityInfo.explanation} />

          <PropertyDisplay
            title="DP Properties"
            properties={[
              {
                name: "Subproblems",
                value:
                  tab === "fib"
                    ? (parseInt(nInput) || 6) + 1
                    : tab === "grid"
                      ? (parseInt(rowsInput) || 3) * (parseInt(colsInput) || 3)
                      : tab === "coin"
                        ? (parseInt(targetInput) || 7) + 1
                        : tab === "lcs"
                          ? (strA.length + 1) * (strB.length + 1)
                          : tab === "edit"
                            ? (strA.length + 1) * (strB.length + 1)
                            : tab === "knap01"
                              ? (knap01Items.length + 1) * (capacity01InputNum + 1)
                              : tab === "lis"
                                ? lisInput.split(/[,\s]+/).filter((x) => x !== "").length
                                : robberValues().length,
              },
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
