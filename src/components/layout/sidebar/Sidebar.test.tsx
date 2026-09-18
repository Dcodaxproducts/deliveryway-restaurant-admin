import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

let currentPathname = "/";
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => currentSearchParams,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/common/BrandLogo", () => ({
  default: () => <span>brand-logo</span>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { role: "BUSINESS_ADMIN", actorType: "BUSINESS_ADMIN" },
    role: "BUSINESS_ADMIN",
    isBranchAdmin: false,
    logout: vi.fn(),
  }),
}));

const renderSidebar = (open: boolean) =>
  renderToStaticMarkup(
    <SidebarProvider open={open}>
      <Sidebar />
    </SidebarProvider>,
  );

describe("Partner shadcn sidebar", () => {
  it("uses the official expanded sidebar menu structure", () => {
    const markup = renderSidebar(true);

    expect(markup).toContain('data-slot="sidebar-wrapper"');
    expect(markup).toContain('data-state="expanded"');
    expect(markup).toContain('data-slot="sidebar-menu-button"');
    expect(markup).toContain(
      'class="group/menu-item relative group/collapsible"',
    );
    expect(markup).toContain(">dashboard<");
    expect(markup).toContain("user_logo.png");
    expect(markup).toContain(">needHelp<");
    expect(markup).toContain("data-[active=true]:bg-primary/10");
    expect(markup).toContain("svg]:size-[20px]");
    expect(markup).toContain("flex w-full min-w-0 flex-col gap-1.5");

    const contentIndex = markup.indexOf('data-slot="sidebar-content"');
    const supportCardIndex = markup.indexOf('data-sidebar-support-card="true"');
    const footerIndex = markup.indexOf('data-slot="sidebar-footer"');

    expect(contentIndex).toBeGreaterThan(-1);
    expect(supportCardIndex).toBeGreaterThan(contentIndex);
    expect(footerIndex).toBeGreaterThan(supportCardIndex);
  });

  it("uses shadcn icon collapse and tooltip labels", () => {
    const markup = renderSidebar(false);

    expect(markup).toContain('data-state="collapsed"');
    expect(markup).toContain('data-collapsible="icon"');
    expect(markup).toContain('data-slot="sidebar-menu-button"');
    expect(markup).toContain("[scrollbar-width:none]");
    expect(markup).toContain("group-data-[collapsible=icon]:hidden");
  });

  it.each([
    ["/menu/categories", "/menu", "/menu/categories"],
    [
      "/promotion-management/gift-cards",
      "/promotion-management",
      "/promotion-management/gift-cards",
    ],
  ])(
    "activates only the most specific child for %s",
    (pathname, parentHref, childHref) => {
      currentPathname = pathname;
      currentSearchParams = new URLSearchParams();

      const markup = renderSidebar(true);
      const parentLink = markup.match(
        new RegExp(`<a[^>]*href="${parentHref}"[^>]*>`),
      )?.[0];
      const childLink = markup.match(
        new RegExp(`<a[^>]*href="${childHref}"[^>]*>`),
      )?.[0];

      expect(parentLink).toContain('data-active="false"');
      expect(childLink).toContain('data-active="true"');
    },
  );

  it("uses page tabs as the single owner of order workspace views", () => {
    currentPathname = "/orders";
    currentSearchParams = new URLSearchParams("tab=delivery");

    const markup = renderSidebar(true);

    expect(markup.match(/href="\/orders"/g)).toHaveLength(1);
    expect(markup).not.toContain('href="/orders?tab=delivery"');
    expect(markup).not.toContain(">deliveryOrders<");
  });

  it("keeps the active submenu expanded on a child route", () => {
    currentPathname = "/content-management/about";
    currentSearchParams = new URLSearchParams();

    const markup = renderSidebar(true);
    const activeChildLink = markup.match(
      /<a[^>]*href="\/content-management\/about"[^>]*>/,
    )?.[0];

    expect(activeChildLink).toContain('data-active="true"');
    expect(markup).toContain('data-state="open"');
    expect(markup).toContain(">privacyPolicy<");
  });
});
