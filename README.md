# fastRetro

A small, fast, fully-local sprint retrospective board. Zero install — open the built `index.html` in any modern browser and go.

## Features

- **8 guided stages**: Setup, Icebreaker, Brainstorm, Group, Vote, Discuss, Review, Close
- **Start / Stop columns** with 140-character cards
- **Card grouping** — select two cards in the same column to merge them
- **Per-participant vote budget** — facilitator-configurable
- **Segmented discussion timer** — context (2.5 min) + actions (2.5 min) per card
- **Action item ownership** — assign participants in the review stage
- **JSON export** — download the full retro summary at close
- **Mobile-friendly** — responsive layout with touch-sized targets
- **State persistence** — localStorage keeps your retro safe across refreshes

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

## Retro flow

1. **Setup** — add participants (no timer)
2. **Icebreaker** (10 min) — rotating question per participant
3. **Brainstorm** (5 min) — add Start / Stop cards (140 chars max)
4. **Group** (5 min) — select pairs of same-column cards to group
5. **Vote** (5 min) — per-participant budget, click to vote/unvote
6. **Discuss** (2.5 min/segment) — context + action notes per card, ordered by votes
7. **Review** (5 min) — assign action item owners
8. **Close** — read-only summary + Export JSON
