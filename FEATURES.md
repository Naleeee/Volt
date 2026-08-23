# Forge — Workout Tracker · Features

Personal workout tracker. Android-first, offline, no account, no backend.
Numbers in parentheses reference the design artboards (Claude Design canvas —
drawn in an iPhone frame, which is cosmetic only; layout and features are identical).

Legend: **[v1]** ship first · **[v2]** later, don't build now.

## Exercise library (3, 4)

- **[v1]** Create / edit an exercise: name, "measured by" type (**reps**, **time**, **other**), optional notes.
- **[v1]** Attach a photo or GIF demonstrating the movement (shown on cards and in session views; GIFs loop). Short muted MP4s also accepted — much smaller than GIFs for phone-recorded clips.
- **[v1]** Optional per-exercise rest override (Settings promises it; add the field to the exercise form — missing in design).
- **[v1]** Library grid with search, type filter chips (All / Reps / Time / Other), type badges, exercise count.
- **[v1]** Archive (soft delete) — an exercise referenced by history is never hard-deleted.
- "Other" exercises log a free-form note per set (distance, load, etc.).

## Routines (1, 2)

- **[v1]** Routine list on Home: name, exercise count, last performed, prominent Start button, "New routine".
- **[v1]** Routine builder (create / edit) — *not in the design yet, design it before building*: pick exercises from the library, drag to reorder, set targets per exercise (sets × reps or sets × seconds, optional weight).
- **[v1]** Routine detail: ordered exercises with thumbnails and targets, estimated duration, last performed, sticky "Start workout".
- **[v2]** Duplicate routine.

## Active session (5, 5b, 5c, 5d)

- **[v1]** Checklist view (session home): one card per exercise; the current one expands into a set table (SET / weight / REPS / done), completed exercises collapse with strikethrough, upcoming show 0/n.
- **[v1]** Focus views per set:
  - Reps: giant rep stepper (+ / −), weight and target shown, "Log set · start rest".
  - Time: circular work timer (start hold / pause / resume), "log early".
  - Other: free-form note entry per set — *no design yet*.
- **[v1]** Rest timer: auto-starts on set logged (toggle), full-screen countdown ring, +15 s, skip, "up next" card. Default durations from Settings, per-exercise override wins.
- **[v1]** Session clock and per-exercise progress bar; set dots for the current exercise.
- **[v1]** Previous-session ghost values in the set table ("last time: 8 @ 135 lb") — highest-value training feature, nearly free once sessions are stored.
- **[v1]** Skip set, back to list, finish early.
- **[v1]** Crash-safe: every logged set is written to the DB immediately; an unfinished session shows a "Resume workout" bar on Home (*state not in design*).
- **[v1]** Keep screen awake during sessions (setting).
- **[v1]** Timer sounds (3-2-1 and rest end) + haptics on stepper / log set (settings).
- **[v1]** Local notification at rest end so the beep works with the screen locked.
- **[v1]** Hardware back button during a session asks for confirmation instead of silently leaving the workout.

## Summary & history (6)

- **[v1]** Session complete screen: duration, sets logged vs planned, exercises completed, total volume (weight × reps), per-exercise breakdown.
- **[v2]** History tab: past sessions list + session detail view.
- **[v2]** Per-exercise records (heaviest set, longest hold) on an exercise detail view.
- **[v2]** Charts: volume per week, weight over time per exercise.

## Home stats (1)

- **[v1]** This-week card: workouts, time trained, sets logged. Weekly streak badge.
- Weeks computed in local time; week starts Monday.

## Settings (7)

- **[v1]** Rest defaults: between sets (90 s), between exercises (2:00), auto-start toggle.
- **[v1]** Units lb / kg (weights stored canonically in kg, converted for display).
- **[v1]** Timer sounds, keep screen awake.
- **[v1]** Export history (CSV or JSON via share sheet).
- **[v1]** Erase all data (confirmation required).
- **[v2]** Language (row stays as an English-only stub in v1).
- Theme: volt accent + optional OLED-black background (design exposes both as tokens — cheap to support, optional).

## First run

- **[v1]** Empty states for no routines / no exercises (*not in design*).

## Explicitly out of scope for now

- Accounts, sync, backend, web dashboard (add Supabase later only if multi-device becomes real).
- **[v2]** Ongoing notification with live rest countdown while the app is backgrounded (Android foreground service — the Android equivalent of a Live Activity, and easier to build).
- **[v2]** Health Connect workout write.
- **[v2]** Supersets / circuits — keep an optional `group` column on routine entries so it's not a migration later.
- **[v2]** Home-screen widgets.
