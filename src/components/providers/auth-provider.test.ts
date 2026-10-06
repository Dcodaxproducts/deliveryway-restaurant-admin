import { describe, expect, it, vi } from "vitest";

import {
  isAuthInitializationCurrent,
  nextAuthRevisionForStorageSync,
  syncAuthStorageEvent,
} from "@/lib/auth-initialization";
import { AUTH_STORAGE_KEY } from "@/lib/auth";

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

  it("keeps startup initialization current when its own refresh token write emits the same-tab event", () => {
    const initializationRevision = 4;
    const hydrateAuthoritativeMe = vi.fn();
    const revisionAfterTokenSave = nextAuthRevisionForStorageSync(
      initializationRevision,
      "same-tab",
    );

    expect(revisionAfterTokenSave).toBe(initializationRevision);
    if (isAuthInitializationCurrent(revisionAfterTokenSave, initializationRevision)) {
      hydrateAuthoritativeMe();
    }
    expect(hydrateAuthoritativeMe).toHaveBeenCalledTimes(1);
  });

  it("invalidates startup initialization for a real cross-tab auth change", () => {
    const initializationRevision = 4;
    const revisionAfterCrossTabChange = nextAuthRevisionForStorageSync(
      initializationRevision,
      "cross-tab",
    );

    expect(revisionAfterCrossTabChange).toBe(5);
    expect(
      isAuthInitializationCurrent(revisionAfterCrossTabChange, initializationRevision),
    ).toBe(false);
  });

  it.each(["locale", "order", "pos", "customer"])(
    "ignores unrelated %s storage changes without reloading auth or clearing workspace selection",
    (eventKey) => {
      const reloadAuthAndClearWorkspaceSelection = vi.fn();

      expect(
        syncAuthStorageEvent(
          eventKey,
          AUTH_STORAGE_KEY,
          reloadAuthAndClearWorkspaceSelection,
        ),
      ).toBe(false);
      expect(reloadAuthAndClearWorkspaceSelection).not.toHaveBeenCalled();
    },
  );

  it.each([AUTH_STORAGE_KEY, null])(
    "synchronizes auth for storage key %s",
    (eventKey) => {
      const reloadAuth = vi.fn();

      expect(
        syncAuthStorageEvent(eventKey, AUTH_STORAGE_KEY, reloadAuth),
      ).toBe(true);
      expect(reloadAuth).toHaveBeenCalledTimes(1);
    },
  );
});
