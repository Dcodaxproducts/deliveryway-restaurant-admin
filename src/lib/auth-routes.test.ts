import { describe, expect, it } from "vitest";

import { buildLoginRoute, getSafeRedirectPath } from "./auth-routes";

describe("auth route helpers", () => {
  it("defaults null redirects to /", () => {
    expect(getSafeRedirectPath(null)).toBe("/");
  });

  it("defaults undefined redirects to /", () => {
    expect(getSafeRedirectPath(undefined)).toBe("/");
  });

  it("preserves internal path with search and hash", () => {
    expect(getSafeRedirectPath("/orders?page=2#active")).toBe("/orders?page=2#active");
  });

  it("resolves same-origin absolute URLs to internal paths", () => {
    expect(getSafeRedirectPath("https://deliveryways.local/reports?tab=sales#daily")).toBe(
      "/reports?tab=sales#daily"
    );
  });

  it("rejects external URLs", () => {
    expect(getSafeRedirectPath("https://evil.com/orders")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(getSafeRedirectPath("//evil.com/orders")).toBe("/");
  });

  it("rejects hostile protocols", () => {
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("falls back when redirect points back to login", () => {
    expect(getSafeRedirectPath("/login")).toBe("/");
  });

  it("unwraps nested login redirects to the first safe app route", () => {
    expect(
      getSafeRedirectPath("/login?redirect=%2Flogin%3Fredirect%3D%252Forders")
    ).toBe("/orders");
  });

  it("falls back when nested login redirects never leave login", () => {
    expect(
      getSafeRedirectPath(
        "/login?redirect=%2Flogin%3Fredirect%3D%252Flogin%253Fredirect%253D%25252Flogin"
      )
    ).toBe("/");
  });

  it("encodes redirect query values", () => {
    expect(buildLoginRoute("/orders?page=2#active")).toBe(
      "/login?redirect=%2Forders%3Fpage%3D2%23active"
    );
  });
});
