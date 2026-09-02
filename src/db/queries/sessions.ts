import { startOfWeek, subWeeks } from "date-fns";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../client";
import {
  exercises,
  routineExercises,
  routines,
  sessionSets,
  sessions,
  type SessionSet,
} from "../schema";

export type ActiveSession = {
  id: number;
  routineId: number;
  routineName: string;
  startedAt: number;
  plannedSets: number;
  loggedSets: number;
  lastSetAt: number | null;
};

// Home resume bar. `undefined` while loading, `null` when no workout is in progress.
// Two live queries: sessions for the row, session_sets for the progress (useLiveQuery watches one table each).
export function useActiveSession(): ActiveSession | null | undefined {
  const active = useLiveQuery(
    db
      .select({
        id: sessions.id,
        routineId: sessions.routineId,
        startedAt: sessions.startedAt,
        routineName: routines.name,
        plannedSets:
          sql<number>`(select coalesce(sum(re.target_sets), 0) from routine_exercises re where re.routine_id = ${sessions.routineId})`.mapWith(
            Number,
          ),
      })
      .from(sessions)
      .innerJoin(routines, eq(routines.id, sessions.routineId))
      .where(isNull(sessions.endedAt))
      .orderBy(desc(sessions.startedAt))
      .limit(1),
  );
  const progress = useLiveQuery(
    db
      .select({
        loggedSets: sql<number>`count(${sessionSets.id})`.mapWith(Number),
        lastSetAt: sql<number | null>`max(${sessionSets.completedAt})`,
      })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(isNull(sessions.endedAt)),
  );

  if (!active.updatedAt) return undefined;
  const row = active.data[0];
  if (!row) return null;
  return {
    ...row,
    loggedSets: progress.data[0]?.loggedSets ?? 0,
    lastSetAt: progress.data[0]?.lastSetAt ?? null,
  };
}

export type SessionEntry = {
  exerciseId: number;
  name: string;
  measuredBy: (typeof exercises.$inferSelect)["measuredBy"];
  mediaPath: string | null;
  mediaType: (typeof exercises.$inferSelect)["mediaType"];
  restOverrideSec: number | null;
  targetSets: number;
  targetReps: number | null;
  targetTimeSec: number | null;
  targetWeightKg: number | null;
};

export type SessionDetail = {
  id: number;
  routineId: number;
  routineName: string;
  startedAt: number;
  endedAt: number | null;
  entries: SessionEntry[];
};

