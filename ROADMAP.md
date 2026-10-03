# ROADMAP.md — DS Visualizer → DSA Learning System

Goal: turn the current 3-page demo into a browser-only data-structure learning system.
Constraints: **frontend only, no DB, no backend, no runtime network.** Persistence = `localStorage` + URL hash.
Status legend: `[ ]` todo, `[~]` in progress, `[x]` done.
(This file is intentionally left uncommitted until explicitly told otherwise.)

## Phase 1 — Toolchain: CRA → Vite + Vitest `[x]` (verified)

Why: Create React App is deprecated (react.dev, Feb 2025) and unmaintained; its bundled Jest 27 could not resolve `react-router-dom@7`, so tests were permanently red. Builds took 4–6 min.

- [x] `pro/vite.config.mjs` — `@vitejs/plugin-react-swc`, Vitest 4 (jsdom, `setupTests.js`), port 3000
- [x] `pro/index.html` at project root (dropped `%PUBLIC_URL%` and the stray `/src/index.css` link; module entry added)
- [x] Scripts: `start`/`dev`, `build`, `preview`, `test`, `test:ci`, `lint`
- [x] Removed `react-scripts`; added `vite`, `@vitejs/plugin-react-swc`, `vitest`, `jsdom`, `eslint@8` + `eslint-config-react-app`, `typescript@^5.9` (pin required by config's `tsutils`; TS 7 breaks lint)
- [x] Rewrote the CRA boilerplate test → `src/App.test.jsx` (renamed: Vite refuses JSX in `.js`)
- [x] Verified: `npm run lint` 0 err/16 warn, `npm run test:ci` green, `npm run build` ~30 s, dev server HTTP 200 in ~2 s
- [x] AGENTS.md updated to match

## Phase 2 — Testable core (`src/lib/`) `[x]` (verified)

- [x] Extracted AVL ops (`AVLNode`, `AVLTree`) from `TreeVisualizer.jsx` → `src/lib/avl.js`
- [x] Unit tests `src/lib/avl.test.js` (19 tests): 4 rotation cases, delete leaf/one-child/two-child/missing, search, traversals, height utilities
- [x] Property test with `fast-check` (MIT): random insert sequences → inorder = sorted input, every node balanced, nodeCount correct
- [x] Page smoke tests `src/pages/TreeVisualizer.test.jsx` — **these caught two real crash bugs** (see below)
- [x] Command order documented in AGENTS.md: `lint → test → build`
- [x] Extract Array / LinkedList / Tree step builders → `src/lib/{arraySteps,linkedListSteps,treeSteps}.js` with unit tests (done in Phase 3; see below)

### Bugs found & fixed in Phase 2 (regression-tested now)

- [x] Inline AVL class defined `getHeight` twice; the later zero-arg definition made every call recurse infinitely → **`/tree` crashed on mount** (`RangeError`, caught by page smoke test). Fixed: single non-recursive `getHeight(node)`.
- [x] `deleteNode` called `this.updateHeight(root)` — method never existed on the tree → **every delete threw `TypeError`**. Fixed: `root.updateHeight()`.

Exit criteria: all algorithm logic testable without rendering; pages only orchestrate. (AVL + all three step-builder families done.)

## Phase 3 — One player, one component set `[x]` (verified)

Done:

- [x] Extract Array/LinkedList/Tree step builders into `src/lib/` (pure `steps[]` generators) with unit tests — `treeSteps.js`, `arraySteps.js`, `linkedListSteps.js`; pages now only validate + call builders + mutate state in `onComplete`
- [x] Register the ~15 sidebar routes `App.jsx` didn't declare — new `src/pages/ComingSoon.jsx` placeholder wired to all 19 sidebar links (Layout ↔ router routes now identical)
- [x] Home CTAs → `<Link>` (`/sorting`, `/tree`); removed both `href="#"` (fixes `jsx-a11y`)
- [x] Clear all 16 remaining lint warnings: unused `X` (`Layout.jsx`), unused `xOffset` + `no-loop-func` x12 (`TreeVisualizer.jsx`), `href="#"` x2 (`Home.jsx`) — **now 0 errors, 0 warnings**
- [x] Appearance/empty-state tests (>10 elements wrap; 0 elements → empty-state message, sane placeholder, guided error) + `initialArray`/`initialNodes` props + `.empty-state` CSS
- [x] Test suite 23 → **138 tests** (15 files); `vi` declared as an ESLint global; `testing-library/no-container`+`no-node-access` disabled **only** in `*.test.*` (appearance tests assert rendered structure)
- [x] **Node-by-node step narration** (this session, TDD):
  - AVL trace events (`avl.js` optional `trace` param on `insert`/`deleteNode`/`minValueNode`); `treeSteps` `buildInsertSteps(trace, value, ui)` / `buildDeleteSteps(trace, value, ui)` emit per-node compare/move/recheck/rotate steps ("Node 40: height 2, balance factor 1 (balanced)", "Left-right case at N: rotate left at C, then rotate right at N")
  - `buildTraversalSteps(root, type, ui)` replaces the inline traversal generator: visit + backtrack narration ("Back at N after left subtree")
  - Array shifts narrated per index ("Moving element at index 2 to index 3"); linked list walks narrate every pointer hop ("Following the 'next' pointer to position 1 (value 20)")
- [x] **Shared `OperationPlayer`** (`src/components/OperationPlayer.jsx`): play/pause/prev/next, speed 0.5×/1×/2×, scrub range, step counter, keyboard (Space/←/→, guarded against inputs/buttons), absolute-state actions so scrubbing replays 0..k; 8 fake-timer tests; `onPlayStateChange` drives each page's `isAnimating`
- [x] **All three pages on shared components**: `runAnimation` + local `OperationVisualizer` deleted from Array/LinkedList; `OperationSteps` deleted; Array/LinkedList/Tree now render `OperationPlayer`, `TabNavigation`, `ErrorMessage`
- [x] `ArrayVisualizer` node markup → shared `ElementNode`; added `:root` design tokens in `index.css` (fixes undefined `var(--primary-color)` etc. — tree highlights rendered white-on-transparent before) and `.tab-container`/`.tab-button` styles (replacing the `.operation-tabs` blocks in `index.css` + `LinkedListVisualizer.css`)
- [x] Remove dead files: `App.css`, `logo.svg`, `pages/ArrayVisualizer.css`, `components/OperationSteps.jsx(+test)`; kept `MemoryBlock.jsx` for Phase 6

Bugs found & fixed while extracting (regression-tested):

- Insert/delete/search step actions closed over a mutated `current` loop variable → every animation step highlighted the **final** node, not its own
- Search steps let `current` end as `null` → `null.value` `TypeError` mid-animation when the value was missing
- Remove-at on an empty array/list showed `Enter position (0--1)` and `Position must be between 0 and -1` — now an empty-state message + guided error

Deferred (documented, not blocking):

- [ ] `LinkedListVisualizer` node markup (`linked-list-node`, `.node-value`/`.node-index` spans) still local — ElementNode emits `.element-value`/`.element-index`, and both the page CSS and the appearance test assert the current selectors; dedupe needs either span-class props on ElementNode or a coordinated CSS+test rename

Exit criteria met: `npm run lint` = 0 warnings; Array/LinkedList lost the tab bar, error banner, step player and (Array) node component reimplementation (~40% of their duplicated code).

## Phase 4 — UX system (fix "no enthusiasm") `[x]` (verified this session)

- [x] Design tokens in `tailwind.config.js`: radius/easing/duration scales + semantic colors (compare=amber, move=indigo, found=green, error=red) applied consistently — every step carries a `kind`, the player renders it as a colored `step-chip`; matching `--kind-*` CSS tokens added to `:root`
- [x] Dark mode (class strategy + persisted toggle) — `.dark` token flips in `index.css` + per-page CSS, Layout Sun/Moon toggle with localStorage, `dark:` Tailwind variants in Layout/step chips
- [x] Dual pane: visualization + pseudocode with live line highlight + variable watch — `src/lib/pseudocode.js` listings (array/list/tree/traversals), `CodePane` (PrismLight + oneDark, per-line `.code-line.active` gutter + `.var-watch`), steps carry `line`/`vars`, `OperationPlayer` takes a `pseudocode` prop, wired on all three pages (tree keys `traversal-*` per run)
- [x] Step narration via `aria-live`; `prefers-reduced-motion` support (`src/lib/motionPrefs.js`, `MotionConfig reducedMotion="user"`, gsap guards); player keyboard (Space/←/→ with input/button guards); Layout nav categories as `aria-expanded` buttons
- [x] Case presets per structure: worst / average / random ("make the BST degenerate" one click away) — `src/lib/presets.js` + `CasePresets.jsx` on Array/List/Tree
- [x] Consistent page shell: `MemoryRepresentation` (revives `MemoryBlock.jsx`: addresses, left/right pointer rows) + shared `ComplexityInfo`/`PropertyDisplay` shells (`.info-panel`), `ErrorMessage` `role="alert"` on all pages
- [x] **Tree visual overhaul (user request, TDD)**: `src/lib/treeLayout.js` pure coordinate layout (in-order slots × `H_GAP`, depth × `V_GAP`) + absolute `.tree-canvas` with SVG cubic `.tree-edge` overlay (replaces recursive flex render + rotated-line edges + `transform: scale()` hacks); node badges show `h:2 bf:0`; edge states use `--kind-compare/move/error` (compare parent → amber, highlighted child → indigo, removing → red); empty state → shared `.empty-state`; full `.dark` rules; contract test guards the CSS
- [x] **Traversal controls overhauled**: `.traversal-section` pill group styled to the preset-button language (previously **zero CSS** — raw browser buttons), active state for the running type, `.traversal-result` card with `.traversal-item` chips + dark variants
- [x] **Level-order traversal** (was a Phase 7 roadmap gap): `AVLTree.levelOrder` (queue), BFS branch in `buildTraversalSteps` (visit line 5, enqueue lines 6/7), `traversal-levelOrder` 8-line pseudocode, 4th `Level-order` button
- [x] **`avl.js` refactor**: extracted `emit`/`recheck`/`rebalanceAfterInsert`/`rebalanceAfterDelete` (dedupes the 4-case rotation blocks + 20 `trace?.push` sites), shared `traverse` core behind pre/in/post wrappers, explicit `nodeCount` invariant test; **trace event order/shape byte-identical** (guarded by 24 trace tests)
- [x] Bug found & fixed: `OperationPlayer` crashed reading `steps[currentStep]` when a new, shorter `steps` array arrived while the stale `currentStep` still pointed past its end (reset effect runs after render) — render-time clamp (`stepIndex`) + regression test

Exit criteria met: **`lint` 0 err/0 warn, `test:ci` 223 tests / 25 files, build green**; every operation completable keyboard-only (focusable buttons + guarded player keys); visual language identical across all pages; dual-pane live on Array/List/Tree.

## Phase 5 — Learning layer `[x]`

- [x] First-run guided tour (`driver.js`, MIT) — shipped: 4-step tour on `.sidebar`/`.workspace`/`.theme-toggle`/`.sidebar-footer`, first-run auto-start, "Take the tour" replay in the sidebar footer, `TOUR_COMPLETED_KEY` persisted on user close/finish only
- [x] Lessons in MDX (`@mdx-js`, MIT): why → how → practice, one per structure, wired to routes — shipped: `@mdx-js/rollup` in `vite.config.mjs`, `src/lessons/*.mdx` (array, linked-list, tree) + manifest, `/lessons` list + `/lessons/:slug` reader, Tutorials→Lessons sidebar link
- [x] Prediction mode: guess the next step/highlight before it plays; scored — shipped: 🎯 toggle in `OperationPlayer`, `src/lib/prediction.js` builds a deterministic 4-option question at each advance boundary (real step narrations + generic distractors, rotated position), auto-play pauses for the guess and resumes after answering, session `Score c / t` chip
- [x] Progress store (localStorage): XP, streaks, per-operation mastery; `canvas-confetti` on milestones — shipped: `src/lib/progress.js` (`PROGRESS_KEY`, corrupt-safe `loadProgress`, `recordOperation`/`recordLesson`/`recordPrediction`, `touchStreak` day-gap rules) + `src/lib/celebration.js`; player `onPredictionAnswer` prop, per-page `onComplete` records `<page>:<tab>` keys, LessonReader "Mark as complete" button (confetti on first completion, disabled on revisit), Lessons-page `.progress-summary` chips + completed-card tint
- [x] Curriculum map (concept dependency graph) replacing the dead sidebar sections — shipped: `src/lib/curriculum.js` (`CONCEPTS` DAG + longest-path `layoutCurriculum` + `masteryFor` new/started/mastered from the progress store), `/curriculum` page (`Curriculum.jsx`/`.css`: absolutely-positioned nodes over SVG edges, mastery tints, dark variants), Tutorials submenu now Lessons + Curriculum map; the 4 dead track links (`/beginner`/`/intermediate`/`/advanced`/`/practice`) removed from sidebar and routes

Exit criteria **met**: a new learner finishes 3 guided lessons with visible progress (XP chips, confetti, mastery tints on the curriculum map), fully offline. **Phase 5 complete.**

## Phase 6 — Differentiators (features no other visualizer has) `[ ]`

- [ ] Time-travel: record runs as Immer patches (`zundo`); scrub anywhere, fork a run, compare two runs with a step diff (e.g. AVL rotations on vs off)
- [ ] Empirical complexity lab: live operation counters during animation + Web Worker n-sweep plotting **measured** growth vs theoretical O() curves
- [x] Memory truth pane: `MemoryBlock` already revived as `MemoryRepresentation` in Phase 4 (addresses + pointer rows on all three pages) — shipped: story ↔ memory toggle (`ViewToggle`, shared across Array/List/Tree) swaps the main canvas between the pretty rendering and the raw address/value/pointer cells; exactly one `.memory-representation` on screen in either view, empty-state note when there are no cells
- [x] Counterfactual toggles: disable rotations / caching / path compression via strategy flags in `src/lib` — shipped: `new AVLTree({ rotations: false })` keeps heights/balance honest but skips every rotation (emits `rotate-skipped`), `treeSteps` narrates the skipped case + honest "tree left unbalanced" finale; `/tree` gets an aria-pressed Rotations On/Off switch + disabled-rotations note (cache/path-compression items land with their structures in Phase 7)
- [x] Share scenarios: encode the whole data set in a URL hash (`#s=<base64url token>`); `src/lib/share.js` (`encodeScenario`/`decodeScenario`/`readScenario`/`buildShareUrl`, corrupt tokens → null) + shared `ShareButton` (clipboard with try/catch, `role="status"` "Link copied!" note); all three pages seed from the hash at state init and ignore scenarios for another structure
- [ ] Share: export run as WebM via `MediaRecorder` (no server)
- [ ] Adversarial input challenges: "construct the input that maximizes comparisons", scored

Exit criteria: each feature demoable on `/tree` with zero backend.

## Phase 7 — Content expansion `[ ]`

- [ ] New structure pages via the Tree pattern: stack/queue, hash table, graph (layout: `d3-hierarchy` / `@xyflow/react`, MIT)
- [ ] Real sorting + searching visualizers (replace decorative `SortingVisualization`)
- [ ] string/float value support (currently integers only) — *level-order traversal shipped early in Phase 4*
- [ ] Structure/algorithm benchmarks: Web Worker, median-of-N, noise warnings

Exit criteria: every sidebar route resolves to a real page.

## Ground rules (apply to every phase)

- **Licenses:** only MIT / ISC / BSD / Apache-2.0. Never AGPL (`intro.js`); `elkjs` is EPL/GPL (avoid unless needed); VisuAlgo forbids forking (ideas only); GSAP = proprietary "free" license (already in use, fine, but it is not OSI-open).
- **TDD:** failing test first, colocate `*.test.js(x)`, assert generated `steps[]` arrays — never animation timers.
- **No new animation library** — framer-motion (enter/exit) + GSAP (imperative) only.
- Verification order every time: `npm run lint` → `npm run test:ci` → `npm run build`.
- Keep `AGENTS.md` truthful after every phase; never let docs and code drift.
- Don't commit unless explicitly asked.
