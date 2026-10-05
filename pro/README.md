# pro/ — the AlgoViz app

This directory contains the entire React application. Full project docs
live at the repo root:

- [README](../README.md) — features, quick start, tech stack
- [Contributing](../CONTRIBUTING.md) — setup, TDD policy, PR flow
- [License](../LICENSE) — MIT

## Dev commands (run from this directory)

| Command | What it does |
|---|---|
| `npm start` / `npm run dev` | dev server → http://localhost:3000 |
| `npm test` | watch tests |
| `npm run test:ci` | one-shot full suite |
| `npm run lint` | ESLint (0 errors / 0 warnings policy) |
| `npm run build` | production build → `dist/` (+ SPA `404.html`) |

## Layout

- `src/lib/` — pure algorithm cores + step builders (TDD'd, no React)
- `src/pages/` — one page per structure/algorithm
- `src/components/` — Layout shell, OperationPlayer, shared UI
- `src/lessons/` — MDX lessons
- `src/index.css` — design tokens (`:root` / `.dark`) + shared styles
