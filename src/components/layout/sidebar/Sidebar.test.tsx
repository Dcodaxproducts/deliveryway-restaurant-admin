import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
    expect(markup).toContain('class="group/menu-item relative group/collapsible"');
    expect(markup).toContain(">dashboard<");
  });

  it("uses shadcn icon collapse and tooltip labels", () => {
    const markup = renderSidebar(false);

    expect(markup).toContain('data-state="collapsed"');
    expect(markup).toContain('data-collapsible="icon"');
    expect(markup).toContain('data-slot="sidebar-menu-button"');
    expect(markup).toContain("[scrollbar-width:none]");
  });
});