// Session screens: the session row plus the routine's entries in order. `undefined` until both loaded.
export function useSession(sessionId: number): SessionDetail | undefined {
  const session = useLiveQuery(
    db
      .select({
        id: sessions.id,
        routineId: sessions.routineId,
        routineName: routines.name,
        startedAt: sessions.startedAt,
        endedAt: sessions.endedAt,
      })
      .from(sessions)
      .innerJoin(routines, eq(routines.id, sessions.routineId))
      .where(eq(sessions.id, sessionId)),
    [sessionId],
  );
  const entries = useLiveQuery(
    db
      .select({
        exerciseId: routineExercises.exerciseId,
        name: exercises.name,
        measuredBy: exercises.measuredBy,
        mediaPath: exercises.mediaPath,
        mediaType: exercises.mediaType,
        restOverrideSec: exercises.restOverrideSec,
        targetSets: routineExercises.targetSets,
        targetReps: routineExercises.targetReps,
        targetTimeSec: routineExercises.targetTimeSec,
        targetWeightKg: routineExercises.targetWeightKg,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
      .innerJoin(sessions, eq(sessions.routineId, routineExercises.routineId))
      .where(eq(sessions.id, sessionId))
      .orderBy(asc(routineExercises.position)),
    [sessionId],
  );

  const row = session.data[0];
  if (!session.updatedAt || !entries.updatedAt || !row) return undefined;
  return { ...row, entries: entries.data };
}

export function useSessionSets(sessionId: number): SessionSet[] {
  const { data } = useLiveQuery(
    db
      .select()
      .from(sessionSets)
      .where(eq(sessionSets.sessionId, sessionId))
      .orderBy(asc(sessionSets.completedAt)),
    [sessionId],
  );
  return data;
}

// Most recent non-skipped set of this exercise from another session — "same as last session" and ghost values.
export function useLastPerformedSet(
  exerciseId: number,
  excludeSessionId: number,
): SessionSet | undefined {
  const { data } = useLiveQuery(
    db
      .select({ set: sessionSets })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(
        and(
          eq(sessionSets.exerciseId, exerciseId),
          ne(sessionSets.sessionId, excludeSessionId),
          eq(sessionSets.skipped, false),
        ),
      )
      .orderBy(desc(sessionSets.completedAt))
      .limit(1),
    [exerciseId, excludeSessionId],
  );
  return data[0]?.set;
}

export function useGhostSets(
  exerciseIds: number[],
  excludeSessionId: number,
): SessionSet[] {
  const key = exerciseIds.join(",");
  const { data } = useLiveQuery(
    db
      .select({ set: sessionSets, sessionId: sessions.id })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(
        and(
          inArray(
            sessionSets.exerciseId,
            exerciseIds.length ? exerciseIds : [-1],
          ),
          ne(sessions.id, excludeSessionId),
          isNotNull(sessions.endedAt),
          eq(sessionSets.skipped, false),
        ),
      )
      .orderBy(desc(sessions.endedAt), asc(sessionSets.setNumber)),
    [key, excludeSessionId],
  );
  const chosen = new Map<number, number>();
  return data
    .filter((row) => {
      const sessionId = chosen.get(row.set.exerciseId) ?? row.sessionId;
      chosen.set(row.set.exerciseId, sessionId);
      return row.sessionId === sessionId;
    })
    .map((row) => row.set);
}

export type WeekStats = {
  workouts: number;
  trainedSec: number;
  setsLogged: number;
  streakWeeks: number;
};

const WEEK = { weekStartsOn: 1 as const }; // Monday, local time

// This week's completed sessions (in-progress ones don't count yet) plus the weekly streak.
export function useWeekStats(): WeekStats {
  const weekStart = startOfWeek(new Date(), WEEK).getTime();

  const week = useLiveQuery(
    db
      .select({
        workouts: sql<number>`count(*)`.mapWith(Number),
        trainedMs:
          sql<number>`coalesce(sum(${sessions.endedAt} - ${sessions.startedAt}), 0)`.mapWith(
            Number,
          ),
      })
      .from(sessions)
      .where(
        and(isNotNull(sessions.endedAt), gte(sessions.startedAt, weekStart)),
      ),
    [weekStart],
  );
  const setsThisWeek = useLiveQuery(
    db
      .select({ setsLogged: sql<number>`count(*)`.mapWith(Number) })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(
        and(
          isNotNull(sessions.endedAt),
          gte(sessions.startedAt, weekStart),
          eq(sessionSets.skipped, false),
        ),
      ),
    [weekStart],
  );
  const history = useLiveQuery(
    db
      .select({ startedAt: sessions.startedAt })
      .from(sessions)
      .where(isNotNull(sessions.endedAt)),
  );

  return {
    workouts: week.data[0]?.workouts ?? 0,
    trainedSec: Math.round((week.data[0]?.trainedMs ?? 0) / 1000),
    setsLogged: setsThisWeek.data[0]?.setsLogged ?? 0,
    streakWeeks: streakWeeks(
      history.data.map((r) => r.startedAt),
      weekStart,
    ),
  };
}

// Consecutive weeks with ≥1 completed session, counted back from this week — or from last week
// while this one is still empty, so a streak isn't lost on Monday morning.
export function streakWeeks(sessionStarts: number[], weekStart: number) {
  const weeks = new Set(
    sessionStarts.map((t) => startOfWeek(t, WEEK).getTime()),
  );
  let cursor = weeks.has(weekStart)
    ? weekStart
    : subWeeks(weekStart, 1).getTime();
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor = subWeeks(cursor, 1).getTime();
  }
  return streak;
}

// ── writes (all synchronous on this driver) ───────────────────────────────────

export function startSession(routineId: number) {
  const open = db
    .select({ id: sessions.id })
    .from(sessions)
    .where(isNull(sessions.endedAt))
    .limit(1)
    .get();
  if (open) throw new Error("A workout is already in progress");
  return db
    .insert(sessions)
    .values({ routineId, startedAt: Date.now() })
    .returning({ id: sessions.id })
    .get();
}

export type LogSetInput = {
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  reps?: number | null;
  timeSec?: number | null;
  weightKg?: number | null;
  note?: string | null;
  skipped?: boolean;
};

// Every set is written the moment it is logged — the store never holds unsaved workout data.
export function logSet(input: LogSetInput) {
  return db
    .insert(sessionSets)
    .values({ ...input, completedAt: Date.now() })
    .returning({ id: sessionSets.id })
    .get();
}

export function deleteSet(setId: number) {
  db.delete(sessionSets).where(eq(sessionSets.id, setId)).run();
}

export function finishSession(sessionId: number) {
  db.update(sessions)
    .set({ endedAt: Date.now() })
    .where(eq(sessions.id, sessionId))
    .run();
}

// Cascades to session_sets (foreign_keys is ON in client.ts).
export function discardSession(sessionId: number) {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

// ── position ──────────────────────────────────────────────────────────────────

export type SessionPosition = { exerciseIndex: number; setNumber: number };

// Logged sets only carry exercise_id, and the same exercise can appear twice in a routine:
// hand sets to entries in routine order, each entry taking at most its target.
export function groupSetsByEntry<S extends Pick<SessionSet, "exerciseId">>(
  entries: Pick<SessionEntry, "exerciseId" | "targetSets">[],
  sets: S[],
): S[][] {
  const pool = new Map<number, S[]>();
  for (const s of sets)
    pool.set(s.exerciseId, [...(pool.get(s.exerciseId) ?? []), s]);
  return entries.map((e) => {
    const available = pool.get(e.exerciseId) ?? [];
    const taken = available.slice(0, e.targetSets);
    pool.set(e.exerciseId, available.slice(taken.length));
    return taken;
  });
}

export function allocateLoggedSets(
  entries: Pick<SessionEntry, "exerciseId" | "targetSets">[],
  sets: Pick<SessionSet, "exerciseId">[],
): number[] {
  return groupSetsByEntry(entries, sets).map((group) => group.length);
}

// First entry with sets left, or null when every planned set is logged.
export function nextPosition(
  entries: Pick<SessionEntry, "targetSets">[],
  done: number[],
): SessionPosition | null {
  const exerciseIndex = done.findIndex((d, i) => d < entries[i].targetSets);
  return exerciseIndex === -1
    ? null
    : { exerciseIndex, setNumber: done[exerciseIndex] + 1 };
}

export function getResumePosition(sessionId: number, routineId: number) {
  const entries = db
    .select({
      exerciseId: routineExercises.exerciseId,
      targetSets: routineExercises.targetSets,
    })
    .from(routineExercises)
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(asc(routineExercises.position))
    .all();
  const sets = db
    .select({ exerciseId: sessionSets.exerciseId })
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .all();
  return nextPosition(entries, allocateLoggedSets(entries, sets));
}
