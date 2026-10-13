import { buildNQueensSteps, buildSudokuSteps } from './backtrackingSteps';

const makeUi = () => ({
  setBoard: vi.fn(),
  setHighlight: vi.fn(),
  setHighlight2: vi.fn(),
});

const descriptions = (steps) => steps.map((s) => s.description);

const runAll = (steps) => steps.forEach((s) => s.action?.());

describe('buildNQueensSteps', () => {
  test('places queens row by row, backtracks on conflict, finds the solution', () => {
    const ui = makeUi();
    const steps = buildNQueensSteps(4, ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Solving n-Queens for n = 4');
    expect(d).toContain('Trying row 0, column 0');
    expect(d).toContain('Placing queen at (1,2) — no conflicts');
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Solution found — queens in columns 1, 3, 0, 2');
    expect(last.kind).toBe('found');
    runAll(steps);
    expect(ui.setHighlight).toHaveBeenCalled();
    expect(ui.setBoard).toHaveBeenCalled();
  });

  test('n = 3 has no solution and says so honestly', () => {
    const ui = makeUi();
    const steps = buildNQueensSteps(3, ui);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('No solution exists for n = 3');
    expect(last.kind).toBe('error');
  });

  test('every step maps into the listing range', () => {
    buildNQueensSteps(4, makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(9);
    });
  });
});

describe('buildSudokuSteps', () => {
  test('backtracks a wrong guess then solves the mini grid', () => {
    const ui = makeUi();
    const steps = buildSudokuSteps(ui);
    const d = descriptions(steps);

    expect(d.some((s) => s.includes('backtracking'))).toBe(true);

    const last = steps[steps.length - 1];
    expect(last.description).toBe('Sudoku solved — grid complete');
    expect(last.kind).toBe('found');

    // the solved board is valid 4x4 (rows/cols/boxes each contain 1-4)
    const { board } = last.vars;
    for (let r = 0; r < 4; r += 1) {
      expect(new Set(board[r]).size).toBe(4);
    }
    const colsValid = board.map((_, c) => new Set(board.map((row) => row[c])).size === 4);
    expect(colsValid.every(Boolean)).toBe(true);
    const boxIds = [];
    board.forEach((row, r) =>
      row.forEach((v, c) => boxIds.push(`${Math.floor(r / 2)}-${Math.floor(c / 2)}-${v}`))
    );
    expect(new Set(boxIds).size).toBe(16);
  });
});
