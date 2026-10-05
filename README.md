# AlgoViz — Data Structures & Algorithms Visualizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-648%20green-brightgreen)](pro/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev/)

**AlgoViz** is a free, open-source visualizer for data structures and algorithms. Watch AVL rotations, BFS/DFS traversals, sorting swaps and hash-table chains animate step by step — with prediction questions, lessons, a curriculum map and a complexity lab built in. Fully offline, no accounts, no telemetry.

**Live:** https://prit-007.github.io/ds-visualizer/

## Features

### Visualizers
| Structure / Algorithm | Page | What you can do |
|---|---|---|
| Arrays | `/array` | push, insert-at, remove-at with per-index shift narration |
| Linked lists | `/linked-list` | Singly / Doubly / Circular types, pointer-hop narration |
| Stacks & queues | `/stack-queue` | Stack, Queue, Deque, Circular ring buffer |
| Trees | `/tree` | AVL (with counterfactual rotations-off BST mode), B-tree (order-3), BFS/DFS/Validate/Mirror/LCA algorithms |
| Graphs | `/graph` | add node/edge, BFS, DFS on a circular canvas |
| Hash tables | `/hash-table` | separate chaining, chain-walk narration |
| Sorting | `/sorting` | bubble, selection, insertion, merge, quick, heap — swaps visibly move nodes |
| Searching | `/searching` | linear + binary search with window narration |

### Learning features
- **Lessons** — MDX-guided lessons per structure (`/lessons`)
- **Curriculum map** — concept DAG with mastery tracking (`/curriculum`)
- **Prediction mode** — the player asks "what's next?" at every step boundary
- **Complexity lab** — measured growth vs theoretical curves (`/complexity`)
- **Challenges** — adversarial worst-case search scoring (`/challenges`)
- **Progress store** — XP/streak/mastery in localStorage (offline)

### Platform
- Step player with play/pause/step/speed/scrub + keyboard (Space, ←/→)
- Enter-to-submit operation forms; Escape closes the mobile drawer
- Story ↔ memory-view toggle (raw addresses/pointers per structure)
- Scenario share links (`#s=<token>`) + run history with fork/diff
- Dark mode, reduced-motion support, phone-first responsive shell

## Quick start

```bash
git clone https://github.com/prit-007/ds-visualizer.git
cd ds-visualizer/pro
npm install
npm start          # dev server → http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm start` / `npm run dev` | dev server (port 3000) |
| `npm test` | watch tests |
| `npm run test:ci` | one-shot full suite (648 tests) |
| `npm run lint` | ESLint (0 errors / 0 warnings policy) |
| `npm run build` | production build → `dist/` (+ SPA `404.html` fallback) |

## Tech stack

- **React 19** + **Vite 8** + Vitest 4 (jsdom)
- **Tailwind CSS 3** + per-page semantic CSS + design tokens
- **framer-motion** (enter/exit) + **GSAP** (imperative highlight/scale)
- **react-router-dom 7**, **lucide-react**, **driver.js** (guided tour), **canvas-confetti**
- Plain JS/JSX (no TypeScript), algorithm cores isolated in `src/lib/` as pure, testable modules

## Project layout

```
ds-visualizer/
├── LICENSE, README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
├── .github/workflows/deploy.yml   # GitHub Pages deploy
├── ROADMAP.md                     # feature roadmap (untracked checklist)
└── pro/                           # the whole app
    ├── src/
    │   ├── lib/                   # pure algorithm cores + step builders (TDD'd)
    │   ├── pages/                 # one page per structure/algorithm
    │   ├── components/            # Layout, OperationPlayer, shared UI
    │   └── lessons/               # MDX lessons
    └── package.json
```

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the
dev setup, TDD policy (failing test first, `steps[]` contracts) and PR flow.
All contributors agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE) — free to use, modify and
distribute, including commercially.

## Credits

Built and maintained by [Prit V. Vasani](https://github.com/prit-007).
