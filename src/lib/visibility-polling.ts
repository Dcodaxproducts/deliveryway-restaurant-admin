export type VisibilityDocument = {
  visibilityState: DocumentVisibilityState;
  addEventListener: (
    type: "visibilitychange",
    listener: EventListenerOrEventListenerObject,
  ) => void;
  removeEventListener: (
    type: "visibilitychange",
    listener: EventListenerOrEventListenerObject,
  ) => void;
};

type VisibilityPollingOptions = {
  document: VisibilityDocument;
  intervalMs: number;
  poll: () => Promise<void> | void;
};

export function startVisibilityPolling({
  document,
  intervalMs,
  poll,
}: VisibilityPollingOptions) {
  let stopped = false;
  let running = false;
  let rerunRequested = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const schedule = () => {
    clearTimer();
    if (stopped || document.visibilityState !== "visible") return;

    timer = setTimeout(() => {
      timer = undefined;
      void run();
    }, intervalMs);
  };

  const run = async () => {
    if (stopped || document.visibilityState !== "visible") return;
    if (running) {
      rerunRequested = true;
      return;
    }

    running = true;
    rerunRequested = false;

    try {
      await poll();
    } catch {
      // A transient request failure must not stop future polling attempts.
    } finally {
      running = false;

      if (stopped || document.visibilityState !== "visible") return;
      if (rerunRequested) {
        void run();
        return;
      }

      schedule();
    }
  };

  const handleVisibilityChange = () => {
    clearTimer();

    if (document.visibilityState !== "visible") {
      rerunRequested = false;
      return;
    }

    void run();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  if (document.visibilityState === "visible") {
    void run();
  }

  return () => {
    stopped = true;
    rerunRequested = false;
    clearTimer();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
