import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  "src/components/pages/orders/pages/OrderDetailsPage.tsx",
  "utf8",
);
const detailsSource = readFileSync(
  "src/components/pages/Orders/components/orders/details/OrderDetails.tsx",
  "utf8",
);
const headerSource = readFileSync(
  "src/components/pages/Orders/components/orders/details/OrderDetailsHeader.tsx",
  "utf8",
);

describe("order details operations workspace", () => {
  it("uses one bounded responsive grid without nested floating customer or tracking panels", () => {
    expect(pageSource).toContain("overflow-x-clip");
    expect(detailsSource).toContain(
      "lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]",
    );
    expect(detailsSource).toContain("min-w-0");
    expect(pageSource).not.toContain("UserProfile");
    expect(pageSource).not.toContain("OrderTrackingSection");
  });

  it("keeps items and financial totals first-class and provides empty content", () => {
    const itemsIndex = detailsSource.indexOf('title={t("itemsOverview")}');
    const totalsIndex = detailsSource.indexOf('title={t("orderSummary")}');
    const overviewIndex = detailsSource.indexOf('title={t("orderOverview")}');

    expect(itemsIndex).toBeGreaterThan(0);
    expect(totalsIndex).toBeGreaterThan(itemsIndex);
    expect(overviewIndex).toBeGreaterThan(totalsIndex);
    expect(detailsSource).toContain('t("noItems")');
    expect(detailsSource).toContain("snapshotModifiers");
    expect(detailsSource).toContain("item.note");
  });

  it("never labels takeaway fulfillment as a delivery address", () => {
    expect(detailsSource).toContain('order.orderType === "DELIVERY"');
    expect(detailsSource).toContain('value={t("takeawayOrder")}');
    expect(detailsSource).not.toContain('deliveryAddress || t("takeawayOrder")');
  });

  it("wraps long operational content rather than clipping it", () => {
    expect(detailsSource).toContain("[overflow-wrap:anywhere]");
    expect(detailsSource).toContain("break-all");
    expect(pageSource).toContain("min-w-0");
  });

  it("shows semantic states and only contract-backed status actions", () => {
    expect(headerSource).toContain("StatusBadge");
    expect(headerSource).toContain("getNextOrderStatus(order)");
    expect(headerSource).toContain("canTerminateOrderStatus(order)");
    expect(headerSource).toContain("canSendDeliveryOrderOutDirectly(order)");
    expect(headerSource).toContain("ActionDropdown");
  });

  it("has final-layout loading plus distinct retry and not-found states", () => {
    expect(pageSource).toContain('data-testid="order-details-skeleton"');
    expect(pageSource).toContain('state="error"');
    expect(pageSource).toContain("refetch()");
    expect(pageSource).toContain('state="empty"');
  });
});
