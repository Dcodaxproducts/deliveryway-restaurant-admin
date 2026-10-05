import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPendingOrderRecovery,
  getPendingOrderRetryDelayMs,
  shouldRunPendingOrderRecovery,
} from "@/hooks/pending-order-recovery";

afterEach(() => {
  vi.useRealTimers();
});

describe("pending order recovery", () => {
  it("uses one in-flight request for simultaneous triggers", async () => {
    let resolveRequest: ((value: string) => void) | undefined;
    const request = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const onSuccess = vi.fn();
    const recover = createPendingOrderRecovery({
      request,
      onSuccess,
      isActive: () => true,
    });

    const first = recover();
    const second = recover();
    resolveRequest?.("claimed");
    await Promise.all([first, second]);

    expect(request).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("claimed");
  });

  it("respects Retry-After and does not immediately retry a 429", async () => {
    vi.useFakeTimers();
    const request = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({
        response: { status: 429, headers: { "retry-after": "60" } },
      })
      .mockResolvedValue("claimed");
    const recover = createPendingOrderRecovery({
      request,
      onSuccess: vi.fn(),
      isActive: () => true,
      now: () => Date.now(),
    });

    await recover();
    await recover();
    expect(request).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(59_999);
    await recover();
    expect(request).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await recover();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("bounds exponential backoff when Retry-After is absent", () => {
    expect(getPendingOrderRetryDelayMs({}, 1, 0)).toBe(15_000);
    expect(getPendingOrderRetryDelayMs({}, 2, 0)).toBe(30_000);
    expect(getPendingOrderRetryDelayMs({}, 20, 0)).toBe(300_000);
  });

  it("polls only while visible and the realtime socket is disconnected", () => {
    expect(
      shouldRunPendingOrderRecovery({
        socketConnected: false,
        visibilityState: "visible",
      }),
    ).toBe(true);
    expect(
      shouldRunPendingOrderRecovery({
        socketConnected: true,
        visibilityState: "visible",
      }),
    ).toBe(false);
    expect(
      shouldRunPendingOrderRecovery({
        socketConnected: false,
        visibilityState: "hidden",
      }),
    ).toBe(false);
  });
});
