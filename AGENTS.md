# AGENTS.md

React data-structure visualizer. **All app code lives in `pro/`** (Vite 8, migrated from Create React App). The repo root is not the app. Roadmap/checklist lives in `ROADMAP.md` — consult it before starting work.

## Repo shape (read first)

- Root `package.json` pins `framer-motion` only — no scripts, no source. Never run app commands from root.
- `pro/` = whole app: **Vite 8 + Vitest 4** (config: `pro/vite.config.mjs`), React 19, plain JS/JSX (**no TypeScript source**), Tailwind 3, `react-router-dom` 7, framer-motion + GSAP for animation.
- Git currently tracks only `.gitattributes`; root `package.json`/`package-lock.json` and all of `pro/` are untracked. `pro/node_modules`, `pro/build`, `pro/dist` are ignored via `pro/.gitignore`.
- No CI workflows, no pre-commit hooks, no Prettier config, no `.github/`.
- `pro/README.md` is the stock CRA README (stale — the app no longer uses CRA). Trust code.

## Commands (always run from `pro/`)

| Task | Command |
|---|---|
| Dev server (localhost:3000) | `cd pro && npm start` (alias: `npm run dev`) |
| All tests, one-shot | `cd pro && npm run test:ci` |
| Watch tests | `cd pro && npm test` |
| Single test file | `cd pro && npx vitest run src/lib/avl.test.js` |
| Lint (source of truth for warnings) | `cd pro && npm run lint` |
| Production build | `cd pro && npm run build` |

