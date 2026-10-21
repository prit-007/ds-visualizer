import {
  buildNQueensSteps,
  buildSudokuSteps,
  buildHamiltonianSteps,
  buildSubsetSumSteps,
} from './backtrackingSteps';

const makeUi = () => ({
  setBoard: vi.fn(),
  setHighlight: vi.fn(),
  setHighlight2: vi.fn(),
  setSubset: vi.fn(),
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

describe('buildHamiltonianSteps', () => {
  test('walks a 3x3 grid corner to corner visiting every cell once', () => {
    const ui = makeUi();
    const steps = buildHamiltonianSteps(3, ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Starting Hamiltonian path search — visit all 9 cells on 3×3 grid');
    expect(d).toContain('Trying (1,0)');
    expect(d).toContain('Visiting (1,0)');
    expect(d).toContain('Trying (2,0)');
    expect(d).toContain('Visiting (2,2)');
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Hamiltonian path found — 9 cells visited');
    expect(last.kind).toBe('found');

    runAll(steps);
    expect(ui.setBoard).toHaveBeenCalled();
    expect(ui.setHighlight).toHaveBeenCalled();
  });

  test('2x2 grid corner to corner has no Hamiltonian path — reported honestly', () => {
    const ui = makeUi();
    const steps = buildHamiltonianSteps(2, ui);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('No Hamiltonian path exists on 2×2 grid');
    expect(last.kind).toBe('error');
  });

  test('every step maps into the listing range', () => {
    buildHamiltonianSteps(3, makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(12);
    });
  });

  test('the found path visits every cell exactly once and ends at the goal', () => {
    const steps = buildHamiltonianSteps(5, makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Hamiltonian path found — 25 cells visited');
    expect(last.kind).toBe('found');
    const path = last.vars.path;
    expect(path).toHaveLength(25);
    expect(path[0]).toEqual([0, 0]);
    expect(path[24]).toEqual([4, 4]);
    const seen = new Set(path.map((p) => `${p[0]},${p[1]}`));
    expect(seen.size).toBe(25);
  });
});

describe('buildSubsetSumSteps', () => {
  test('finds a subset that sums to the target', () => {
    const ui = makeUi();
    const steps = buildSubsetSumSteps([3, 5, 7, 2, 8], 10, ui);
    const d = descriptions(steps);

    expect(d[0]).toBe('Starting subset sum search — [3, 5, 7, 2, 8] target 10');
    expect(d).toContain('Trying include 3 (remaining 7)');
    expect(d).toContain('Taking 3 → remaining 7');
    expect(d).toContain('Trying include 5 (remaining 2)');
    expect(d).toContain('Taking 5 → remaining 2');
    expect(d).toContain('7 exceeds remaining 2 — skipping 7');
    expect(d).toContain('Trying include 2 (remaining 0)');
    expect(d).toContain('Taking 2 → remaining 0');
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Subset found: [3, 5, 2] sums to 10');
    expect(last.kind).toBe('found');
    expect(last.vars.subset).toEqual([3, 5, 2]);

    runAll(steps);
    expect(ui.setSubset).toHaveBeenCalled();
  });

  test('no subset reaches the target — honest failure', () => {
    const ui = makeUi();
    const steps = buildSubsetSumSteps([1, 2, 4], 100, ui);
    const last = steps[steps.length - 1];
    expect(last.description).toBe('No subset of [1, 2, 4] sums to 100');
    expect(last.kind).toBe('error');
  });

  test('every step maps into the listing range', () => {
    buildSubsetSumSteps([3, 5, 7], 8, makeUi()).forEach((s) => {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(10);
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
