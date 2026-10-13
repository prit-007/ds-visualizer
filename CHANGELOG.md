# Changelog

All notable changes to AlgoViz are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions are cut from
`master` as the project matures.

## [Unreleased] — Phase 7 content expansion

### Added
- **Structure types** — linked lists: Singly | Doubly | Circular toggle
  (prev-pointer + loop-closing narration, memory pointers, share links);
  stack/queue: Stack | Queue | Deque | Circular ring buffer (front/rear
  badges, modulo properties, full/empty errors)
- **Hash tables** — separate chaining visualizer (`/hash-table`): bucket
  chains, duplicate/missing-key errors, load-factor properties
- **Graphs** — undirected visualizer (`/graph`): add node/edge, BFS, DFS,
  circular canvas, path/diamond/random presets
- **Sorting** — six algorithms (`/sorting`): bubble, selection, insertion,
  (O(n²)) + merge, quick, heap (O(n log n)); swaps visibly move nodes via
  per-step display-array snapshots + stable ids
- **Searching** — linear + binary (`/searching`): halving-window narration,
  honest unsorted-array guard for binary search
- **Tree algorithms** — `/tree` Traversals & Algorithms panel: BFS (queue),
  DFS (stack), In-order, Post-order, Validate BST, Mirror, LCA
- **B-tree mode** — order-3 B-tree on `/tree` (Binary | B-Tree toggle):
  insert with split/median narration, search, in-order, key-box canvas
- **Layout UX overhaul** — viewport-height shell, mobile off-canvas drawer,
  active-route highlighting, framer-motion page transitions
- **Keyboard + mobile** — Enter-to-submit operation forms, Escape closes the
  drawer, phone-first shell (reachable nav toggle, auto-closing drawer,
  tablet grid stacking), height-aware tree fit-to-viewport
- **Reset / Clear** — toolbar on every data-structure page
- **Dark theme** — cohesive token set (panels/inputs/muted), dark variants
  across pages, coverage-sweep contract tests
- **Polish** — typography tokens (`--font-sans`/`--font-mono`), press-scale
  micro-interactions, panel transitions, current-step pulse
- **Binary heap** — `/heap` min-heap / priority queue visualizer: insert (bubble up), extract-min (sift down), peek; dual animated array + tree canvas, `heap.js`/`heapSteps.js`/`heapLayout.js`
- **Graph algorithms** — `/graph-algo` Dijkstra + Topological Sort (directed arrowheads, in-degree table, cycle detection)
- **Dynamic programming** — `/dynamic-programming`: Fibonacci, grid paths, fewest-coin change with animated DP tables
- **Greedy** — `/greedy`: activity selection, fractional knapsack, greedy coin change
- **Learning redesign** — `AlgoOverview` Learn cards (what · time · space · when) open every visualizer; `/help` page adds shortcuts, gestures, feature index and FAQ
- **DP expansion** — `/dynamic-programming` grows to six page-wise programs (Fibonacci, Grid Paths, Coin Change, Longest Common Subsequence, 0/1 Knapsack, House Robber) with 2D-table canvases
- **Trie** — `/trie` prefix-tree visualizer: insert/search/delete with letter-walk narration and pruning, alphabetical list-words DFS, live autocomplete suggestions, word-end ✓ badges, O(L) panels
- **Linear-time sorts** — `/sorting` gains Counting + Radix (LSD) tabs: tally/prefix/stable-placement narration, per-digit bucket passes, honest non-negative + range guards, O(n + k)/O(d · n) panels
- **MST (Prim + Kruskal)** — fourth `/graph-algo` tab with method toggle, cheapest-fringe-edge growth vs cycle-safe sorted-edge joining, tree edges glow green, honest `Graph disconnected` finale, O(E log V)/O(E log E) panels
- **Bellman-Ford** — third `/graph-algo` tab: negative edge weights (signed `4-2=2` narration), V−1 relaxation passes with early-stop convergence, final-pass negative-cycle detection, neg-weight presets; O(V·E)
- **Union-Find** — `/union-find` disjoint-set visualizer: union by rank, find with path compression (compression narration), forest canvas with root badges, parent-pointer memory view
- **Every ComingSoon route now real** — `/settings` (theme/motion/tour/progress) and `/visualizer` custom-algorithm Playground (`step()` DSL compiled tab-locally). 0 placeholder routes remain
- **AVL improvements** — rotation steps drive edge highlights
  (LL/RR/LR/RL read as real rebalances), adaptive tree layout + scale-to-fit
  (no horizontal scroll as trees grow)

### Changed
- Sorting animation: element positions animate during playback (was
  highlight-only)
- Tree page: traversals unified into one algorithms panel
- Layout: nav toggle moved to the always-visible header; phones start with
  the drawer collapsed

### Fixed
- Player seeker escaping its container at narrow widths
- Tree canvas stretching (horizontal scroll) on growing trees
- Linked-list memory address ordering regression (own address assigned
  before next-pointer lookup)
- LCA run-button duplicate label in the algorithms panel
- Numerous `no-loop-func` closure bugs in step builders (absolute-state
  snapshots now captured at build time)

## [0.1.0] — Foundation (Phases 1–6)

### Added
- CRA → Vite 8 + Vitest 4 migration
- Array, linked-list, AVL-tree visualizers with animated step playback
- Shared `OperationPlayer` (play/pause/step/speed/scrub/keyboard)
- Dual-pane pseudocode (`pseudocode.js` + `CodePane` + line/vars on steps)
- Dark mode, reduced-motion support, case presets, memory representation
- Tree coordinate canvas (SVG edges + height/balance badges)
- Traversal controls incl. level-order; counterfactual rotations-off BST mode
- Story ↔ memory-view toggle; scenario share links (`#s=` hash)
- Complexity lab (measured vs theoretical); run history (fork/diff)
- Adversarial challenges; guided tour; MDX lessons; prediction mode;
  progress store (XP/streak/mastery); curriculum map
- **648 tests / 58 files** green at time of writing

[Unreleased]: https://github.com/prit-007/ds-visualizer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/prit-007/ds-visualizer/releases/tag/v0.1.0
