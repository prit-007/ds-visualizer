import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import AlgoOverview from "../components/AlgoOverview";
import {
  buildNQueensSteps,
  buildSudokuSteps,
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
];

const BUTTON_LABEL = { nqueens: "Run N-Queens", sudoku: "Run Sudoku" };

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
};

const NQUEENS_DEFAULT = 4;

const Backtracking = () => {
  const [algo, setAlgo] = useState("nqueens");
  const [nQueens, setNQueensState] = useState(NQUEENS_DEFAULT);
  const [board, setBoard] = useState(() => Array.from({ length: 4 }, () => new Array(4).fill(0)));
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

  const ui = { setBoard, setHighlight: setActiveCell };

  const handleRun = () => {
    const isN = algo === "nqueens";
    const steps = isN
      ? buildNQueensSteps(nQueens, ui)
      : buildSudokuSteps(ui);
    startRun(
      steps,
      () => {
        setActiveCell(null);
      },
      {
        before: isN ? { n: nQueens } : "sudoku",
        after: null,
        label: isN ? `N-Queens n = ${nQueens}` : "Mini Sudoku",
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
    setBoard(Array.from({ length: nQueens }, () => new Array(nQueens).fill(0)));
    setActiveCell(null);
    setRun(null);
    setError(null);
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure !== "backtracking") return;
    if (runEntry.before && typeof runEntry.before === "object" && runEntry.before.n) {
      const n = runEntry.before.n;
      setNQueensState(n);
      setBoard(Array.from({ length: n }, () => new Array(n).fill(0)));
      handleReset();
    }
  };

  const isN = algo === "nqueens";
  const pinnedBoard = board;

  const givenFlags = isN
    ? null
    : SUDOKU_PUZZLE.map((r) => r.map((c) => c !== 0));

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

          <ShareButton structure="backtracking" values={isN ? [nQueens] : ["sudoku"]} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
          </div>

          <div
            className={`grid-board ${isN ? "nqueens" : "sudoku"}`}
            style={isN ? ({ "--n": nQueens }) : undefined}
          >
            {isN
              ? board.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`board-cell${cell ? " queen" : ""}${
                        activeCell && activeCell[0] === r && activeCell[1] === c ? " trying" : ""
                      }`}
                    >
                      {cell ? "♛" : ""}
                    </div>
                  ))
                )
              : pinnedBoard.map((row, r) =>
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
                )}
          </div>

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
                  setNQueensState(parseInt(e.target.value, 10));
                  setBoard(Array.from({ length: parseInt(e.target.value, 10) }, () => new Array(parseInt(e.target.value, 10)).fill(0)));
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
                name: isN ? "Board" : "Filled",
                value: isN
                  ? `${board.reduce((acc, row) => acc + row.filter(Boolean).length, 0)} / ${nQueens} queens`
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
