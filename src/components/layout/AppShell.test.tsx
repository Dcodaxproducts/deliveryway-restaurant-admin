import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/layout/ContextGate", () => ({
  default: () => <div>context-gate</div>,
}));

vi.mock("@/components/layout/navbar/navbar", () => ({
  Navbar: () => <div>navbar</div>,
}));

vi.mock("@/components/layout/sidebar/Sidebar", () => ({
  Sidebar: () => <div>sidebar</div>,
}));

const authenticatedState = {
  user: {
    id: "user-1",
    email: "admin@example.com",
    role: "BUSINESS_ADMIN",
    profile: {},
  },
  token: "access-token",
  tenantId: undefined,
  restaurantId: undefined,
  branchId: undefined,
  role: "BUSINESS_ADMIN",
  isBranchAdmin: false,
  isRestaurantAdmin: true,
  scopedParams: {},
  loading: false,
  setUser: vi.fn(),
  logout: vi.fn(),
} as ReturnType<typeof useAuth>;

const renderShell = () =>
  renderToStaticMarkup(
    <AppShell>
      <main>protected-dashboard</main>
    </AppShell>,
  );

describe("AppShell authentication boundary", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
    vi.mocked(useAuth).mockReturnValue(authenticatedState);
  });

  it("hides protected content while authentication is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authenticatedState,
      loading: true,
    });

    const markup = renderShell();
    const loadingSidebar = markup.match(
      /<aside[^>]*data-slot="sidebar-loading-skeleton"[^>]*>/,
    )?.[0];

    expect(markup).not.toContain("protected-dashboard");
    expect(markup).toContain('aria-label="Loading workspace"');
    expect(markup).toContain('data-slot="sidebar-loading-skeleton"');
    expect(markup).toContain("--sidebar-width:16rem");
    expect(markup).toContain("w-(--sidebar-width)");
    expect(markup).toContain("h-[67px]");
    expect(loadingSidebar).not.toContain("w-72");
    expect(markup).not.toContain("md:pl-[19rem]");
    expect(markup).toContain('data-layout="dashboard"');
    expect(markup.match(/h-\[88px\]/g)).toHaveLength(5);
    expect(markup).toContain("animate-pulse");
  });

  it("hides protected content after a missing session is resolved", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authenticatedState,
      user: null,
      token: null,
    });

    const markup = renderShell();

    expect(markup).not.toContain("protected-dashboard");
    expect(markup).toContain('aria-label="Loading workspace"');
    expect(markup).toContain("animate-pulse");
  });

  it("hides protected content when an expired token has been cleared", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authenticatedState,
      token: null,
    });

    const markup = renderShell();

    expect(markup).not.toContain("protected-dashboard");
    expect(markup).toContain('aria-label="Loading workspace"');
    expect(markup).toContain("animate-pulse");
  });

  it("renders protected content for a resolved valid session", () => {
    const markup = renderShell();

    expect(markup).toContain("protected-dashboard");
    expect(markup).toContain('data-slot="sidebar-wrapper"');
    expect(markup).toContain('data-slot="sidebar-inset"');
  });

  it("uses table-shaped loading geometry for collection routes", () => {
    vi.mocked(usePathname).mockReturnValue("/orders");
    vi.mocked(useAuth).mockReturnValue({
      ...authenticatedState,
      loading: true,
    });

    const markup = renderShell();

    expect(markup).toContain('data-layout="list"');
    expect(markup).toContain("min-h-16");
    expect(markup).not.toContain('data-layout="dashboard"');
  });

  it("uses form-shaped loading geometry for edit routes", () => {
    vi.mocked(usePathname).mockReturnValue("/branches/branch-1/edit");
    vi.mocked(useAuth).mockReturnValue({
      ...authenticatedState,
      loading: true,
    });

    const markup = renderShell();

    expect(markup).toContain('data-layout="detail"');
    expect(markup).toContain("xl:grid-cols-[minmax(0,1fr)_20rem]");
  });

  it("keeps public authentication pages visible without a session", () => {
    vi.mocked(usePathname).mockReturnValue("/login");
    vi.mocked(useAuth).mockReturnValue({
      ...authenticatedState,
      user: null,
      token: null,
      loading: true,
    });

    expect(renderShell()).toContain("protected-dashboard");
  });
});
