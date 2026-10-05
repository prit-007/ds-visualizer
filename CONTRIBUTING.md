# Contributing to AlgoViz

Thanks for helping improve AlgoViz! This document covers setup, the
development workflow we actually follow, and the conventions that keep the
codebase testable.

## Development setup

```bash
git clone https://github.com/prit-007/ds-visualizer.git
cd ds-visualizer/pro
npm install
npm start          # http://localhost:3000
```

Everything lives under `pro/` — the repo root is docs/config only. **Never
run app commands from the repo root.**

## Verification chain (required before every PR)

```bash
cd pro
npm run lint       # ESLint — 0 errors, 0 warnings
npm run test:ci    # full suite, one-shot
npm run build      # production build (+ SPA 404 fallback)
```

All three must pass. The build does **not** run lint (Vite doesn't) — lint
is a separate step.

## TDD policy

We write the failing test first:

1. Write `*.test.js(x)` colocated next to the source file (Vitest discovers
   `src/**/*.test.{js,jsx}`).
2. Confirm it fails (`npx vitest run path/to/test`).
3. Implement just enough to make it green.
4. Re-run the full suite + lint + build.

### Algorithm code (`src/lib/`)

- Keep algorithm logic pure and framework-free so it is testable without
  rendering. Step builders return arrays of
  `{ description, action, kind?, line, vars? }` where `line` is 1-based into
  the matching pseudocode listing in `src/lib/pseudocode.js`.
- **Assert the generated `steps[]` arrays** (descriptions, kinds, line/vars
  pins, ui-callback sequences) — never animation timers.
- Actions must assign **absolute state** (full snapshots) so the player can
  safely replay steps 0..k when scrubbing. Capture loop variables in `const`s
  before pushing steps whose actions close over them (`no-loop-func`).
- Don't mutate inputs; builders simulate on a copy.

### Page code (`src/pages/`)

- Pages validate input, call a step builder with `{setState fns}`, and start
  a run via `startRun(steps, onComplete, runMeta?)` — the shared
  `OperationPlayer` executes each step's action and calls `onComplete` at the
  end.
- Operation forms use `<form onSubmit>` + `type="submit"` buttons so Enter
  works. **Tab labels and operation-button labels must be distinct**
  (`getByRole('button', {name})` ambiguity); tests click the tab first, then
  the button.
- Every page that holds data gets a **Reset / Clear** toolbar (`.data-actions`).
- Share links use `ShareButton` with optional `extra` fields; seeds read
  scenario hashes via `readScenario()`.

### Styling

- Two systems coexist: Tailwind utilities (heavy in `Layout`/`Home`) and
  per-page semantic CSS. Match the file you're in; no wholesale conversions.
- Design tokens live in `:root` / `.dark` in `src/index.css`
  (`--font-sans`, `--font-mono`, `--primary-color`, dark panel/input tokens).
  Prefer tokens over hardcoded hex.
- Animations: framer-motion for enter/exit, GSAP for imperative
  highlight/scale — no third library. Respect `isAnimating` (disable inputs
  while a run plays) and `prefers-reduced-motion`.

## Commits & PRs

- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `refactor:`
  with a short scope when helpful — e.g.
  `feat(sorting): merge, quick and heap sort on /sorting`.
- One feature per PR; include the RED→GREEN tests with the implementation.
- PR description: what changed, why, and how you verified
  (lint/test/build all green).
- Keep `AGENTS.md` truthful after behavior changes (counts, routes, contracts).

## Reporting bugs / requesting features

Open a GitHub issue with:

- What you did, what you expected, what happened
- Browser/OS if it looks layout- or animation-related
- A failing test snippet if you have one (best possible report)

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE) covering this project.
