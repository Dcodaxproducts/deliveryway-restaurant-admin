import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "de" }));
const messages = vi.hoisted(() => ({
  en: {
    customers: {
      searchPlaceholder: "Search by name, email, phone, customer ID, or order ID",
    },
    branches: {
      filtersShowing: "Showing {visible} of {total} results",
      branchAdminFirstNamePlaceholder: "Enter first name",
      branchAdminPasswordCreatePlaceholder: "Create a secure password",
    },
    common: { searchByName: "Search by name", search: "Search", export: "Export", filter: "Filter" },
  },
  de: {
    customers: {
      searchPlaceholder: "Nach Name, E-Mail, Telefon, Kunden-ID oder Bestell-ID suchen",
    },
    branches: {
      filtersShowing: "{visible} von {total} Ergebnissen werden angezeigt",
      branchAdminFirstNamePlaceholder: "Vorname eingeben",
      branchAdminPasswordCreatePlaceholder: "Sicheres Passwort erstellen",
    },
    common: { searchByName: "Nach Name suchen", search: "Suchen", export: "Exportieren", filter: "Filter" },
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: "customers" | "branches" | "common") =>
    (key: string, values?: Record<string, number>) => {
      const scoped = messages[state.locale][namespace] as Record<string, string>;
      return (scoped[key] ?? key)
        .replace("{visible}", String(values?.visible ?? ""))
        .replace("{total}", String(values?.total ?? ""));
    },
}));

vi.mock("@/components/common/FilterModal", () => ({ default: () => null }));

import BranchFilters from "./BranchFilters";
import { BRANCH_ADMIN_PLACEHOLDER_KEYS } from "../branch-admin-placeholders";

describe("localized branch and customer placeholders", () => {
  it.each([
    ["en", "Search by name, email, phone, customer ID, or order ID", "Showing 10 of 25 results"],
    ["de", "Nach Name, E-Mail, Telefon, Kunden-ID oder Bestell-ID suchen", "10 von 25 Ergebnissen werden angezeigt"],
  ] as const)("renders the %s customer-list search placeholder", (locale, placeholder, countLabel) => {
    state.locale = locale;

    const html = renderToStaticMarkup(
      <BranchFilters
        branches={Array.from({ length: 10 }, (_, index) => ({ name: `Customer ${index + 1}` }))}
        filters={{ page: 2, search: "" }}
        onFilterChange={vi.fn()}
        showCustomerFilters
        totalResults={25}
      />,
    );

    expect(html).toContain(`placeholder="${placeholder}"`);
    expect(html).toContain(countLabel);
  });

  it.each([
    ["en", "Enter first name", "Create a secure password"],
    ["de", "Vorname eingeben", "Sicheres Passwort erstellen"],
  ] as const)("resolves the %s create-branch placeholders used by the rendered fields", (locale, firstName, password) => {
    state.locale = locale;
    const t = (key: string) =>
      (messages[state.locale].branches as Record<string, string>)[key] ?? key;
    const html = renderToStaticMarkup(
      <>
        <input placeholder={t(BRANCH_ADMIN_PLACEHOLDER_KEYS.firstName)} />
        <input placeholder={t(BRANCH_ADMIN_PLACEHOLDER_KEYS.passwordCreate)} />
      </>,
    );

    expect(html).toContain(`placeholder="${firstName}"`);
    expect(html).toContain(`placeholder="${password}"`);
  });
});
