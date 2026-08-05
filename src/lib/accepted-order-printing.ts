import { normalizeOrderTicket } from "@/lib/order-ticket";
import { printLocalOrderTicket } from "@/lib/local-printer";
import { getOrderById } from "@/services/orders/orders.api";
import {
  getAdminPrintingSettings,
  reportAdminPrinterEvent,
} from "@/services/printing/printing.api";

const MAX_PRINTED_ORDERS = 200;
const printedAcceptedOrders = new Set<string>();
const printingAcceptedOrders = new Set<string>();

const rememberPrintedOrder = (key: string) => {
  printedAcceptedOrders.add(key);
  if (printedAcceptedOrders.size <= MAX_PRINTED_ORDERS) return;

  const oldestKey = printedAcceptedOrders.values().next().value;
  if (oldestKey) printedAcceptedOrders.delete(oldestKey);
};

const reportOrderPrint = async ({
  restaurantId,
  branchId,
  printerName,
  status,
  message,
}: {
  restaurantId: string;
  branchId?: string;
  printerName?: string;
  status: "success" | "failed";
  message: string;
}) => {
  try {
    await reportAdminPrinterEvent({
      restaurantId,
      branchId,
      printerName,
      event: "order_print",
      status,
      message,
    });
  } catch {
    // A health-reporting failure must not change the accepted order or print result.
  }
};

export const printAcceptedOrderIfConfigured = async ({
  orderId,
  restaurantId,
  branchId,
}: {
  orderId: string;
  restaurantId: string;
  branchId?: string;
}): Promise<"printed" | "skipped"> => {
  const key = `${orderId}:CONFIRMED`;
  if (printedAcceptedOrders.has(key) || printingAcceptedOrders.has(key)) {
    return "skipped";
  }

  printingAcceptedOrders.add(key);

  let printerName: string | undefined;
  try {
    const settingsResponse = await getAdminPrintingSettings({
      restaurantId,
      branchId,
    });
    const settings = settingsResponse.data.settings;
    printerName = settings.printerName ?? undefined;

    if (
      !settings.enabled ||
      !settings.autoPrintOnStatusChange ||
      !settings.printerName ||
      settings.connectionType === "CLOUD"
    ) {
      return "skipped";
    }

    const order = await getOrderById(orderId);
    const ticket = normalizeOrderTicket(order);
    await printLocalOrderTicket({
      printerName: settings.printerName,
      paperSize: settings.paperSize ?? "80MM",
      ticket,
    });

    rememberPrintedOrder(key);
    await reportOrderPrint({
      restaurantId,
      branchId,
      printerName,
      status: "success",
      message: `Order ${ticket.orderNumber ?? ticket.id} printed after acceptance.`,
    });
    return "printed";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Automatic order printing failed.";
    await reportOrderPrint({
      restaurantId,
      branchId,
      printerName,
      status: "failed",
      message,
    });
    throw error;
  } finally {
    printingAcceptedOrders.delete(key);
  }
};
