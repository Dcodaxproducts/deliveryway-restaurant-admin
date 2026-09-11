import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTranslator, type AbstractIntlMessages } from "next-intl";

import BranchTrashRoute from "@/app/(dashboard)/branches/trash/page";
import CustomerTrashRoute from "@/app/(dashboard)/customer-settings/trash/page";
import DeliverymanTrashRoute from "@/app/(dashboard)/deliveryman/trash/page";
import EmployeeTrashRoute from "@/app/(dashboard)/employees-settings/trash/page";
import MenuTrashRoute from "@/app/(dashboard)/menu/trash/page";
import RestaurantsRoute from "@/app/(dashboard)/restaurants/page";
import InvoicingRoute from "@/app/(dashboard)/invoicing/page";
import RestaurantTable from "@/components/pages/Settings/restaurants/components/restaurants/table";
import en from "@/messages/en.json";
import de from "@/messages/de.json";

const harness = vi.hoisted(() => ({
  locale: "en" as "en" | "de",
  pathname: "/branches/trash",
  ordinaryList: vi.fn(),
  legacyHeader: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => harness.pathname }));
vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useTranslations: (namespace: string) => original.createTranslator({
      locale: harness.locale,
      messages: (harness.locale === "en" ? en : de) as AbstractIntlMessages,
      namespace,
      onError: (error) => { throw error; },
    }),
  };
});

// Guard against mounting ordinary records or unrelated management controls.
vi.mock("@/components/pages/Branches/components/list", () => ({ default: harness.ordinaryList }));
vi.mock("@/components/pages/Customers/components/customer-settings/table", () => ({ default: harness.ordinaryList }));
vi.mock("@/components/pages/Deliverymen/components/deliveryman/table", () => ({ default: harness.ordinaryList }));
vi.mock("@/components/pages/Employees/components/employee-settings/table", () => ({ default: harness.ordinaryList }));
vi.mock("@/components/pages/Menu/legacy/root-menu-components/list", () => ({ default: harness.ordinaryList }));
vi.mock("@/components/pages/Branches/components/header", () => ({ default: harness.legacyHeader }));
vi.mock("@/components/pages/Settings/restaurants/components/restaurants/header", () => ({ default: harness.legacyHeader }));

beforeEach(() => {
  vi.clearAllMocks();
  harness.locale = "en";
  harness.ordinaryList.mockReturnValue(
    <table><tbody><tr><td>Active ordinary record</td></tr></tbody></table>,
  );
  harness.legacyHeader.mockReturnValue(<button>Unrelated management action</button>);
});

