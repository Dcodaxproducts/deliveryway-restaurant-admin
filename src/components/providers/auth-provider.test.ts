import { describe, expect, it } from "vitest";

import { isAuthInitializationCurrent } from "@/lib/auth-initialization";

describe("AuthProvider initialization race", () => {
  it("does not clear a newly successful login when stale initialization finishes", () => {
    let revision = 0;
    const initializationRevision = revision;
    let activeAccessToken: string | null = "expired-access-token";

    revision += 1;
    activeAccessToken = "new-login-access-token";

    if (isAuthInitializationCurrent(revision, initializationRevision)) {
      activeAccessToken = null;
    }

    expect(activeAccessToken).toBe("new-login-access-token");
  });

  it("still applies initialization results when no login supersedes them", () => {
    const revision = 0;

    expect(isAuthInitializationCurrent(revision, revision)).toBe(true);
  });
});
