import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("reported Partner UI follow-up", () => {
  it("keeps empty result counters out of Contact Submissions and Gift Cards", () => {
    const contactSubmissions = projectFile(
      "src/components/pages/ContactSubmissions/pages/ContactSubmissionsPage.tsx",
    );
    const giftCardsHeader = projectFile(
      "src/components/pages/Promotions/gift-cards/components/GiftCardsHeader.tsx",
    );
    const giftCardsFilters = projectFile(
      "src/components/pages/Promotions/gift-cards/components/GiftCardsFilters.tsx",
    );
    const giftCardsPage = projectFile(
      "src/components/pages/Promotions/gift-cards/pages/GiftCardsPage.tsx",
    );
    const giftCardsHook = projectFile("src/hooks/useGiftCards.ts");

    expect(contactSubmissions).toContain("meta.total > 0");
    expect(giftCardsHeader).not.toContain("total.toLocaleString()");
    expect(giftCardsFilters).toContain("totalCount > 0 || isFetching");
    expect(giftCardsPage).toContain('commonT("selectRestaurantRequired")');
    expect(giftCardsHook).toContain("enabled: Boolean(params.restaurantId)");
  });

  it("keeps nested time selection open and increments tips in whole units", () => {
    const dateTimeInputs = projectFile(
      "src/components/common/DateTimeInputs.tsx",
    );
    const posCart = projectFile(
      "src/components/pages/Pos/components/pos/PosCart.tsx",
    );

    expect(dateTimeInputs).toContain("onInteractOutside");
    expect(dateTimeInputs).toContain('[data-slot="select-content"]');
    const tipInput = posCart.slice(
      posCart.indexOf("value={tipAmount}"),
      posCart.indexOf("value={tipAmount}") + 300,
    );

    expect(tipInput).toContain('step="1"');
    expect(tipInput).not.toContain('step="0.01"');
  });

  it("uses the requested responsive customer grid and shared employee tabs", () => {
    const customerStats = projectFile(
      "src/components/pages/Customers/components/customer-settings/stats-section.tsx",
    );
    const employees = projectFile(
      "src/components/pages/employees/pages/EmployeesSettingsPage.tsx",
    );

    expect(customerStats).toContain("columns={4}");
    expect(employees).toContain("<PageTabs");
    expect(employees).toContain('showRoleBreakdown={activeTab === "roles"}');
  });

  it("renders a structured sidebar skeleton and only real menu ratings", () => {
    const appShell = projectFile("src/components/layout/AppShell.tsx");
    const skeleton = projectFile("src/components/ui/skeleton.tsx");
    const globalStyles = projectFile("src/app/globals.css");
    const navbar = projectFile("src/components/layout/navbar/navbar.tsx");
    const globalSearch = projectFile(
      "src/components/layout/navbar/GlobalSearch.tsx",
    );
    const menuItemCard = projectFile("src/components/cards/MenuItemCard.tsx");

    expect(appShell).toContain('data-slot="sidebar-loading-skeleton"');
    expect(appShell).not.toContain("bg-neutral-200");
    expect(skeleton).toContain("bg-[var(--ui-skeleton)]");
    expect(skeleton).not.toContain("bg-accent");
    expect(globalStyles).toContain("--ui-skeleton: #E9E9E9");
    expect(navbar).toContain("md:w-[220px] xl:w-[280px]");
    expect(globalSearch).toContain("hidden min-w-0 max-w-7xl flex-1");
    expect(menuItemCard).toContain("getDisplayRating");
    expect(menuItemCard).not.toContain(">4.5<");
    expect(menuItemCard).toContain('density === "compact" ? "min-h-0"');
  });

  it("uses the shared page system for FAQs and the Legal & Tax Profile", () => {
    const faqPage = projectFile(
      "src/components/pages/Settings/faqs/components/faqs/FaqManagerPage.tsx",
    );
    const legalProfile = projectFile(
      "src/components/pages/Settings/pages/LegalProfilePage.tsx",
    );

    for (const source of [faqPage, legalProfile]) {
      expect(source).toContain("<PageLayout");
      expect(source).toContain("<PageHeader");
      expect(source).toContain("<SectionCard");
      expect(source).toContain("<StatePanel");
    }

    expect(faqPage).toContain("<FilterBar");
    expect(faqPage).toContain("<PromotionStatCard");
    expect(faqPage).toContain("<StatusBadge");
    expect(faqPage).not.toContain("<Star");
    expect(faqPage).not.toContain("<Sparkles");
    expect(faqPage).not.toContain(" as any");
    expect(legalProfile).toContain("actions={");
    expect(legalProfile).toContain('state="loading"');
    expect(legalProfile).toContain("var(--ui-surface-subtle)");
  });
});
