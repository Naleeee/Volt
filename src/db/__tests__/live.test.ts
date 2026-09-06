import { act, renderHook } from "@testing-library/react-native";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useLiveTables } from "@/db/live";

jest.mock("expo-sqlite", () => ({ addDatabaseChangeListener: jest.fn() }));

type Listener = Parameters<typeof addDatabaseChangeListener>[0];
type Subscription = ReturnType<typeof addDatabaseChangeListener>;

let listeners: Listener[];
const remove = jest.fn();

beforeEach(() => {
  listeners = [];
  jest.mocked(addDatabaseChangeListener).mockImplementation((listener) => {
    listeners.push(listener);
    return { remove } as unknown as Subscription;
  });
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

const change = (tableName: string) =>
  listeners.forEach((listen) =>
    listen({ databaseName: "volt.db", databaseFilePath: "", tableName, rowId: 1 }),
  );

type Props = { tables: string[]; deps: unknown[] };

describe("useLiveTables", () => {
  it("reads once on mount and again after a change to a watched table", async () => {
    const run = jest.fn(() => "first");
    const { result } = await renderHook(() => useLiveTables(run, ["routines", "sessions"]));
    expect(result.current).toBe("first");
    expect(run).toHaveBeenCalledTimes(1);

    run.mockReturnValue("second");
    await act(async () => {
      change("sessions");
      jest.runAllTimers();
    });
    expect(result.current).toBe("second");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("coalesces a burst of changes into one read and ignores other tables", async () => {
    const run = jest.fn(() => 0);
    await renderHook(() => useLiveTables(run, ["routines"]));

    await act(async () => {
      change("settings");
      jest.runAllTimers();
    });
    expect(run).toHaveBeenCalledTimes(1);

    await act(async () => {
      change("routines");
      change("routines");
      change("routines");
      jest.runAllTimers();
    });
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("unsubscribes on unmount and drops a refresh that was still pending", async () => {
    const run = jest.fn(() => 0);
    const { unmount } = await renderHook(() => useLiveTables(run, ["routines"]));

    await act(async () => change("routines"));
    await unmount();
    await act(async () => jest.runAllTimers());

    expect(remove).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("re-subscribes when the tables or deps change, not on every render", async () => {
    const run = jest.fn(() => 0);
    const { rerender } = await renderHook(
      ({ tables, deps }: Props) => useLiveTables(run, tables, deps),
      { initialProps: { tables: ["routines"], deps: [1] } },
    );
    expect(addDatabaseChangeListener).toHaveBeenCalledTimes(1);

    await rerender({ tables: ["routines"], deps: [1] });
    expect(addDatabaseChangeListener).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);

    await rerender({ tables: ["routines"], deps: [2] });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(addDatabaseChangeListener).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenCalledTimes(2);

    await rerender({ tables: ["routines", "sessions"], deps: [2] });
    expect(addDatabaseChangeListener).toHaveBeenCalledTimes(3);
  });
});
