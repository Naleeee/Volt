import { exercises, routineExercises, routines } from "@/db/schema";
import { seedIfEmpty } from "@/db/seed";

jest.mock("@/db/client");

const { db, resetDb } =
  jest.requireMock<typeof import("@/db/__mocks__/client")>("@/db/client");

beforeEach(resetDb);

describe("seedIfEmpty", () => {
  it("creates the Push Day fixture once", async () => {
    await seedIfEmpty();
    await seedIfEmpty();

    expect(db.select().from(routines).all()).toEqual([
      expect.objectContaining({ name: "Push Day" }),
    ]);
    expect(db.select().from(exercises).all().map((e) => e.name)).toEqual([
      "Bench Press",
      "Plank",
    ]);
    expect(db.select().from(routineExercises).all().map((e) => [e.position, e.targetSets])).toEqual([
      [1, 3],
      [2, 3],
    ]);
  });

  it("leaves an existing routine alone", async () => {
    db.insert(routines).values({ name: "Mine", createdAt: 1 }).run();
    await seedIfEmpty();
    expect(db.select().from(routines).all().map((r) => r.name)).toEqual(["Mine"]);
    expect(db.select().from(exercises).all()).toHaveLength(0);
  });
});
