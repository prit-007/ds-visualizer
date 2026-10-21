import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import AlgoOverview from "../components/AlgoOverview";
import {
  buildNQueensSteps,
  buildSudokuSteps,
  buildHamiltonianSteps,
  buildSubsetSumSteps,
  SUDOKU_PUZZLE,
} from "../lib/backtrackingSteps";
import { BACKTRACKING_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import OperationPlayer from "../components/OperationPlayer";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import ShareButton from "../components/ShareButton";
import RunHistoryPanel from "../components/RunHistoryPanel";
import { recordRun, listRuns } from "../lib/timeTravel";
import "./Backtracking.css";

const TABS = [
  { id: "nqueens", label: "N-Queens" },
  { id: "sudoku", label: "Mini Sudoku" },
  { id: "hamiltonian", label: "Hamiltonian Path" },
  { id: "subset", label: "Subset Sum" },
];

const BUTTON_LABEL = {
  nqueens: "Run N-Queens",
  sudoku: "Run Sudoku",
  hamiltonian: "Run Hamiltonian Path",
  subset: "Run Subset Sum",
};

const COMPLEXITY = {
  nqueens: {
    operationName: "N-Queens (backtracking)",
    complexity: "O(n!)",
    explanation:
      "Each row is tried column by column; a safe square is occupied then explored, and a later dead end undoes the choice. Worst case explores every permutation of n queens.",
  },
  sudoku: {
    operationName: "Mini Sudoku (backtracking)",
    complexity: "O(4^e) worst case",
    explanation:
      "Every empty cell tries digits 1..4 with row/col/box checks, recursing forward until a placement starves the grid, then unwinding. The 4×4 demo stays tiny.",
  },
  hamiltonian: {
    operationName: "Hamiltonian Path (backtracking)",
    complexity: "O(n² · 2^(n²)) worst case",
    explanation:
      "From each cell the search tries every unvisited neighbor, marks it visited, recurses, and unwinds on a dead end. Every cell must be visited exactly once, ending at the bottom-right corner.",
  },
  subset: {
    operationName: "Subset Sum (backtracking)",
    complexity: "O(2^n) worst case",
    explanation:
      "Each number is either taken or skipped; the running total is carried forward and a choice that overshoots is pruned. An honest no-subset verdict is reported when every choice is exhausted.",
  },
};

const NQUEENS_DEFAULT = 4;
const HAMILTONIAN_DEFAULT = 3;
const SUBSET_DEFAULT = [3, 5, 7, 2, 8];
const SUBSET_TARGET_DEFAULT = 10;

const Backtracking = () => {
  const [algo, setAlgo] = useState("nqueens");
  const [nQueens, setNQueensState] = useState(NQUEENS_DEFAULT);
  const [hamiltonianN, setHamiltonianN] = useState(HAMILTONIAN_DEFAULT);
  const [subsetNums, setSubsetNums] = useState(SUBSET_DEFAULT);
  const [subsetTarget, setSubsetTarget] = useState(SUBSET_TARGET_DEFAULT);
  const [board, setBoard] = useState(() => Array.from({ length: 4 }, () => new Array(4).fill(0)));
  const [subset, setSubset] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
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
    if (runMeta) recordRun({ structure: "backtracking", steps, ...runMeta });
  };

  const ui = { setBoard, setHighlight: setActiveCell, setSubset };

  const handleRun = () => {
    if (algo === "nqueens") {
      const steps = buildNQueensSteps(nQueens, ui);
      startRun(
        steps,
        () => setActiveCell(null),
        { before: { n: nQueens }, after: null, label: `N-Queens n = ${nQueens}` }
      );
      return;
    }
    if (algo === "sudoku") {
      const steps = buildSudokuSteps(ui);
      startRun(
        steps,
        () => setActiveCell(null),
        { before: "sudoku", after: null, label: "Mini Sudoku" }
      );
      return;
    }
    if (algo === "hamiltonian") {
      const steps = buildHamiltonianSteps(hamiltonianN, ui);
      startRun(
        steps,
        () => setActiveCell(null),
        {
          before: { n: hamiltonianN },
          after: null,
          label: `Hamiltonian Path n = ${hamiltonianN}`,
        }
      );
      return;
    }
    const steps = buildSubsetSumSteps(subsetNums, subsetTarget, ui);
    startRun(
      steps,
      () => setActiveCell(null),
      {
        before: { nums: [...subsetNums], target: subsetTarget },
        after: null,
        label: `Subset Sum target ${subsetTarget}`,
      }
    );
  };

  const handleAlgoChange = (next) => {
    if (next === algo || isAnimating) return;
    setAlgo(next);
    setRun(null);
    setActiveCell(null);
    setError(null);
  };

  const handleReset = () => {
    if (algo === "nqueens") {
      setBoard(Array.from({ length: nQueens }, () => new Array(nQueens).fill(0)));
    } else if (algo === "hamiltonian") {
      setBoard(Array.from({ length: hamiltonianN }, () => new Array(hamiltonianN).fill(0)));
    } else if (algo === "subset") {
      setSubset([]);
    }
    setActiveCell(null);
    setRun(null);
    setError(null);
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure !== "backtracking") return;
    const before = runEntry.before;
    if (!before || typeof before !== "object") return;
    if (algo === "nqueens" && before.n) {
      setNQueensState(before.n);
      setBoard(Array.from({ length: before.n }, () => new Array(before.n).fill(0)));
    } else if (algo === "hamiltonian" && before.n) {
      setHamiltonianN(before.n);
      setBoard(Array.from({ length: before.n }, () => new Array(before.n).fill(0)));
    } else if (algo === "subset" && Array.isArray(before.nums)) {
      setSubsetNums([...before.nums]);
      setSubsetTarget(before.target ?? SUBSET_TARGET_DEFAULT);
    }
    handleReset();
  };

  const isN = algo === "nqueens";
  const isH = algo === "hamiltonian";
  const isSubset = algo === "subset";
  const pinnedBoard = board;

  const givenFlags = isN || isH ? null : SUDOKU_PUZZLE.map((r) => r.map((c) => c !== 0));

  return (
    <div className="backtracking-page" ref={containerRef}>
      <h1>Backtracking Visualizer</h1>
      <p className="page-tagline">
        Try a move, and when it dead-ends, undo it — systematically.
      </p>

      <AlgoOverview
        title="Backtracking"
        what="Backtracking searches by extending a partial solution one step at a time; when a placement makes the remaining problem impossible, it undoes the last move and tries the next option."
        time="exponential worst case"
        space="O(n) recursion depth"
        when="constraint problems with a natural 'move → check → undo' loop: n-Queens, Sudoku, maze solving, permutations and subsets."
        note="Dead-end rows and cells flash red as the search unwinds and retries."
      />

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Search space</h2>

          <ShareButton
            structure="backtracking"
            values={isN ? [nQueens] : isH ? [hamiltonianN] : isSubset ? [...subsetNums, subsetTarget] : ["sudoku"]}
          />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
          </div>

          {isN || isH ? (
            <div
              className={`grid-board ${isN ? "nqueens" : "hamiltonian"}`}
              style={{ "--n": isN ? nQueens : hamiltonianN }}
            >
              {pinnedBoard.map((row, r) =>
                row.map((cell, c) => {
                  const trying =
                    activeCell && activeCell[0] === r && activeCell[1] === c;
                  if (isN) {
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`board-cell${cell ? " queen" : ""}${trying ? " trying" : ""}`}
                      >
                        {cell ? "♛" : ""}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`board-cell${cell ? " visited" : ""}${trying ? " trying" : ""}${
                        isH && cell > 0 ? " step" : ""
                      }`}
                    >
                      {isH && cell > 0 ? cell : ""}
                    </div>
                  );
                })
              )}
            </div>
          ) : isSubset ? (
            <div className="subset-chips">
              {subsetNums.map((v, i) => {
                const taken = subset.includes(v);
                return (
                  <div
                    key={i}
                    className={`subset-chip${taken ? " taken" : ""}${
                      activeCell === i ? " trying" : ""
                    }`}
                  >
                    {v}
                  </div>
                );
              })}
              <div className="subset-target">target {subsetTarget}</div>
            </div>
          ) : (
            pinnedBoard.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`board-cell${givenFlags[r][c] ? " given" : ""}${
                    activeCell && activeCell[0] === r && activeCell[1] === c ? " trying" : ""
                  }`}
                >
                  {cell === 0 ? "" : cell}
                </div>
              ))
            )
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`backtracking:${algo}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={BACKTRACKING_PSEUDOCODE[algo]}
            />
          )}
        </div>

        <div className="controls-area">
          <h2>Backtracking</h2>

          <ErrorMessage message={error} />

          <TabNavigation tabs={TABS} activeTab={algo} onTabChange={handleAlgoChange} disabled={isAnimating} />

          {isN && (
            <div className="input-group">
              <label>Board size (n):</label>
              <select
                value={nQueens}
                onChange={(e) => {
                  if (isAnimating) return;
                  const next = parseInt(e.target.value, 10);
                  setNQueensState(next);
                  setBoard(Array.from({ length: next }, () => new Array(next).fill(0)));
                  setRun(null);
                }}
                disabled={isAnimating}
              >
                {[4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} × {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isH && (
            <div className="input-group">
              <label>Grid size (n):</label>
              <select
                value={hamiltonianN}
                onChange={(e) => {
                  if (isAnimating) return;
                  const next = parseInt(e.target.value, 10);
                  setHamiltonianN(next);
                  setBoard(Array.from({ length: next }, () => new Array(next).fill(0)));
                  setRun(null);
                }}
                disabled={isAnimating}
              >
                {[3, 5, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} × {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isSubset && (
            <>
              <div className="input-group">
                <label>Numbers (comma-separated):</label>
                <input
                  type="text"
                  value={subsetNums.join(", ")}
                  onChange={(e) => {
                    if (isAnimating) return;
                    const parsed = e.target.value
                      .split(",")
                      .map((s) => parseInt(s.trim(), 10))
                      .filter((v) => Number.isFinite(v));
                    setSubsetNums(parsed.length ? parsed : SUBSET_DEFAULT);
                    setRun(null);
                  }}
                  disabled={isAnimating}
                />
              </div>
              <div className="input-group">
                <label>Target sum:</label>
                <input
                  type="number"
                  value={subsetTarget}
                  onChange={(e) => {
                    if (isAnimating) return;
                    setSubsetTarget(parseInt(e.target.value, 10) || 0);
                    setRun(null);
                  }}
                  disabled={isAnimating}
                />
              </div>
            </>
          )}

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {BUTTON_LABEL[algo]}
            </button>
          </form>

          <ComplexityInfo
            operationName={COMPLEXITY[algo].operationName}
            complexity={COMPLEXITY[algo].complexity}
            explanation={COMPLEXITY[algo].explanation}
          />

          <PropertyDisplay
            title="Run Properties"
            properties={[
              {
                name: isN ? "Board" : isH ? "Cells" : isSubset ? "Subset" : "Filled",
                value: isN
                  ? `${board.reduce((acc, row) => acc + row.filter(Boolean).length, 0)} / ${nQueens} queens`
                  : isH
                    ? `${board.flat().filter((c) => c !== 0).length} / ${hamiltonianN * hamiltonianN} cells visited`
                    : isSubset
                      ? `subset sum ${subset.reduce((a, b) => a + b, 0)} / target ${subsetTarget}`
                      : `${board.flat().filter((c) => c !== 0).length} / 16 cells`,
              },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("backtracking")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default Backtracking;
