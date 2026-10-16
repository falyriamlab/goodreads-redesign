# Goodreads Redesign

A mobile-first redesign of the Goodreads app, built as a UX/UI case study. The focus is a faster way to track what you read, with clearer shelves, quarter-star ratings and spoiler-safe reviews, and the core theme color pairs checked against WCAG AA.

> This is a design exercise, not affiliated with Goodreads or Amazon. All data is mock data.

## Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) with theme tokens only (no hard-coded colors)
- [shadcn/ui](https://ui.shadcn.com) (Radix) for primitives
- [zustand](https://zustand.docs.pmnd.rs) for the library state, persisted to `localStorage`
- React Router and lucide-react icons

## Requirements

Node **22.22 or newer** (pinned in [`.nvmrc`](.nvmrc)). With nvm, run `nvm use`.

## Getting started

```bash
npm install
npm run dev
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Reviewing components

Open **`/dev/components`** while the dev server is running (e.g. http://localhost:5173/dev/components). It shows every book component in all of its states: covers, status chips, cards, star ratings, the loved button and review cards. A switch at the top toggles light and dark mode.

## Project structure

```
src/
  components/ui/      shadcn primitives
  components/layout/  AppShell, BottomNav, TopBar
  components/book/    BookCover, BookCard, StatusChip, StarRating, LovedButton, ReviewCard
  pages/              one file per route (+ pages/dev for the component lab)
  state/              zustand stores
  mocks/              mock books, user and reviews
  types/              shared types
  lib/                helpers (cn, theme, rating)
```
