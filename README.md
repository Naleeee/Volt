<p align="center">
  <img src="assets/images/VoltLogo.png" alt="Volt" width="120" />
</p>

# Volt

<!-- coverage-badge:start -->
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
<!-- coverage-badge:end -->

Personal workout tracker for Android. Offline, no account, no backend — everything lives in a SQLite database on the phone.

Build routines from your own exercise library, run them with a set-by-set checklist, rest timer and last-session ghost values, and keep a crash-safe log of every set.

## Screenshots

<!-- Add screenshots here: Home · Library · Routine detail · Session checklist · Rest timer · Summary -->

## Features

- **Exercise library** — exercises measured by reps, time or a free-form note, with a photo, GIF or short video demo; search and type filters; per-exercise rest override; archive and restore.
- **Routines** — pick exercises from the library, drag to reorder, set targets (sets × reps or seconds, optional weight in kg); detail view with estimated duration and last performed.
- **Sessions** — one card per exercise, rep stepper and hold-timer focus views, rest timer with +15 s and skip, ghost values from the previous session.
- **Crash-safe** — every set is written to the database the moment it is logged; an unfinished session shows a Resume bar on Home.
- **Session comfort** — keep screen awake, timer sounds and haptics, local notification when rest ends, back-button confirmation before leaving a workout.
- **Summary & stats** — duration, sets, total volume and a per-exercise breakdown after each session; this-week workouts and weekly streak on Home.
- **Settings** — rest defaults, auto-start rest, sounds, keep awake, CSV export via the share sheet, erase all data.

[FEATURES.md](FEATURES.md) has the full list, including what is deferred to v2.

## Tech stack

Expo SDK 57 · React Native · TypeScript · expo-router · expo-sqlite + Drizzle ORM · NativeWind · Zustand · react-hook-form + zod · Jest (jest-expo) + Testing Library

## Getting started

Prerequisites: Node ≥ 20, Android Studio (Android SDK + JDK 17), and a phone with USB debugging enabled or an emulator.

```bash
npm install
npx expo run:android   # one-time: build the dev build and install it on the device
npm start              # day to day: JS hot-reloads into the installed dev build
```

Expo Go is not enough — notifications and some native modules need a development build. Rebuild only when native modules change. For a standalone install that runs without the dev server:

```bash
npx expo run:android --variant release
```

[SETUP.md](SETUP.md) has the detailed setup notes (NativeWind, Drizzle, folder conventions).

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Metro dev server |
| `npm run android` | Build and install the Android dev build |
| `npm run lint` | ESLint via `expo lint` |
| `npm test` | Run the Jest test suite |
| `npm run test:coverage` | Run the tests and print the per-file coverage table |
| `npm run coverage:readme` | Run the tests with coverage and refresh the badge and table in this README |
| `npx drizzle-kit generate` | Generate a SQL migration after editing `src/db/schema.ts` |

## Tests & coverage

Tests use Jest with the `jest-expo` preset and live next to the code in `__tests__` folders:

- `src/db/__tests__` — schema, migrations and every query module, run against a real in-memory SQLite database via `better-sqlite3`. The expo-sqlite client is swapped for it by `src/db/__mocks__/client.ts`, and the live-query hooks are called as plain functions.
- `src/lib/__tests__` — pure helpers, the session store and flow, and the expo-backed helpers (media, export, notifications, sounds) with the native modules mocked.
- Hooks render with `renderHook` from `@testing-library/react-native`.

Coverage is measured on the logic layer only: `src/lib` and `src/db`, excluding generated migrations. Screens and components are not unit-tested.

<!-- coverage-table:start -->
| Metric | Coverage | Covered |
| --- | --- | --- |
| Statements | 99.75% | 408 / 409 |
| Branches | 96.96% | 224 / 231 |
| Functions | 100% | 129 / 129 |
| Lines | 100% | 355 / 355 |
<!-- coverage-table:end -->

_Updated by `npm run coverage:readme`._

## Project structure

```
src/
  app/          expo-router screens: (tabs) Routines · Library · Settings, routine/, exercise/, session/
  components/   shared UI, grouped by domain
  db/           Drizzle schema, client, generated migrations (drizzle/), queries/ (reads and writes per domain)
  lib/          pure helpers, session store, media, notifications, sounds
  constants/    theme tokens shared by Tailwind and components
```

## Database workflow

1. Edit `src/db/schema.ts`.
2. Run `npx drizzle-kit generate` — a new migration lands in `src/db/drizzle/`.
3. Reload the app; migrations run at startup.

CI fails if `schema.ts` and the migrations folder drift apart.

## CI

Every pull request runs lint, typecheck, unit and database tests, a migrations sync check and a Metro bundle export. Pushes to `main` also build a release APK, downloadable from the workflow run.
