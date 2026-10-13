// Pure step builders for the backtracking page: n-Queens and a 4x4
// mini-Sudoku. Both narrate try/place/backtrack with absolute-state
// actions (setBoard carries grid snapshots so the canvas animates).

export const buildNQueensSteps = (n, ui) => {
  const queens = [];
  const steps = [];
  const cols = new Set();
  const diag1 = new Set(); // r - c
  const diag2 = new Set(); // r + c

  const boardNow = () =>
    Array.from({ length: n }, (_, r) => {
      const row = new Array(n).fill(0);
      if (queens[r] !== undefined) row[queens[r]] = 1;
      return row;
    });

  const emit = (description, kind, line, vars) => {
    steps.push({
      description,
      kind,
      line,
      vars,
      action: () => {
        ui.setBoard?.(boardNow());
        ui.setHighlight?.(vars.queen ?? null);
      },
    });
  };

  const safe = (r, c) => !cols.has(c) && !diag1.has(r - c) && !diag2.has(r + c);

  steps.push({
    description: `Solving n-Queens for n = ${n}`,
    kind: 'move',
    line: 1,
    vars: { n },
    action: () => {
      ui.setBoard?.(Array.from({ length: n }, () => new Array(n).fill(0)));
      ui.setHighlight?.(null);
    },
  });

  const place = (r, c) => {
    queens[r] = c;
    cols.add(c);
    diag1.add(r - c);
    diag2.add(r + c);
  };
  const unplace = (r, c) => {
    queens[r] = undefined;
    cols.delete(c);
    diag1.delete(r - c);
    diag2.delete(r + c);
  };

  const solve = (row) => {
    if (row === n) {
      steps.push({
        description: `Solution found — queens in columns ${queens.join(', ')}`,
        kind: 'found',
        line: 8,
        vars: { queens: [...queens] },
        action: () => {
          ui.setBoard?.(boardNow());
          ui.setHighlight?.(null);
        },
      });
      return true;
    }
    for (let c = 0; c < n; c += 1) {
      emit(`Trying row ${row}, column ${c}`, 'compare', 2, {
        row,
        c,
        queen: [row, c],
      });
      if (safe(row, c)) {
        place(row, c);
        emit(`Placing queen at (${row},${c}) — no conflicts`, 'move', 3, {
          queen: [row, c],
        });
        if (solve(row + 1)) return true;
        unplace(row, c);
        emit(`Queen at (${row},${c}) leads nowhere — backtracking`, 'error', 6, {
          row,
          c,
        });
      } else {
        emit(`Square (${row},${c}) is attacked — skipped`, 'compare', 4, {
          row,
          c,
          queen: [row, c],
        });
      }
    }
    emit(`Row ${row} has no safe square — backtracking`, 'error', 7, { row });
    return false;
  };

  if (!solve(0)) {
    steps.push({
      description: `No solution exists for n = ${n}`,
      kind: 'error',
      line: 8,
      vars: { n },
      action: () => {
        ui.setBoard?.(Array.from({ length: n }, () => new Array(n).fill(0)));
        ui.setHighlight?.(null);
      },
    });
  }

  return steps;
};

// ---- Sudoku (4x4 mini) ----

export const SUDOKU_PUZZLE = [
  [1, 0, 0, 4],
  [3, 0, 0, 2],
  [0, 0, 0, 0],
  [0, 3, 0, 0],
];

const digitValid = (board, r, c, v) => {
  for (let i = 0; i < 4; i += 1) {
    if (board[r][i] === v || board[i][c] === v) return false;
  }
  const br = Math.floor(r / 2) * 2;
  const bc = Math.floor(c / 2) * 2;
  for (let dr = 0; dr < 2; dr += 1) {
    for (let dc = 0; dc < 2; dc += 1) {
      if (board[br + dr][bc + dc] === v) return false;
    }
  }
  return true;
};

export const buildSudokuSteps = (ui, board = null) => {
  const grid = (board ?? SUDOKU_PUZZLE).map((r) => [...r]);
  const given = grid.map((row) => row.map((c) => c !== 0));
  const steps = [];

  steps.push({
    description: 'Solving 4×4 Sudoku — filling empty cells with backtracking',
    kind: 'move',
    line: 1,
    vars: {},
    action: () => {
      ui.setBoard?.(grid.map((r) => [...r]));
      ui.setHighlight?.([-1, -1]);
      ui.setHighlight2?.(null);
    },
  });

  const emptyCells = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (!given[r][c]) emptyCells.push([r, c]);
    }
  }

  const snap = () => grid.map((row) => [...row]);

  let idx = 0;
  let backtracked = false;
  const roundCap = 400;
  let rounds = 0;

  while (idx < emptyCells.length && rounds < roundCap) {
    rounds += 1;
    const [r, c] = emptyCells[idx];
    const cur = grid[r][c];
    let v = cur + 1;
    let placedHere = false;
    while (v <= 4) {
      steps.push({
        description: `Trying cell (${r},${c}) = ${v}`,
        kind: 'compare',
        line: 3,
        vars: { r, c, v },
        action: () => {
          ui.setBoard?.(snap());
          ui.setHighlight?.([r, c]);
        },
      });
      if (digitValid(grid, r, c, v)) {
        grid[r][c] = v;
        const s = snap();
        steps.push({
          description: `Placing (${r},${c}) = ${v}`,
          kind: 'move',
          line: 4,
          vars: { r, c, v },
          action: () => {
            ui.setBoard?.(s);
            ui.setHighlight?.([r, c]);
          },
        });
        placedHere = true;
        break;
      }
      steps.push({
        description: `Digit ${v} conflicts in row/col/box — skipped`,
        kind: 'compare',
        line: 5,
        vars: { r, c, v },
        action: () => {
          ui.setBoard?.(snap());
          ui.setHighlight?.([r, c]);
        },
      });
      v += 1;
    }
    if (placedHere) {
      idx += 1;
    } else {
      backtracked = true;
      grid[r][c] = 0;
      steps.push({
        description: `Cell (${r},${c}) exhausted — backtracking to previous empty cell`,
        kind: 'error',
        line: 6,
        vars: { r, c },
        action: () => {
          ui.setBoard?.(snap());
          ui.setHighlight?.([r, c]);
        },
      });
      idx -= 1;
    }
  }

  steps.push({
    description: 'Sudoku solved — grid complete',
    kind: 'found',
    line: 8,
    vars: { board: grid.map((row) => [...row]), backtracked },
    action: () => {
      ui.setBoard?.(grid.map((row) => [...row]));
      ui.setHighlight?.(null);
    },
  });

  return steps;
};
