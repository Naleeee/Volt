# Contributing

Thanks for helping with Volt. Keep changes small and focused: one issue per pull request.

## Setup

Follow [Getting started](README.md#getting-started) in the README. You need Node 24 (`.nvmrc`), Android Studio and a phone or emulator with a development build installed.

## Workflow

1. Pick an open issue or open one first, and say you are taking it. Check the [Roadmap](README.md#roadmap) before proposing a feature.
2. Branch from `dev` and name the branch after the issue: `git checkout -b VT-<issue number> dev`. The name matters: CI links the pull request to the issue from it.
3. Commit as `VT-<issue number> :gitmoji: Summary`, for example `VT-84 :bug: Fix GIFs freezing on the focus page`.
4. Before pushing, run `npm run lint` and `npm test`. If you changed `src/db/schema.ts`, run `npx drizzle-kit generate` and commit the migration; CI fails when the schema and the migrations folder drift apart.
5. Open the pull request against `dev`. For UI changes, attach a screenshot or a short recording.

## Code conventions

- TypeScript everywhere, no `any`.
- Screens read through the hooks in `src/db/queries/<domain>.ts` and write through the functions in the same file. Screens never import `schema` or `client` directly.
- `src/lib` and `src/db` are unit-tested and the coverage table in the README is generated from them; add tests when you add logic there. Screens and components are not unit-tested.
- Styling uses NativeWind classes; colors come from the tokens in `src/constants`.
- The React Compiler is enabled: no manual `useMemo`, `useCallback` or `React.memo`.

## Releases

Tags, GitHub Releases and signed APKs are handled by the maintainer. See [Releases](README.md#releases) in the README.
