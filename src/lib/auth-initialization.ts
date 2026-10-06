export const isAuthInitializationCurrent = (
  currentRevision: number,
  initializationRevision: number,
) => currentRevision === initializationRevision;

export type AuthStorageSyncSource = "same-tab" | "cross-tab";

export const nextAuthRevisionForStorageSync = (
  currentRevision: number,
  source: AuthStorageSyncSource,
) => source === "cross-tab" ? currentRevision + 1 : currentRevision;

export const syncAuthStorageEvent = (
  eventKey: string | null,
  authStorageKey: string,
  sync: () => void,
) => {
  if (eventKey !== null && eventKey !== authStorageKey) return false;
  sync();
  return true;
};
