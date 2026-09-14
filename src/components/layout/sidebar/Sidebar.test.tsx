import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/layout/sidebar/Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { role: "BUSINESS_ADMIN", actorType: "BUSINESS_ADMIN" },
    role: "BUSINESS_ADMIN",
    isBranchAdmin: false,
    logout: vi.fn(),
  }),
}));

describe("Sidebar desktop collapse presentation", () => {
  it("renders the full navigation and collapse control when expanded", () => {
    const markup = renderToStaticMarkup(
      <Sidebar collapsed={false} onCollapsedChange={vi.fn()} />,
    );

    expect(markup).toContain('data-collapsed="false"');
    expect(markup).toContain("w-72");
    expect(markup).toContain('aria-label="collapseSidebar"');
    expect(markup).toContain(">dashboard<");
    expect(markup).toContain(">accountSettings<");
  });

  it("keeps labelled navigation icons and hides expanded-only content", () => {
    const markup = renderToStaticMarkup(
      <Sidebar collapsed onCollapsedChange={vi.fn()} />,
    );

    expect(markup).toContain('data-collapsed="true"');
    expect(markup).toContain("w-20");
    expect(markup).toContain('aria-label="expandSidebar"');
    expect(markup).toContain('aria-label="dashboard"');
    expect(markup).toContain('aria-label="logout"');
    expect(markup).not.toContain(">accountSettings<");
    expect(markup).not.toContain(">needHelp<");
  });

  it("keeps the uncontrolled mobile drawer expanded without a desktop toggle", () => {
    const markup = renderToStaticMarkup(<Sidebar />);

    expect(markup).toContain('data-collapsed="false"');
    expect(markup).toContain("w-72");
    expect(markup).not.toContain('aria-label="collapseSidebar"');
  });
});
