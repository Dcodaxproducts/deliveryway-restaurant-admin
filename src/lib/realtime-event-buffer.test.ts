import { describe, expect, it } from "vitest";

import {
  ExactEventIdDedupe,
  ReconnectEventBuffer,
  isRealtimeTransportEnabled,
} from "@/lib/realtime-event-buffer";

describe("realtime feature flag", () => {
  it("is enabled by default and supports an explicit rollback switch", () => {
    expect(isRealtimeTransportEnabled()).toBe(true);
    expect(isRealtimeTransportEnabled("true")).toBe(true);
    expect(isRealtimeTransportEnabled("false")).toBe(false);
  });
  it("does not treat differently cased values as the rollback switch", () => {
    expect(isRealtimeTransportEnabled("FALSE")).toBe(true);
  });
  it("keeps empty deployment values enabled", () => {
    expect(isRealtimeTransportEnabled("")).toBe(true);
  });
});

describe("ExactEventIdDedupe", () => {
  it("drops only exact replays and accepts unseen out-of-order ids", () => {
    const dedupe = new ExactEventIdDedupe(3);
    expect(dedupe.accept("order-1", "100")).toBe(true);
    expect(dedupe.accept("order-1", "100")).toBe(false);
    expect(dedupe.accept("order-1", "2")).toBe(true);
    expect(dedupe.accept("order-1", "99")).toBe(true);
  });
  it("is bounded per aggregate and never conflates aggregates", () => {
    const dedupe = new ExactEventIdDedupe(2);
    expect(dedupe.accept("order-1", "1")).toBe(true);
    expect(dedupe.accept("order-1", "2")).toBe(true);
    expect(dedupe.accept("order-1", "3")).toBe(true);
    expect(dedupe.accept("order-1", "1")).toBe(true);
    expect(dedupe.accept("order-2", "3")).toBe(true);
  });
  it("accepts compatibility events without an event id", () => {
    const dedupe = new ExactEventIdDedupe();
    expect(dedupe.accept("order-1")).toBe(true);
    expect(dedupe.accept("order-1")).toBe(true);
  });
  it("keeps identical ids independent across aggregates", () => {
    const dedupe = new ExactEventIdDedupe();
    expect(dedupe.accept("order-1", "7")).toBe(true);
    expect(dedupe.accept("order-2", "7")).toBe(true);
  });
  it("clears replay history on an explicit scope reset", () => {
    const dedupe = new ExactEventIdDedupe();
    expect(dedupe.accept("order-1", "7")).toBe(true);
    expect(dedupe.accept("order-1", "7")).toBe(false);
    dedupe.clear();
    expect(dedupe.accept("order-1", "7")).toBe(true);
  });
  it("does not compare decimal ids numerically", () => {
    const dedupe = new ExactEventIdDedupe();
    expect(dedupe.accept("thread-1", "9007199254740993")).toBe(true);
    expect(dedupe.accept("thread-1", "1")).toBe(true);
  });
  it("retains an id across unrelated intervening events", () => {
    const dedupe = new ExactEventIdDedupe(3);
    expect(dedupe.accept("order-1", "1")).toBe(true);
    expect(dedupe.accept("order-1", "2")).toBe(true);
    expect(dedupe.accept("order-1", "1")).toBe(false);
  });
  it("evicts only after the configured per-aggregate bound", () => {
    const dedupe = new ExactEventIdDedupe(2);
    expect(dedupe.accept("order-1", "1")).toBe(true);
    expect(dedupe.accept("order-1", "2")).toBe(true);
    expect(dedupe.accept("order-1", "1")).toBe(false);
    expect(dedupe.accept("order-1", "3")).toBe(true);
    expect(dedupe.accept("order-1", "1")).toBe(true);
  });
  it("bounds aggregate histories independently", () => {
    const dedupe = new ExactEventIdDedupe(2, 1);
    expect(dedupe.accept("order-1", "1")).toBe(true);
    expect(dedupe.accept("order-2", "1")).toBe(true);
    expect(dedupe.accept("order-1", "1")).toBe(true);
  });
});

describe("ReconnectEventBuffer", () => {
  it("buffers until HTTP resync completes, then preserves arrival order", () => {
    const buffer = new ReconnectEventBuffer<string>();
    const applied: string[] = [];
    buffer.push("during-resync-1", (event) => applied.push(event));
    buffer.push("during-resync-2", (event) => applied.push(event));
    expect(applied).toEqual([]);
    buffer.resynced((event) => applied.push(event));
    expect(applied).toEqual(["during-resync-1", "during-resync-2"]);
    buffer.push("healthy", (event) => applied.push(event));
    expect(applied.at(-1)).toBe("healthy");
  });
  it("bounds events accumulated during resync", () => {
    const buffer = new ReconnectEventBuffer<string>(2);
    const applied: string[] = [];
    buffer.push("oldest", (event) => applied.push(event));
    buffer.push("middle", (event) => applied.push(event));
    buffer.push("latest", (event) => applied.push(event));
    buffer.resynced((event) => applied.push(event));
    expect(applied).toEqual(["middle", "latest"]);
  });
  it("applies healthy events immediately", () => {
    const buffer = new ReconnectEventBuffer<string>();
    const applied: string[] = [];
    buffer.resynced((event) => applied.push(event));
    buffer.push("instant", (event) => applied.push(event));
    expect(applied).toEqual(["instant"]);
  });
  it("returns to buffering after disconnect", () => {
    const buffer = new ReconnectEventBuffer<string>();
    const applied: string[] = [];
    buffer.resynced((event) => applied.push(event));
    buffer.disconnect();
    buffer.push("offline", (event) => applied.push(event));
    expect(applied).toEqual([]);
    buffer.resynced((event) => applied.push(event));
    expect(applied).toEqual(["offline"]);
  });
  it("drops buffered events on lifecycle reset", () => {
    const buffer = new ReconnectEventBuffer<string>();
    const applied: string[] = [];
    buffer.push("stale", (event) => applied.push(event));
    buffer.reset();
    buffer.resynced((event) => applied.push(event));
    expect(applied).toEqual([]);
  });
  it("reports readiness only after resync", () => {
    const buffer = new ReconnectEventBuffer<string>();
    expect(buffer.isReady).toBe(false);
    buffer.resynced(() => undefined);
    expect(buffer.isReady).toBe(true);
    buffer.disconnect();
    expect(buffer.isReady).toBe(false);
  });
  it("supports a single-event reconnect bound", () => {
    const buffer = new ReconnectEventBuffer<string>(1);
    const applied: string[] = [];
    buffer.push("old", (event) => applied.push(event));
    buffer.push("new", (event) => applied.push(event));
    buffer.resynced((event) => applied.push(event));
    expect(applied).toEqual(["new"]);
  });
  it("does not replay an already drained buffer twice", () => {
    const buffer = new ReconnectEventBuffer<string>();
    const applied: string[] = [];
    buffer.push("once", (event) => applied.push(event));
    buffer.resynced((event) => applied.push(event));
    buffer.resynced((event) => applied.push(event));
    expect(applied).toEqual(["once"]);
  });
});
