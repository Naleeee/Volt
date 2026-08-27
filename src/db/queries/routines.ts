import { asc, isNull, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../client";
import { routines } from "../schema";

export type RoutineSummary = {
  id: number;
  name: string;
  exerciseCount: number;
  lastPerformedAt: number | null;
};

// Live on the `routines` table only: useLiveQuery watches the `from` table, so writes to
// routine_exercises or sessions alone don't re-run this until a routine row changes.
export function useRoutines(): RoutineSummary[] {
  const { data } = useLiveQuery(
    db
      .select({
        id: routines.id,
        name: routines.name,
        exerciseCount: sql<number>`(select count(*) from routine_exercises re where re.routine_id = ${routines.id})`.mapWith(Number),
        lastPerformedAt: sql<number | null>`(select max(s.ended_at) from sessions s where s.routine_id = ${routines.id})`,
      })
      .from(routines)
      .where(isNull(routines.archivedAt))
      .orderBy(asc(routines.createdAt)),
  );
  return data;
}