describe.each(["en", "de"] as const)("%s localized placeholders", (locale) => {
  const messages = locale === "en" ? en : de;
  const t = createTranslator({ locale, messages, namespace: "common.feedback", onError: (error) => { throw error; } });
  beforeEach(() => { harness.locale = locale; });
  const trashRoutes = [
    { Page: BranchTrashRoute, path: "/branches/trash", back: "/branches", title: messages.branches.trashTitle, subject: "branches" },
    { Page: CustomerTrashRoute, path: "/customer-settings/trash", back: "/customer-settings", title: messages.customers.trashTitle, subject: "customers" },
    { Page: DeliverymanTrashRoute, path: "/deliveryman/trash", back: "/deliveryman", title: messages.deliverymen.trashTitle, subject: "deliverymen" },
    { Page: EmployeeTrashRoute, path: "/employees-settings/trash", back: "/employees-settings", title: messages.employees.trashTitle, subject: "employees" },
    { Page: MenuTrashRoute, path: "/menu/trash", back: "/menu", title: messages.menu.trash.title, subject: "menus" },
  ] as const;

  it.each(trashRoutes)("preserves $path and its title with canonical unavailable feedback", ({ Page, path, title }) => {
    harness.pathname = path;
    const markup = renderToStaticMarkup(<Page />);

    for (const slot of ["page-layout", "page-header", "section-card", "state-panel"]) {
      expect(markup).toContain(`data-slot="${slot}"`);
    }
    expect(markup).toMatch(new RegExp(`<h1[^>]*>${title}</h1>`));
    expect(markup.match(/data-state="unavailable"/g)).toHaveLength(1);
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain(t("unavailable", { subject: title }));
    expect(markup).toContain(t("trashUnavailableDescription"));
    expect(markup).toContain(locale === "en" ? "Restore and permanent deletion are not available." : "Wiederherstellung und endgültiges Löschen sind nicht verfügbar.");
    if (locale === "de") expect(markup).not.toMatch(/Unavailable:|Deleted records|Back to /);
    expect(markup).not.toMatch(/data-state="(?:empty|error|loading)"/);
    expect(markup).not.toMatch(/will appear here|Review and restore deleted/);
  });

  it.each(trashRoutes)("offers only parent navigation at $path, never ordinary records or mutations", ({ Page, path, back, subject }) => {
    harness.pathname = path;
    const markup = renderToStaticMarkup(<Page />);

    expect(harness.ordinaryList).not.toHaveBeenCalled();
    expect(harness.legacyHeader).not.toHaveBeenCalled();
    expect(markup).not.toContain("Active ordinary record");
    expect(markup).not.toMatch(/<(?:table|button|input|select|form)\b/);
    expect(markup).not.toMatch(/role="(?:button|checkbox|dialog|alertdialog)"/);
    expect(markup).not.toMatch(/>\s*(?:Confirm|Cancel|Restore|Delete|Retry)\s*</);
    expect(markup.match(/<a\b/g)).toHaveLength(1);
    expect(markup).toContain(`href="${back}"`);
    expect(markup).toContain(`>${t("backTo", { subject: t(`subjects.${subject}`) })}</a>`);
    expect(markup).toContain(locale === "en" ? "Back to " : "Zurück zu: ");
  });
  it("preserves the route title and canonical presentation without list controls", () => {
    harness.pathname = "/restaurants";
    const markup = renderToStaticMarkup(<RestaurantsRoute />);

    for (const slot of ["page-layout", "page-header", "section-card", "state-panel"]) {
      expect(markup).toContain(`data-slot="${slot}"`);
    }
    expect(markup).toMatch(new RegExp(`<h1[^>]*>${t("restaurantList")}</h1>`));
    expect(markup).toContain(locale === "en" ? "Restaurants List" : "Restaurantliste");
    expect(markup).toContain('data-state="unavailable"');
    expect(markup).not.toContain('data-state="empty"');
    expect(markup).not.toMatch(/<(?:table|button|input|select|form|a|nav)\b/);
    expect(markup).not.toMatch(/pagination|filter-bar|View Trash|View Drafts|Add New Restaurant/i);
    expect(harness.legacyHeader).not.toHaveBeenCalled();
  });

  it.each([
    { name: "route", View: RestaurantsRoute },
    { name: "owned table", View: RestaurantTable },
  ])("renders $name without synthetic restaurant records or destructive controls", ({ View }) => {
    harness.pathname = "/restaurants";
    const markup = renderToStaticMarkup(<View />);

    expect(markup).toContain('data-slot="state-panel"');
    expect(markup).toContain('data-state="unavailable"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain(t("unavailable", { subject: t("restaurantList") }));
    expect(markup).toContain(t("restaurantUnavailableDescription"));
    if (locale === "de") expect(markup).not.toMatch(/Unavailable:|Restaurant records|Listing and management/);
    expect(markup).not.toMatch(/Dragon Wok|dragonwok\.restaurantos\.com|2024-12-15|Commission/);
    expect(markup).not.toMatch(/<(?:table|img|button|input|select|form)\b/);
    expect(markup).not.toMatch(/role="(?:checkbox|dialog|alertdialog)"/);
  });
});

describe("invoicing handoff", () => {
  it("keeps the exact Orders destination and explanation in the canonical presentation", () => {
    harness.pathname = "/invoicing";
    const markup = renderToStaticMarkup(<InvoicingRoute />);

    for (const slot of ["page-layout", "page-header", "section-card"]) {
      expect(markup).toContain(`data-slot="${slot}"`);
    }
    expect(markup).toMatch(/<h1[^>]*>Invoicing<\/h1>/);
    expect(markup).toContain("Use Orders for invoice actions");
    expect(markup).toContain("Choose an order row menu to download the invoice PDF or send it to the customer email on file.");
    expect(markup).toContain("Subscription and payout billing documents remain available under Reports.");
    expect(markup.match(/<a\b/g)).toHaveLength(1);
    expect(markup).toContain('href="/orders?tab=today"');
    expect(markup).toContain("Go to Today&#x27;s Orders");
    expect(markup).not.toContain('data-state="unavailable"');
  });

  it("does not mount branch management or introduce invoice actions", () => {
    harness.pathname = "/invoicing";
    const markup = renderToStaticMarkup(<InvoicingRoute />);

    expect(harness.legacyHeader).not.toHaveBeenCalled();
    expect(markup).not.toMatch(/<(?:button|input|form|table)\b/);
    expect(markup).not.toMatch(/role="(?:dialog|alertdialog)"/);
    expect(markup).not.toMatch(/Unrelated management action|Create Branch|Import|Confirm/);
  });
});
