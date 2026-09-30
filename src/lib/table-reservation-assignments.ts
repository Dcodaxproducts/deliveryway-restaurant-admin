import { useCallback, useSyncExternalStore } from "react";

/**
 * Device-local table assignments for reservations.
 *
 * The admin reservation API has no table field and no endpoint to persist one, so the
 * assignment lives in `localStorage` on the device that made it. It is presentation-side
 * state only and is cleared when a reservation reaches a terminal status.
 */
export const TABLE_ASSIGNMENTS_STORAGE_KEY = "feastflow.partner.table-reservation-assignments";
export const TABLE_ASSIGNMENTS_EVENT = "feastflow:table-reservation-assignments";

export type TableAssignment = {
  tableLabel: string;
  updatedAt: string;
};

export type TableAssignments = Readonly<Record<string, TableAssignment>>;

const EMPTY_ASSIGNMENTS: TableAssignments = Object.freeze({});

let cache: { raw: string | null; value: TableAssignments } | null = null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const parseTableAssignments = (raw: string | null): TableAssignments => {
  if (!raw) return EMPTY_ASSIGNMENTS;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_ASSIGNMENTS;

    const entries = Object.entries(parsed).flatMap(([reservationId, value]) => {
      if (!isRecord(value) || typeof value.tableLabel !== "string") return [];
      const tableLabel = value.tableLabel.trim();
      if (!tableLabel) return [];

      return [
        [
          reservationId,
          {
            tableLabel,
            updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
          },
        ] as const,
      ];
    });

    return Object.fromEntries(entries);
  } catch {
    return EMPTY_ASSIGNMENTS;
  }
};

export const readTableAssignments = (): TableAssignments => {
  const storage = getStorage();
  if (!storage) return EMPTY_ASSIGNMENTS;

  const raw = storage.getItem(TABLE_ASSIGNMENTS_STORAGE_KEY);
  if (cache && cache.raw === raw) return cache.value;

  cache = { raw, value: parseTableAssignments(raw) };
  return cache.value;
};

const writeTableAssignments = (assignments: TableAssignments) => {
  const storage = getStorage();
  if (!storage) return;

  if (Object.keys(assignments).length === 0) {
    storage.removeItem(TABLE_ASSIGNMENTS_STORAGE_KEY);
  } else {
    storage.setItem(TABLE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  }

  cache = null;
  window.dispatchEvent(new Event(TABLE_ASSIGNMENTS_EVENT));
};

export const getTableAssignment = (reservationId: string): string | null =>
  readTableAssignments()[reservationId]?.tableLabel ?? null;

export const setTableAssignment = (reservationId: string, tableLabel: string, now = new Date()) => {
  const label = tableLabel.trim();
  const current = readTableAssignments();

  if (!label) {
    clearTableAssignment(reservationId);
    return;
  }

  writeTableAssignments({
    ...current,
    [reservationId]: { tableLabel: label, updatedAt: now.toISOString() },
  });
};

export const clearTableAssignment = (reservationId: string) => {
  const current = readTableAssignments();
  if (!(reservationId in current)) return;

  const next = { ...current };
  delete next[reservationId];
  writeTableAssignments(next);
};

export const subscribeTableAssignments = (onChange: () => void) => {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TABLE_ASSIGNMENTS_STORAGE_KEY) onChange();
  };

  window.addEventListener(TABLE_ASSIGNMENTS_EVENT, onChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(TABLE_ASSIGNMENTS_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
};

const getServerSnapshot = () => EMPTY_ASSIGNMENTS;

export function useTableAssignments() {
  const assignments = useSyncExternalStore(
    subscribeTableAssignments,
    readTableAssignments,
    getServerSnapshot
  );

  const assign = useCallback((reservationId: string, tableLabel: string) => {
    setTableAssignment(reservationId, tableLabel);
  }, []);

  const clear = useCallback((reservationId: string) => {
    clearTableAssignment(reservationId);
  }, []);

  const getLabel = useCallback(
    (reservationId: string) => assignments[reservationId]?.tableLabel ?? null,
    [assignments]
  );

  return { assignments, assign, clear, getLabel };
}
