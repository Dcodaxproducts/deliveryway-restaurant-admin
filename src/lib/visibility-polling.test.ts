import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  startVisibilityPolling,
  type VisibilityDocument,
} from "@/lib/visibility-polling";

class FakeVisibilityDocument implements VisibilityDocument {
  visibilityState: DocumentVisibilityState = "visible";
  private readonly listeners = new Set<EventListenerOrEventListenerObject>();

  addEventListener(
    _type: "visibilitychange",
    listener: EventListenerOrEventListenerObject,
  ) {
    this.listeners.add(listener);
  }

  removeEventListener(
    _type: "visibilitychange",
    listener: EventListenerOrEventListenerObject,
  ) {
    this.listeners.delete(listener);
  }

  setVisibility(state: DocumentVisibilityState) {
    this.visibilityState = state;
    const event = { type: "visibilitychange" } as Event;

    for (const listener of this.listeners) {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    }
  }

  get listenerCount() {
    return this.listeners.size;
  }
}

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("startVisibilityPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls immediately, then waits for completion before scheduling again", async () => {
    const document = new FakeVisibilityDocument();
    let resolvePoll: (() => void) | undefined;
    const poll = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePoll = resolve;
        }),
    );

    const stop = startVisibilityPolling({ document, intervalMs: 1_000, poll });

    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(poll).toHaveBeenCalledTimes(1);

    resolvePoll?.();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(999);
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(2);

    stop();
  });

  it("does not poll while hidden and polls immediately when visible", async () => {
    const document = new FakeVisibilityDocument();
    document.visibilityState = "hidden";
    const poll = vi.fn(async () => undefined);

    const stop = startVisibilityPolling({ document, intervalMs: 1_000, poll });

    await vi.advanceTimersByTimeAsync(5_000);
    expect(poll).not.toHaveBeenCalled();

    document.setVisibility("visible");
    expect(poll).toHaveBeenCalledTimes(1);
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(poll).toHaveBeenCalledTimes(2);

    stop();
  });

  it("never overlaps when visibility resumes during an active poll", async () => {
    const document = new FakeVisibilityDocument();
    let resolvePoll: (() => void) | undefined;
    const poll = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePoll = resolve;
        }),
    );

    const stop = startVisibilityPolling({ document, intervalMs: 1_000, poll });

    document.setVisibility("hidden");
    document.setVisibility("visible");
    document.setVisibility("hidden");
    document.setVisibility("visible");
    expect(poll).toHaveBeenCalledTimes(1);

    resolvePoll?.();
    await flushPromises();
    expect(poll).toHaveBeenCalledTimes(2);

    stop();
  });

  it("cleans up its timer and visibility listener", async () => {
    const document = new FakeVisibilityDocument();
    const poll = vi.fn(async () => undefined);
    const stop = startVisibilityPolling({ document, intervalMs: 1_000, poll });

    expect(document.listenerCount).toBe(1);
    await flushPromises();
    stop();
    expect(document.listenerCount).toBe(0);

    await vi.advanceTimersByTimeAsync(5_000);
    document.setVisibility("visible");
    expect(poll).toHaveBeenCalledTimes(1);
  });
});
