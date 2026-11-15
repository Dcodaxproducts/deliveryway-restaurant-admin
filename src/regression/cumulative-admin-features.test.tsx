import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { TABLE_RESERVATIONS_DEFAULT_SORT } from "@/components/pages/TableReservations/utils/table-reservations-defaults";
import { resolveReportDateRange } from "@/components/pages/reports/utils/report-date-range";
import { menuItems } from "@/config/sidebarItems";
import de from "@/messages/de.json";

const WINORDER_ROUTE = "/integrations/winorder";

describe("cumulative restaurant admin feature contract", () => {
  it("keeps WinOrder, custom report dates, and the reservation restoration together", () => {
    const winOrderItem = menuItems.find(
      (item) => item.href === WINORDER_ROUTE,
    );
    const winOrderRouteSource = readFileSync(
      join(
        process.cwd(),
        "src/app/(dashboard)/integrations/winorder/page.tsx",
      ),
      "utf8",
    );

    expect(winOrderItem).toMatchObject({
      labelKey: "winOrderIntegration",
      href: WINORDER_ROUTE,
      permissionAccesses: ["winorder-integration"],
    });
    expect(winOrderRouteSource).toContain(
      'import WinOrderSettingsPage from "@/components/pages/WinOrder/WinOrderSettingsPage";',
    );
    expect(winOrderRouteSource).toContain("<WinOrderSettingsPage />");

    const customReportRange = resolveReportDateRange("daily", {
      from: "2026-11-01",
      to: "2026-11-13",
    });

    expect(customReportRange).toEqual({
      fromDate: expect.any(String),
      toDate: expect.any(String),
    });
    expect(new Date(customReportRange.fromDate).getDate()).toBe(1);
    expect(new Date(customReportRange.fromDate).getHours()).toBe(0);
    expect(new Date(customReportRange.toDate).getDate()).toBe(13);
    expect(new Date(customReportRange.toDate).getHours()).toBe(23);
    expect(new Date(customReportRange.toDate).getMinutes()).toBe(59);
    expect(new Date(customReportRange.toDate).getSeconds()).toBe(59);

    expect(TABLE_RESERVATIONS_DEFAULT_SORT).toEqual({
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    expect(de.tableReservations.createdAt).toBe("Erstellt am");
    expect(de.tableReservations.customerEmail).toBe("E-Mail");
    expect(de.tableReservations.customerPhone).toBe("Telefon");
  });
});
