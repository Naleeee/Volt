# Forge — Technical Setup

Expo (React Native) + TypeScript · expo-router · expo-sqlite + Drizzle · NativeWind.
Everything runs on-device. There is no backend and no API to link.

## Do I need a "real" database?

Yes — and you already have one: **SQLite**. It ships inside Android, lives entirely on your phone, and is a real relational database (tables, indexes, transactions, aggregate queries). "Local" and "real database" are not opposites — a *server* database (Postgres, Supabase…) is only needed for multi-device sync or a web dashboard, which is out of scope.

What would NOT be enough: AsyncStorage / JSON files. History queries ("volume per week", "last time I benched"), relational integrity (routine → exercises → sets), and the crash-safe session log all want SQL.

Backup story: Android Auto Backup (Google account backup, on by default) covers app data up to **25 MB per app** — plenty for the SQLite file, but the exercise photos/GIFs folder can exceed it, in which case media silently stops being backed up. The "Export history" feature is the real safety net for your training data; media is re-addable.

## 1. Prerequisites

- Node LTS (`node -v` ≥ 20), Watchman (`brew install watchman`)
- Android Studio (brings the Android SDK, platform tools and JDK 17) — set `ANDROID_HOME` and add `platform-tools` to PATH per the Expo docs
- On the phone: enable Developer options → USB debugging, plug in via USB, accept the debugging prompt (`adb devices` should list it)
- No developer account of any kind needed.

## 2. Create the project

```bash
npx create-expo-app@latest forge
cd forge
npx expo start        # verify: template runs in an Android emulator (press a) or Expo Go on the phone
```

The default template already includes TypeScript and expo-router.

## 3. Dependencies

```bash
# data
npx expo install expo-sqlite
npm i drizzle-orm
npm i -D drizzle-kit babel-plugin-inline-import

# media
npx expo install expo-image expo-image-picker expo-file-system expo-video

# session UX
npx expo install expo-haptics expo-keep-awake expo-notifications expo-audio
npx expo install react-native-svg react-native-reanimated react-native-gesture-handler
npm i react-native-draggable-flatlist
npm i zustand

# styling + fonts
npm i nativewind tailwindcss
npx expo install expo-font @expo-google-fonts/archivo

# layout
npx expo install react-native-safe-area-context   # already in template, keep versions aligned

# formatting
npm i date-fns                                    # date logic only (weekday labels, Monday-start weeks); clocks and weights are hand-written
```

Always prefer `npx expo install` over `npm i` for Expo/RN packages — it picks versions compatible with your SDK.

## 4. NativeWind

Follow the 4 standard steps (see nativewind.dev/getting-started/expo-router if anything drifts):

1. `tailwind.config.js` — `content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"]`, `presets: [require("nativewind/preset")]`. Put the design tokens here (accent `#C8F63F`, bg `#0B0C0F`, card `#17191F`, card2 `#1F222B`, muted `#8C92A0`).
2. `global.css` with the three `@tailwind` directives, imported once in `app/_layout.tsx`.
3. `babel.config.js` — preset `["babel-preset-expo", { jsxImportSource: "nativewind" }]` plus `"nativewind/babel"`.
4. `metro.config.js` — wrap with `withNativeWind(config, { input: "./global.css" })`.

Verify: a `className="bg-[#C8F63F]"` view renders volt.

## 5. Database (expo-sqlite + Drizzle)

### Schema (`db/schema.ts`)

| Table | Columns (sketch) |
|---|---|
| `exercises` | id, name, measuredBy (`reps`\|`time`\|`other`), mediaPath, mediaType (`photo`\|`gif`\|`video`), notes, restOverrideSec, archivedAt |
| `routines` | id, name, createdAt |
| `routine_exercises` | id, routineId, exerciseId, position, targetSets, targetReps, targetSeconds, targetWeightKg, group (null for now) |
| `sessions` | id, routineId, startedAt, endedAt |
| `session_sets` | id, sessionId, exerciseId, setNumber, reps, seconds, weightKg, note, completedAt |
| `settings` | key, value (single kv table) |

Conventions: timestamps as unix ms integers; **weights always in kg** — entered, stored and displayed in kg, no unit conversion (lb is a future feature, see FEATURES.md).

### Config (`drizzle.config.ts`)

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/drizzle",
  dialect: "sqlite",
  driver: "expo", // required for expo-sqlite migrations
});
```

### Babel / Metro for bundled migrations

Migrations are `.sql` files bundled into the app:

- `babel.config.js`: add `["inline-import", { extensions: [".sql"] }]` to plugins.
- `metro.config.js`: add `config.resolver.sourceExts.push("sql")`.

### Client (`db/client.ts`)

```ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expo = openDatabaseSync("forge.db", { enableChangeListener: true }); // needed for useLiveQuery
export const db = drizzle(expo, { schema });
```

### Migrations at startup (`app/_layout.tsx`)

```ts
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "@/db/drizzle/migrations";
// const { success, error } = useMigrations(db, migrations);
// block rendering until success; show error otherwise
```

### Workflow

1. Edit `db/schema.ts`
2. `npx drizzle-kit generate` → new `.sql` in `db/drizzle/`
3. Reload the app → `useMigrations` applies it

Reads in screens use `useLiveQuery(db.select()...)` — lists re-render automatically when you insert/update. Writes go through plain `db.insert/update` in event handlers.

## 6. Folder structure

```
forge/
  app/                        # expo-router: file = route
    _layout.tsx               # migrations gate, fonts, theme, gesture root
    (tabs)/
      _layout.tsx             # tab bar: Routines · Library · Settings
      index.tsx               # 1 · Home / routines (+ resume-workout bar)
      library.tsx             # 3 · Exercise library
      settings.tsx            # 7 · Settings
    routine/
      new.tsx                 #     Routine builder (design TBD)
      [id]/index.tsx          # 2 · Routine detail
      [id]/edit.tsx
    exercise/
      new.tsx                 # 4 · Create exercise
      [id].tsx                #     Edit exercise
    session/
      [id]/index.tsx          # 5c · Checklist (session home)
      [id]/focus.tsx          # 5/5d · Set focus (reps | time | other)
      [id]/rest.tsx           # 5b · Rest timer
      [id]/summary.tsx        # 6 · Session complete
  components/                 # shared UI (Card, TypeBadge, Stepper, Ring, TabIcon…)
  db/
    schema.ts                 # tables (Drizzle definitions)
    client.ts                 # connection + PRAGMA foreign_keys
    seed.ts                   # dev fixture (__DEV__ only)
    drizzle/                  # generated migrations — commit these
    queries/                  # one file per domain, reads (hooks) and writes together
      settings.ts             # Settings type, defaults, useSettings, setSetting
      exercises.ts
      routines.ts
      sessions.ts             # start / log set / finish, ghost values, week stats
  lib/
    session-store.ts          # zustand: active session (ids, timers as timestamps)
    media.ts                  # pick → copy to documents dir → return path
    format.ts                 # formatClock (mm:ss), formatWeight (kg), formatLastPerformed (date-fns)
  assets/
  global.css  tailwind.config.js  drizzle.config.ts  babel.config.js  metro.config.js
