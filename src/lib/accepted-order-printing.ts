import { normalizeOrderTicket } from "@/lib/order-ticket";
import { printLocalOrderTicket } from "@/lib/local-printer";
import { getOrderById } from "@/services/orders/orders.api";
import {
  getAdminPrintingSettings,
  reportAdminPrinterEvent,
} from "@/services/printing/printing.api";

const MAX_PRINTED_ORDERS = 200;
const printedOrderTriggers = new Set<string>();
const printingOrderTriggers = new Set<string>();

type PrintTrigger = "CONFIRMED_AUTO" | "MANUAL";

const rememberPrintedOrder = (key: string) => {
  printedOrderTriggers.add(key);
  if (printedOrderTriggers.size <= MAX_PRINTED_ORDERS) return;

  const oldestKey = printedOrderTriggers.values().next().value;
  if (oldestKey) printedOrderTriggers.delete(oldestKey);
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

const printOrderIfConfigured = async ({
  orderId,
  restaurantId,
  branchId,
  trigger,
}: {
  orderId: string;
  restaurantId: string;
  branchId?: string;
  trigger: PrintTrigger;
}): Promise<"printed" | "skipped"> => {
  const key = `${orderId}:${trigger}`;
  const shouldDedupe = trigger !== "MANUAL";
  if (
    printingOrderTriggers.has(key) ||
    (shouldDedupe && printedOrderTriggers.has(key))
  ) {
    return "skipped";
  }

  printingOrderTriggers.add(key);

  let printerName: string | undefined;
  try {
    const settingsResponse = await getAdminPrintingSettings({
      restaurantId,
      branchId,
    });
    const settings = settingsResponse.data.settings;
    printerName = settings.printerName ?? undefined;

    const isAutomatic = trigger === "CONFIRMED_AUTO";

    if (isAutomatic && (!settings.enabled || !settings.autoPrintOnStatusChange)) {
      return "skipped";
    }

    if (!settings.printerName || settings.connectionType === "CLOUD") {
      if (trigger === "MANUAL") {
        throw new Error("Configure a local printer before printing this order.");
      }
      return "skipped";
    }

    const order = await getOrderById(orderId);
    const ticket = normalizeOrderTicket(order);
    await printLocalOrderTicket({
      printerName: settings.printerName,
      paperSize: settings.paperSize ?? "80MM",
      ticket,
    });

    if (shouldDedupe) rememberPrintedOrder(key);
    await reportOrderPrint({
      restaurantId,
      branchId,
      printerName,
      status: "success",
      message:
        trigger === "MANUAL"
          ? `Order ${ticket.orderNumber ?? ticket.id} printed manually.`
          : `Order ${ticket.orderNumber ?? ticket.id} printed automatically after confirmation.`,
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
    printingOrderTriggers.delete(key);
  }
};

type OrderAutoPrintInput = {
  orderId: string;
  restaurantId: string;
  branchId?: string;
};

export const printAcceptedOrderIfConfigured = (input: OrderAutoPrintInput) =>
  printOrderIfConfigured({ ...input, trigger: "CONFIRMED_AUTO" });

export const printOrderManually = (input: OrderAutoPrintInput) =>
  printOrderIfConfigured({ ...input, trigger: "MANUAL" });
