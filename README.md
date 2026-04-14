# fastRetro

A small, fast, fully-local sprint retrospective and team health check board. Zero install — open the built `index.html` in any modern browser and go.

## Features

### Retrospectives
- **8 guided stages**: Setup, Icebreaker, Brainstorm, Group, Vote, Discuss, Review, Close
- **6 facilitation templates**: Start/Stop, Anchors & Engines, Mad Sad Glad, Four Ls, KALM, Starfish
- **Card grouping** — select two cards in the same column to merge them
- **Per-participant vote budget** — facilitator-configurable
- **Segmented discussion timer** — context (2.5 min) + actions (2.5 min) per card

### Checks
- **5 guided stages**: Setup, Icebreaker, Survey, Discuss, Review, Close
- **2 check templates**: Health Check (9 questions, 1-5 scale), DORA Metrics Quiz (5 questions, labeled options)
- **Survey stage** — rate questions with per-question comments
- **Median scores** — discuss questions ordered by score (worst first)
- **Comparison matrix** — view scores across sessions on the CHECKS tab

### Shared
- **Action item ownership** — assign participants in the review stage
- **Team dashboard** — HOME, RETROSPECTIVES, CHECKS tabs
- **JSON export** — download the full session summary at close
- **Real-time sync** — host from web or CLI, join from any client via room code
- **Mobile-friendly** — responsive layout with touch-sized targets
- **State persistence** — localStorage keeps your session safe across refreshes

## Quick start

```bash
npm install
npm run build
open dist/index.html
```

Or package as a zip:

```bash
npm run package   # builds + zips dist/ → fastretro.zip
```

## Development

```bash
npm run dev          # Vite dev server
npm run test         # Vitest (single run)
npm run test:coverage # with coverage report
npm run lint         # ESLint (zero warnings)
npm run typecheck    # tsc --noEmit
npm run check        # lint + typecheck + test + build (pre-push gate)
```

## Architecture

Hexagonal / clean architecture:

```
src/
  domain/        pure business logic, no framework deps
  application/   use cases orchestrating domain + ports
  adapters/      localStorage, clock, ID generation, export
  ui/            React pages, hooks, components
```

## Stack

- React 18 + TypeScript + Vite
- Vitest + @testing-library/react
- ESLint + Husky + lint-staged

## Session Flows

### Retrospective
1. **Setup** — add participants, pick template (no timer)
2. **Icebreaker** (10 min) — rotating question per participant
3. **Brainstorm** (5 min) — add cards to template columns (140 chars max)
4. **Group** (5 min) — select pairs of same-column cards to group
5. **Vote** (5 min) — per-participant budget, click to vote/unvote
6. **Discuss** (2.5 min/segment) — context + action notes per card, ordered by votes
7. **Review** (5 min) — assign action item owners
8. **Close** — summary + Export JSON

### Check
1. **Setup** — add participants, pick check template
2. **Icebreaker** (10 min) — rotating question per participant
3. **Survey** (10 min) — rate each question, add comments
4. **Discuss** (2.5 min/item) — carousel of questions by median score, add actions
5. **Review** (5 min) — assign action item owners
6. **Close** — survey results with medians + Export JSON
