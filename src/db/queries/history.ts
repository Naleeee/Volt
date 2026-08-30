import { asc, eq } from "drizzle-orm";
import { db } from "../client";
import { exercises, routines, sessionSets, sessions } from "../schema";

// One row per logged set; a session without sets still appears once with empty set columns.
export function getHistoryRows() {
  return db
    .select({
      sessionId: sessions.id,
      routine: routines.name,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      exercise: exercises.name,
      measuredBy: exercises.measuredBy,
      setNumber: sessionSets.setNumber,
      reps: sessionSets.reps,
      timeSec: sessionSets.timeSec,
      weightKg: sessionSets.weightKg,
      note: sessionSets.note,
      skipped: sessionSets.skipped,
      completedAt: sessionSets.completedAt,
    })
    .from(sessions)
    .leftJoin(routines, eq(routines.id, sessions.routineId))
    .leftJoin(sessionSets, eq(sessionSets.sessionId, sessions.id))
    .leftJoin(exercises, eq(exercises.id, sessionSets.exerciseId))
    .orderBy(asc(sessions.startedAt), asc(sessionSets.completedAt))
    .all();
}
