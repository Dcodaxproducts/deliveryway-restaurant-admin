import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Phase 3 reports and promotions screen family", () => {
  it("uses canonical report tabs, filters, sections, and states", () => {
    const reports = projectFile(
      "src/components/pages/reports/pages/ReportsPage.tsx",
    );

    expect(reports).toContain("<PageTabs");
    expect(reports).toContain("<FilterBar");
    expect(reports).toContain("<SectionCard");
    expect(reports).toContain("<ReportSummaryError");
    expect(reports).toContain("<StatsSection");
  });

  it("uses one reusable promotion shell, tab owner, and form system", () => {
    const management = projectFile(
      "src/components/pages/promotions/pages/PromotionManagementPage.tsx",
    );
    const tabs = projectFile(
      "src/components/pages/Promotions/components/PromotionManagement/PromotionTabs.tsx",
    );
    const wrapper = projectFile(
      "src/components/pages/Promotions/forms/PageWrapper.tsx",
    );
    const section = projectFile(
      "src/components/pages/Promotions/forms/Section.tsx",
    );

    expect(management).toContain("<SectionCard");
    expect(management).toContain('<StatePanel state="loading"');
    expect(tabs).toContain("<PageTabs");
    expect(wrapper).toContain("<Container>");
    expect(wrapper).toContain("<PageHeader");
    expect(wrapper).toContain("<FormLayout>");
    expect(section).toContain("<FormSection");
  });

  it("standardizes promotion forms and gift-card filters", () => {
    const formPaths = [
      "src/components/pages/Promotions/forms/AddCoupon/AddCoupon.tsx",
      "src/components/pages/Promotions/forms/AddHappyHour/AddHappyHour.tsx",
      "src/components/pages/Promotions/forms/AddNewPromotion/AddNewPromotion.tsx",
      "src/components/pages/Promotions/gift-cards/components/GiftCardForm.tsx",
    ];
    const giftCardFilters = projectFile(
      "src/components/pages/Promotions/gift-cards/components/GiftCardsFilters.tsx",
    );

    for (const path of formPaths) {
      expect(projectFile(path)).toContain("<FormActions");
    }
    expect(giftCardFilters).toContain("<FilterBar");
  });

  it("gives coupons real states, responsive presentation, and no fake KPIs", () => {
    const couponsPage = projectFile(
      "src/components/pages/Promotions/components/PromotionManagement/CouponsPage/CouponsPage.tsx",
    );
    const couponTable = projectFile(
      "src/components/pages/Promotions/components/PromotionManagement/CouponsPage/table.tsx",
    );

    expect(couponsPage).not.toContain('value="10"');
    expect(couponsPage).not.toContain('value="3"');
    expect(couponTable).toContain('state="loading"');
    expect(couponTable).toContain('state="error"');
    expect(couponTable).toContain('className="grid gap-3 md:hidden"');
    expect(couponTable).toContain("<ResponsiveDialog");
  });

  it("preserves report export, promotion mutation, and scope contracts", () => {
    const reports = projectFile(
      "src/components/pages/reports/pages/ReportsPage.tsx",
    );
    const coupon = projectFile(
      "src/components/pages/Promotions/forms/AddCoupon/AddCoupon.tsx",
    );
    const happyHour = projectFile(
      "src/components/pages/Promotions/forms/AddHappyHour/AddHappyHour.tsx",
    );
    const promotion = projectFile(
      "src/components/pages/Promotions/forms/AddNewPromotion/AddNewPromotion.tsx",
    );

    expect(reports).toContain("useGetFinancialReport(");
    expect(reports).toContain("downloadRestaurantDashboardReportPdf({");
    expect(coupon).toContain("useCreateCoupon()");
    expect(coupon).toContain("useUpdateCoupon()");
    expect(happyHour).toContain("useCreateAdminHappyHour()");
    expect(promotion).toContain("useCreateAdminPromotionCampaign()");
    expect(promotion).toContain("isBranchAdmin");
  });
});
