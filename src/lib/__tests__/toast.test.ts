import { toast, useToastStore } from "@/lib/toast";

beforeEach(() => useToastStore.getState().hide());

describe("toast", () => {
  it("shows the latest message with its kind and hides", () => {
    toast.error("Nope");
    expect(useToastStore.getState().toast).toMatchObject({ message: "Nope", kind: "error" });

    toast.info("Saved");
    expect(useToastStore.getState().toast).toMatchObject({ message: "Saved", kind: "info" });

    useToastStore.getState().hide();
    expect(useToastStore.getState().toast).toBeNull();
  });
});
