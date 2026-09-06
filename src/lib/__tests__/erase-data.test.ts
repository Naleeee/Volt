import {
  exercises,
  routineExercises,
  routines,
  sessions,
  sessionSets,
  settings,
} from "@/db/schema";
import { eraseAllData } from "@/lib/erase-data";
import { clearMediaDir } from "@/lib/media";
import { useSessionStore } from "@/lib/session-store";

jest.mock("@/db/client");
jest.mock("@/lib/media", () => ({ clearMediaDir: jest.fn() }));
jest.mock("@/lib/notifications", () => ({ syncRestEndNotification: jest.fn() }));
jest.mock("@/lib/sounds", () => ({ playTimerSound: jest.fn() }));

const { db, resetDb } =
  jest.requireMock<typeof import("@/db/__mocks__/client")>("@/db/client");

beforeEach(resetDb);

describe("eraseAllData", () => {
  it("empties every table, ends the active session and clears media", () => {
    const exercise = db.insert(exercises).values({ name: "Bench", measuredBy: "reps" }).returning().get();
    const routine = db.insert(routines).values({ name: "Push", createdAt: 1 }).returning().get();
    db.insert(routineExercises).values({ routineId: routine.id, exerciseId: exercise.id, position: 1 }).run();
    const session = db.insert(sessions).values({ routineId: routine.id, startedAt: 1 }).returning().get();
    db.insert(sessionSets).values({ sessionId: session.id, exerciseId: exercise.id, setNumber: 1, completedAt: 2 }).run();
    db.insert(settings).values({ key: "timerSounds", value: "false" }).run();
    useSessionStore.getState().begin(session.id);

    eraseAllData();

    for (const table of [exercises, routineExercises, routines, sessions, sessionSets, settings])
      expect(db.select().from(table).all()).toHaveLength(0);
    expect(useSessionStore.getState().sessionId).toBeNull();
    expect(clearMediaDir).toHaveBeenCalledTimes(1);
  });
});