- `pro/node_modules` is installed and current — `npm install` only if you change `pro/package.json`.
- **Verification order: `npm run lint` → `npm run test:ci` → `npm run build`.** Build does **not** run lint (Vite doesn't); lint is a separate step.
- Lint runs ESLint 8 with `eslint-config-react-app` (config: `pro/package.json` → `eslintConfig`). Current state: **0 errors, 0 warnings** (Phase 3 cleared all 16). `eslintConfig` also declares `vi` as a global and disables `testing-library/no-container` + `no-node-access` **only** in `**/*.test.*` — appearance tests intentionally assert rendered structure (`querySelectorAll('.array-element')` etc.). Keep it that way; don't relax rules for source files.
- `typescript` is pinned to `^5.9` as a devDep **only** to keep `eslint-config-react-app`→`tsutils` working; installing TypeScript 7+ breaks `npm run lint` (missing `TypeFlags`). Remove only after dropping the react-app ESLint config.
- **JSX belongs in `.jsx` files only** — Vite/Rolldown refuses to parse JSX inside `.js` (this broke a test once; the test file is `App.test.jsx`, not `.js`).
- Build ≈ 30 s; dev server ready in ~2 s. Never `CI=true`-prefix anything — that was a CRA relic.

## Testing & TDD policy

Current state (verified): **`npm run test:ci` is green — 25 files, 223 tests, 0 unhandled errors.**

- `src/App.test.jsx` — hero + nav; **route-completeness contract**: every one of the 19 sidebar routes must render non-blank `<main>`, and every `<nav>` link must be a registered route.
- `src/lib/avl.test.js` — unit/property tests for the AVL core (rotations, delete cases, traversals incl. **`levelOrder`**, `nodeCount` invariants, `fast-check` property: sorted inorder + balance invariant) + **operation traces**: the optional `trace` param on `insert`/`deleteNode`/`minValueNode` records `created/compare/move/duplicate/recheck/rotate/replace/two-children/successor-descend/copy-successor/missing` events that `treeSteps` turns into narration. **These 24 trace tests are the contract for the `avl.js` refactor — event order/shape must stay byte-identical.**
- `src/lib/{treeSteps,arraySteps,linkedListSteps}.test.js` — assert exact `steps[]` descriptions + the ui-callback call sequences (incl. the missing-search-must-not-throw regression) **plus a `pseudocode lines and variable watch` describe** that pins `step.line`/`step.vars` against `src/lib/pseudocode.js`. Builders: `buildInsertSteps(trace, value, ui)` / `buildDeleteSteps(trace, value, ui)` (trace-first), `buildSearchSteps(root, value, ui)`, `buildTraversalSteps(root, type, ui)` (types: `preOrder`/`inOrder`/`postOrder`/`levelOrder`); array/list builders take `(items, value|pos, ui)` and narrate per-index shifts / pointer hops.
- `src/lib/treeLayout.test.js` — pure coordinate layout: in-order slotting, constant depth spacing, edge endpoints trimmed to `NODE_RADIUS`, bounds, height/balance metadata.
- `src/pages/*.test.jsx` — page tests: TreeVisualizer smoke + **tree canvas rendering** (slots/edges/badges/edge states via fake timers + CSS contract) + **traversal controls** (4 buttons incl. Level-order, BFS chips, CSS contract) + memory + presets + dual-pane; Array/LinkedList tab switching, **appearance with 12 elements** (values/indices/memory cells/pointers + CSS `flex-wrap` contract), and **empty-state behavior** (message, sane placeholder, guided error, insert-at-0 still works). Page tests that drive a run use the module-scope `finishRun()`/`advance(n)` fake-timer helpers (each 1000 ms round advances one step; React only creates the next timer after the `act()` flush).
- `src/pages/{Home,ComingSoon}.test.jsx`, `src/components/{TabNavigation,OperationPlayer,ErrorMessage,ComplexityInfo,PropertyDisplay,CodePane,CasePresets,MemoryRepresentation,ElementNode,Layout}.test.jsx` — `OperationPlayer.test.jsx` uses **fake timers** (`vi.useFakeTimers`) to drive play/pause/step/speed/scrub/keyboard + the stale-steps clamp regression.
- `src/index.css.test.js`, `src/tailwind.config.test.js` — contract tests over design tokens (incl. `--kind-*` vars) and the tailwind scales.

Policy for new work:

- Write the failing test first; colocate `*.test.js(x)` beside the source file (Vitest discovers `src/**/*.test.{js,jsx}`).
- Keep algorithm logic in `src/lib/` so it is testable without rendering. **Extracted already:** `avl.js`, `treeSteps.js`, `arraySteps.js`, `linkedListSteps.js`, `treeLayout.js`, `pseudocode.js`, `presets.js`, `motionPrefs.js` — pages only validate input, call a builder with `{setState fns}`, and start a run: `startRun(steps, onComplete)` renders the shared `OperationPlayer`, which executes each step's action and calls `onComplete` at the end (pages' `isAnimating` follows the player's `onPlayStateChange`).
- Test animation logic by asserting the generated `steps[]` arrays (`{description, action, kind?, line, vars?}` objects — `line` is 1-based into `pseudocode.js`, `vars` feeds the variable watch), never by waiting on GSAP/framer timers.
- **GSAP must be mocked in any test that renders Array/LinkedList/Tree-with-nodes** (`vi.mock('gsap', () => ({ gsap: { to: vi.fn(), ... } }))`): GSAP's transform parser throws on framer-motion's inline `scale(0)` under jsdom (unhandled errors fail the run even when tests pass).
- Page tests: `render` + `screen` (+ `MemoryRouter` if a page uses `Link`); jest-dom matchers loaded in `setupTests.js` (wired via `test.setupFiles` in `vite.config.mjs`).
- Reading a file's raw text in a test: bind `import.meta.url` to a variable before `new URL(...)` — Vite rewrites inline `new URL(x, import.meta.url)` against the dev-server origin. Also `?raw` imports of CSS come back empty under Vitest's CSS handling; use `readFileSync(fileURLToPath(...))`.

### Bugs found & fixed in the step builders (don't reintroduce)

- Insert/delete/search step actions closed over the mutated `current` loop variable → every animated step reported the **final** node instead of its own; ESLint `no-loop-func` flagged all 12. Fixed by capturing per-iteration primitives in `src/lib/treeSteps.js`.
- The inline search builder let `current` end as `null` and then dereferenced `current.value` during animation → `TypeError` on a missing search value. Regression test: `runAll(buildSearchSteps(...))` must not throw.
- Remove-at on an empty array/list produced `Enter position (0--1)` + `Position must be between 0 and -1`. Now: `.empty-state` message, plain `Enter position` placeholder, and `Array/List is empty — add ... first` error.

### Bugs found & fixed in the AVL core (don't reintroduce)

- The inline class defined `getHeight` **twice**; the zero-arg duplicate made every height query recurse infinitely → the `/tree` page crashed on mount. Now one non-recursive `getHeight(node)` in `src/lib/avl.js`.
- `deleteNode` called `this.updateHeight(root)`, a method that existed only on nodes → every delete threw `TypeError`. Now `root.updateHeight()`.

### Bugs found & fixed in the player / pseudocode work (don't reintroduce)

- **`OperationPlayer` stale-step crash**: a new, shorter `steps` array re-rendered the player while `currentStep` still pointed past its end (the reset effect runs *after* render) → `steps[currentStep].kind` threw `TypeError`. Fixed with a render-time clamp (`stepIndex = Math.min(currentStep, steps.length - 1)`). Regression: "rerendering with a shorter step list after finishing stays in bounds".
- Pseudocode line mapping for `remove` pos=1 must include the line-7 advance step even when `pos - 1 === 0` (zero hops) — `linkedListSteps` emits `Advancing cur to position 0 (already there)`; the old test asserted 5 steps and was updated to the faithful 6.
- A test premise bug (not product): `tracedInsert([50,30,20], 10)` never rotates — building `[50,30,20]` **already** rotates (LL at 50 → root 30), so inserting 10 afterwards is balanced. Use `[50,30]` to exercise the LL rotation during the traced insert.

## Architecture

- Entry: `pro/index.html` → `src/index.jsx` → `src/App.jsx` → react-router v7 `<Routes>`; every route nested under `<Route path="/" element={<Layout />}>`.
- `src/lib/avl.js` = pure AVL implementation (`AVLNode`, `AVLTree`) with optional `trace` recording; refactored around `emit`/`recheck`/`rebalanceAfterInsert`/`rebalanceAfterDelete` helpers (the pre-in/post traversals share one `traverse` core; `levelOrder` is queue-based). `src/lib/{treeSteps,arraySteps,linkedListSteps}.js` = pure step builders returning `[{description, action, kind?, line, vars?}]`.
- `src/lib/treeLayout.js` = pure coordinate layout (`layoutTree(root)` → `{nodes, edges, width, height}`: in-order slot × `H_GAP`, depth × `V_GAP`, edge endpoints trimmed to `NODE_RADIUS`); `src/lib/pseudocode.js` = the listings (`ARRAY_PSEUDOCODE` / `LINKED_LIST_PSEUDOCODE` / `TREE_PSEUDOCODE`, keys `add|insert|remove`, `insert|delete|search`, `traversal-<type>`).
- `src/components/OperationPlayer.jsx` = the step player all three pages render (internal `currentStep/isPlaying/speed`; absolute-state actions make `seek(0..k)` replay idempotent; keyboard Space/←/→ ignored when focus is in an input/button; `pseudocode` prop renders the `CodePane` dual pane; render-time `stepIndex` clamp guards short-step rerenders).
- `src/components/Layout.jsx` = sidebar shell + `<Outlet>`; Sun/Moon dark-mode toggle (`aria-pressed`, localStorage `theme`, `documentElement.classList.toggle('dark')`).
- `src/pages/` = one page per structure. **CSS gotcha:** there is no `ArrayVisualizer.css` (deleted) — array styles live in `src/index.css`; LinkedList/Tree have their own page CSS. `:root` design tokens (`--primary-color`, `--kind-compare/move/found/error` etc.) are defined at the top of `index.css` — `ElementNode` and `TreeVisualizer.css` depend on them; don't remove.
- **Tree rendering (Phase 4 overhaul):** `TreeVisualizer.jsx` no longer has the recursive `renderTree` — it maps `layoutTree(treeRoot)` into an absolutely positioned `.tree-canvas` (SVG `path.tree-edge` cubic connectors with `tree-edge-active/highlighted/removing` states + `.tree-node-slot` per `ElementNode`, badge `h:<height> bf:<balance>`). `TreeVisualizer.css` owns the canvas, node circle and the traversal pill group/result chips (there is no `.btn`/`.traversal-*` styling in `index.css`).
- `src/pages/ComingSoon.jsx` = placeholder page (`title` prop) — all 15 unimplemented sidebar routes point at it.
- `src/visualizations/` = decorative components used only by `src/pages/Home.jsx`.
- Route rule: every sidebar `Link to` in `Layout.jsx` must have a matching `<Route>` in `App.jsx` — enforced by `App.test.jsx` ("route completeness" + "sidebar links ⊆ registered routes"). Adding a nav link without a route fails tests.

## Reusable components

- Shared set: `Layout`, `TabNavigation`, `OperationPlayer`, `ErrorMessage`, `PropertyDisplay`, `ComplexityInfo`, `ElementNode`, `CodePane`, `CasePresets`, `MemoryRepresentation` — **all three visualizer pages now use `TabNavigation` + `OperationPlayer` + `ErrorMessage` + `CasePresets` + `MemoryRepresentation`**; Array renders `ElementNode` (with `className="array-element"`), Tree renders it as `.tree-node` inside `.tree-node-slot`s.
- `ArrayVisualizer.jsx` and `LinkedListVisualizer.jsx` no longer reimplement the tab bar, error banner or step player (the local `OperationVisualizer`s, `runAnimation`, and `OperationSteps` are gone). **Still local:** `LinkedListNode`/`LinkedListPointer` markup in `LinkedListVisualizer.jsx` — deferring ElementNode there because its `.node-value`/`.node-index` spans are asserted by both `LinkedListVisualizer.css` and the appearance test (coordinated rename needed).
- `MemoryBlock.jsx` was revived as `MemoryRepresentation` (Phase 4): wrapper `.memory-representation > h3 + .memory-blocks`, `pointers` prop rows (Array addresses `0x100+`, List `0x2000+`, Tree `0x3000+`); the original `MemoryBlock.jsx` file remains only for Phase 6's layout/toggle work.
- `ElementNode` pairs framer-motion (enter/exit) with GSAP `useEffect` tweens — that pairing is the house style; don't introduce a third animation library.
- Data model: linked-list "nodes" are plain `{id, value}` — no pointers, operations are index-based. All values are integers (`type="number"` + `parseInt`).

## UI/UX change policy

- Two styling systems coexist: Tailwind utilities (heavy in `Layout.jsx` / `Home.jsx`) and per-page semantic CSS classes. Match the file you're in; no wholesale conversions.
- **`pro/postcss.config.js` is live now** (Vite reads it; CRA used to ignore it). It loads `tailwindcss` + `autoprefixer` — edit it if you change the PostCSS pipeline. Tailwind classes are scanned only under `src/` (content glob `./src/**/*.{js,jsx,ts,tsx}`).
- Animations: framer-motion for enter/exit/`AnimatePresence`, GSAP for imperative highlight/scale. Respect `isAnimating` — operation buttons and tabs disable while an animation runs; keep that convention.
- Every operation follows: input → button → animated `steps` (`description` strings) → complexity panel. Keep new ops consistent.
- `jsx-a11y` is enforced — `<a href="#"` fails lint; use `<Link>` or `<button>`.

## Data structures — what exists (verified)

| Route | Page | Implemented operations |
|---|---|---|
| `/array` | `ArrayVisualizer` | push (add), insert-at, remove-at |
| `/linked-list` | `LinkedListVisualizer` | add, insert-at, remove-at (visual singly linked list) |
| `/tree` | `TreeVisualizer` | AVL (`src/lib/avl.js`): insert, delete, search, pre/in/post-order **and level-order** traversal; coordinate canvas with SVG edges + h/bf badges; traversal pill group + BFS result chips |
| `/` | `Home` | hero + decorative `SortingVisualization` / `TreeVisualization` (static; CTAs `<Link>` to `/sorting` and `/tree`) |

Sidebar also advertises stack/queue, graph, hash table, sorting, searching, graph algos, DP, greedy, practice tracks — **none implemented**; every one of those 15 routes renders `ComingSoon` (placeholder with links back to the three real pages).

## Checklist

Kept in `ROADMAP.md` (phases with checkboxes). Summary:

### What has been done
- CRA → **Vite 8 + Vitest 4** migration (tests were red under CRA's Jest 27 — resolved)
- Test suite green: **223 tests / 25 files** (AVL + trace tests, step-builder units incl. traversal narration + pseudocode line/vars contracts, treeLayout units, route contract, appearance/empty-state, tree canvas/traversal, page + component tests incl. fake-timer OperationPlayer)
- All step logic extracted to `src/lib/` (`avl.js`, `treeSteps.js`, `arraySteps.js`, `linkedListSteps.js`, `treeLayout.js`, `pseudocode.js`, `presets.js`, `motionPrefs.js`); fixed 2 AVL crash bugs + 3 step-builder bugs (loop-closure highlighting, search null deref, empty-state `0--1`) + 1 player bug (stale-step clamp)
- Node-by-node narration: AVL trace events → per-node compare/move/recheck/rotate steps; traversal backtrack steps; per-index array shifts; linked-list pointer hops
- Lint: **0 errors, 0 warnings** (was 16 warnings); all 19 sidebar routes registered (`ComingSoon`); Home CTAs are real `<Link>`s
- **Phase 3 complete**: shared `OperationPlayer` (play/pause/step/speed/scrub/keyboard), all three pages on `TabNavigation` + `ErrorMessage` + player, Array on `ElementNode`, `:root` design tokens, dead files removed (`App.css`, `logo.svg`, `ArrayVisualizer.css`, `OperationSteps`)
- **Phase 4 complete**: tailwind scales + semantic `kind` colors, dark mode w/ persisted toggle, dual-pane pseudocode (`pseudocode.js` + `CodePane` + `line`/`vars` on every step, wired on all pages), `aria-live` narration, reduced-motion support, case presets, shared shell (`MemoryRepresentation`/`.info-panel`), **tree coordinate-canvas overhaul** (`treeLayout.js` + SVG edges + h/bf badges + edge states), **traversal controls** (styled pill group, BFS result chips, **level-order** end-to-end), **`avl.js` refactor** (`emit`/`recheck`/rebalance helpers, `traverse` core, `levelOrder`, nodeCount invariants — trace shapes unchanged)
- Array, linked-list, AVL-tree visualizers with animated step playback + complexity panels; empty-state + >10-element appearance covered by tests

### What should be done (see ROADMAP.md for detail/order)
1. Phase 5: learning layer (lessons, prediction mode, progress)
2. Phase 6/7: differentiators (time-travel, complexity lab, story↔memory toggle) + new structures + real sorting/searching pages
3. Deferred cleanup: LinkedList node markup → ElementNode (needs coordinated CSS + test selector rename)
