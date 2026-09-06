import { act, renderHook } from "@testing-library/react-native";
import { useNow } from "@/lib/use-now";

const NOW = 1_700_000_000_000;

beforeEach(() => jest.useFakeTimers({ now: NOW }));
afterEach(() => jest.useRealTimers());

describe("useNow", () => {
  it("re-renders every second with the current time", async () => {
    const { result } = await renderHook(() => useNow());
    expect(result.current).toBe(NOW);

    await act(async () => jest.advanceTimersByTime(999));
    expect(result.current).toBe(NOW);
    await act(async () => jest.advanceTimersByTime(1));
    expect(result.current).toBe(NOW + 1000);
  });

  it("honours a custom interval and stops ticking on unmount", async () => {
    const { result, unmount } = await renderHook(() => useNow(250));
    await act(async () => jest.advanceTimersByTime(250));
    expect(result.current).toBe(NOW + 250);

    const clear = jest.spyOn(global, "clearInterval");
    await unmount();
    expect(clear).toHaveBeenCalledTimes(1);
    clear.mockRestore();
  });
});