```

Rules of thumb:
- Screens read via `useLiveQuery` hooks and write via functions from `db/queries/<domain>.ts` — a domain's reads and writes live in one file. Screens never import `schema` or `client` directly.
- Timers are **timestamps, not intervals**: store `restEndsAt` / `setStartedAt` in the store, derive display time; schedule the rest-end local notification when rest starts, cancel on skip.
- Every logged set is inserted immediately — the zustand store holds only ephemeral pointers, never unsaved workout data.
- Intercept the Android hardware back button on session screens (confirm before leaving an active workout).

## 7. Fonts & theme

Load Archivo weights (500–900) via `useFonts` in `_layout.tsx`. Timer digits use `fontVariant: ["tabular-nums"]` so they don't jitter. Dark theme only; tokens live in `tailwind.config.js`.

## 8. Running on your phone

Skip Expo Go — notifications (unsupported in Expo Go on Android since SDK 53) and some native modules need a **development build**:

```bash
# one-time: set android.package in app.json (e.g. "ai.landcapital.forge")
npx expo run:android          # builds with Gradle, installs on the plugged-in phone (USB debugging on)
```

Day-to-day you only run `npx expo start` — JS changes hot-reload into the installed dev build. Rebuild only when adding native modules.

Longevity of the install — much simpler than iOS: **installed APKs never expire** and there is nothing to pay. When the app feels "done", install a release build so it runs without the dev server:

```bash
npx expo run:android --variant release
```

Alternative if you'd rather not install Android Studio at all: `eas build -p android --profile development` builds in Expo's cloud and hands you an APK to sideload. Local builds are faster for a long-running project, so Android Studio is still the recommendation.

## 9. Build order (each step verifiable)

1. Scaffold + NativeWind + fonts → verify: themed screen on device.
2. Schema + migrations + seed a routine in code → verify: rows visible in Drizzle Studio via `expo-drizzle-studio-plugin` (`shift+m` in the Expo terminal) or a debug list. `npx drizzle-kit studio` does not work with the expo driver.
3. Exercise CRUD + media picking (screens 3, 4) → verify: create with photo, kill app, still there.
4. Routine builder + detail (2) → verify: build Push Day end-to-end.
5. Session engine: store + checklist (5c) + reps focus (5) + rest (5b) → verify: full workout logged; kill app mid-session, resume works.
6. Time + other focus views (5d), sounds/haptics/keep-awake/notifications.
7. Summary (6), home stats (1), settings (7), export.

### Issue order (GitHub #1–29)

The numbering follows the design's screen order, not the dependency graph. Every issue carries a `Depends on` line — never start one whose dependencies are still open.

**Critical path** (strictly sequential, nothing here parallelizes):

```
#3 schema ─► #6 exercise form ─► #8 library grid ─► #11 routine builder ─► #13 routine detail ─► #14 session engine ─► #15 checklist
                                                          ▲
                                       #10 design gaps ───┘  (also feeds #14, #18, #29)
```

**Where the numbering misleads:**

- `#10` (design gaps) is numbered after the Library issues but blocks `#11` — do it right after `#3`, not when you reach it.
- `#7` (media pipeline) is a dead end: nothing depends on it. Push it to the end; it's the heaviest Library item.
- `#4` (formatting) and `#5` (settings store) are small and dependency-free but needed early: `#5` blocks `#19` and `#26`, `#4` is used from `#11` onward.

**Recommended order:**

| Phase | Issues | Note |
|---|---|---|
| Foundation wrap-up | #3 → #5, #4 | small; unblock later work |
| Design | #10 | before #11 — the builder has no artboard |
| Library | #6 → #8 → #9 | skip #7 for now |
| Routines | #11 → #13 → #12 | detail first, #14 needs it |
| Session core | #14 → #15 → #16 → #17 → #18 → #19 | usable workout tracker after #19 |
| Session extras | #22, #23, #24, #21, #20 | all leaves — any order |
| Home & Settings | #25, #26 → #28, #27 | #27 only needs #3 but is pointless without history |
| Polish | #29, then #7 | empty states need #8 + #12 |

**Leaves** (nothing depends on them, reorder freely): #7, #9, #20, #21, #22, #23, #24, #25, #27, #28, #29.
