export const isAuthInitializationCurrent = (
  currentRevision: number,
  initializationRevision: number,
) => currentRevision === initializationRevision;
