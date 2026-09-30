import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearTableAssignment,
  getTableAssignment,
  parseTableAssignments,
  readTableAssignments,
  setTableAssignment,
  subscribeTableAssignments,
  TABLE_ASSIGNMENTS_EVENT,
  TABLE_ASSIGNMENTS_STORAGE_KEY,
} from "@/lib/table-reservation-assignments";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe("device-local table assignments", () => {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    listeners.clear();
    vi.stubGlobal("window", {
      localStorage: storage,
      addEventListener: (type: string, listener: (event: Event) => void) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: (event: Event) => void) => {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((listener) => listener(event));
        return true;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores, reads, trims, and clears labels per reservation", () => {
    setTableAssignment("res-1", "  T4 ", new Date("2026-09-30T10:00:00.000Z"));
    expect(getTableAssignment("res-1")).toBe("T4");
    expect(readTableAssignments()["res-1"]?.updatedAt).toBe("2026-09-30T10:00:00.000Z");
    expect(storage.getItem(TABLE_ASSIGNMENTS_STORAGE_KEY)).toContain('"T4"');

    setTableAssignment("res-1", "   ");
    expect(getTableAssignment("res-1")).toBeNull();
    expect(storage.getItem(TABLE_ASSIGNMENTS_STORAGE_KEY)).toBeNull();
  });

  it("notifies subscribers and ignores clears for unknown ids", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeTableAssignments(onChange);

    setTableAssignment("res-2", "Bar 1");
    clearTableAssignment("missing");
    expect(onChange).toHaveBeenCalledTimes(1);

    clearTableAssignment("res-2");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(listeners.get(TABLE_ASSIGNMENTS_EVENT)?.size).toBe(1);

    unsubscribe();
    expect(listeners.get(TABLE_ASSIGNMENTS_EVENT)?.size).toBe(0);
  });

  it("drops malformed or empty stored entries instead of crashing", () => {
    expect(parseTableAssignments("not json")).toEqual({});
    expect(parseTableAssignments(JSON.stringify([1, 2]))).toEqual({});
    expect(
      parseTableAssignments(
        JSON.stringify({
          keep: { tableLabel: "T1", updatedAt: "2026-09-30T10:00:00.000Z" },
          blank: { tableLabel: "   " },
          wrong: { tableLabel: 4 },
          none: null,
        })
      )
    ).toEqual({ keep: { tableLabel: "T1", updatedAt: "2026-09-30T10:00:00.000Z" } });
  });
});

describe("table assignments without a window", () => {
  it("returns an empty snapshot and no-op subscription during SSR", () => {
    expect(readTableAssignments()).toEqual({});
    expect(getTableAssignment("res-1")).toBeNull();
    expect(() => setTableAssignment("res-1", "T1")).not.toThrow();
    expect(typeof subscribeTableAssignments(() => undefined)).toBe("function");
  });
});
