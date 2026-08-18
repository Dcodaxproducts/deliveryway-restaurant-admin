import { describe, expect, it } from "vitest";

import {
  getNewOrderToastId,
  shouldDismissNewOrderToast,
} from "@/hooks/realtime-order-state";

describe("realtime order notification state", () => {
  it("uses one stable popup id for immediate and scheduled order events", () => {
    expect(getNewOrderToastId("order-immediate")).toBe(
      "new-order:order-immediate",
    );
    expect(getNewOrderToastId("order-scheduled")).toBe(
      "new-order:order-scheduled",
    );
  });

  it("keeps a placed popup visible until another device changes status", () => {
    expect(shouldDismissNewOrderToast("PLACED")).toBe(false);
    expect(shouldDismissNewOrderToast("CONFIRMED")).toBe(true);
    expect(shouldDismissNewOrderToast("CANCELLED")).toBe(true);
  });
});
