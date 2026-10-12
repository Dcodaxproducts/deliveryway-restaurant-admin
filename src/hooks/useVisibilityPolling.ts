"use client";

import { useEffect, useRef } from "react";

import { startVisibilityPolling } from "@/lib/visibility-polling";

type UseVisibilityPollingOptions = {
  enabled?: boolean;
  intervalMs: number;
  poll: () => Promise<void> | void;
};

export function useVisibilityPolling({
  enabled = true,
  intervalMs,
  poll,
}: UseVisibilityPollingOptions) {
  const pollRef = useRef(poll);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    if (!enabled) return;

    return startVisibilityPolling({
      document,
      intervalMs,
      poll: () => pollRef.current(),
    });
  }, [enabled, intervalMs]);
}
