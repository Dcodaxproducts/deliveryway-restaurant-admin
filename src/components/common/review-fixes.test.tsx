import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PaginationBar } from "./PaginationSection";
import { TableReservationsTable } from "@/components/pages/TableReservations/components/TableReservationsTable";
import { formatDateTime } from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import type { TableReservation } from "@/types/table-reservations";

vi.mock("@/lib/fonts", () => ({ poppins: { className: "" } }));
vi.mock("@/hooks/useTableReservations", () => ({
  useUpdateTableReservationStatus: () => ({ isPending: false }),
}));

const reservation: TableReservation = {
  id: "reservation-1234", branchId: "branch-1", branch: { name: "Central", address: "42 Main Street" },
  createdAt: "2026-09-01T10:00:00Z", cancelledAt: "2026-09-02T11:30:00Z",
  reservationDate: "2026-09-03T18:00:00Z", guestCount: 4, note: "Window seat",
  status: "CANCELLED", customer: null,
};

describe.each([{ locale: "en", messages: en }, { locale: "de", messages: de }])("review regressions ($locale)", ({ locale, messages }) => {
  it.each([
    { branch: reservation.branch, branchId: "branch-1", detail: "42 Main Street" },
    { branch: { name: "Central", address: "" }, branchId: "branch-1", detail: messages.tableReservations.branchId.replace("{id}", "branch-1") },
    { branch: null, branchId: "branch-1", detail: messages.tableReservations.branchId.replace("{id}", "branch-1") },
    { branch: null, branchId: null, detail: messages.tableReservations.noBranch },
  ])("retains cancellation and branch detail in both views: $detail", ({ detail, ...branch }) => {
    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <TableReservationsTable reservations={[{ ...reservation, ...branch }]} loading={false} />
      </NextIntlClientProvider>,
    );
    const desktop = markup.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
    const mobile = markup.match(/<article[\s\S]*?<\/article>/)?.[0];
    for (const view of [desktop, mobile]) {
      expect(view).toContain(detail);
      expect(view).toContain(formatDateTime(reservation.cancelledAt));
      expect(view).toContain(formatDateTime(reservation.createdAt));
      expect(view).toContain("Window seat");
      expect(view).toContain('aria-label="Open actions"');
    }
  });

  it("does not invent a cancellation timestamp for active reservations", () => {
    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <TableReservationsTable reservations={[{ ...reservation, cancelledAt: null, status: "CONFIRMED" }]} loading={false} />
      </NextIntlClientProvider>,
    );
    expect(markup).not.toContain(formatDateTime(reservation.cancelledAt));
    expect(markup.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1]).not.toContain(messages.tableReservations.cancelledLabel);
    expect(markup.match(/<article[\s\S]*?<\/article>/)?.[0]).toContain("—");
  });

  it.each([1, 2, 3])("renders native pagination buttons and boundary state at page %s", (page) => {
    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <PaginationBar page={page} totalPages={3} total={25} limit={10} />
      </NextIntlClientProvider>,
    );
    expect(markup.match(/<button /g)).toHaveLength(5);
    expect(markup.match(/type="button"/g)).toHaveLength(5);
    expect(markup).not.toContain("<a ");
    expect(markup.match(/disabled=""/g) ?? []).toHaveLength(page === 2 ? 0 : 1);
    expect(markup).toContain(`aria-current="page" aria-label="Page ${page}"`);
  });
});
