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

type OrderPrintTrigger = "NEW_ORDER" | "CONFIRMED" | "MANUAL";

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
  trigger: OrderPrintTrigger;
}): Promise<"printed" | "skipped"> => {
  const key = `${orderId}:${trigger}`;
  if (
    trigger !== "MANUAL" &&
    (printedOrderTriggers.has(key) || printingOrderTriggers.has(key))
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

    const triggerEnabled =
      trigger === "MANUAL" ||
      (trigger === "NEW_ORDER"
        ? settings.autoPrintOnNewOrder
        : settings.autoPrintOnStatusChange);

    if (
      !settings.enabled ||
      !triggerEnabled ||
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

    if (trigger !== "MANUAL") rememberPrintedOrder(key);
    await reportOrderPrint({
      restaurantId,
      branchId,
      printerName,
      status: "success",
      message:
        trigger === "NEW_ORDER"
          ? `New order ${ticket.orderNumber ?? ticket.id} printed automatically.`
          : trigger === "CONFIRMED"
            ? `Order ${ticket.orderNumber ?? ticket.id} printed after acceptance.`
            : `Order ${ticket.orderNumber ?? ticket.id} reprinted manually.`,
    });
    return "printed";
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Automatic order printing failed.";
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

export const printNewOrderIfConfigured = (input: OrderAutoPrintInput) =>
  printOrderIfConfigured({ ...input, trigger: "NEW_ORDER" });

export const printAcceptedOrderIfConfigured = (input: OrderAutoPrintInput) =>
  printOrderIfConfigured({ ...input, trigger: "CONFIRMED" });

export const reprintOrder = (input: OrderAutoPrintInput) =>
  printOrderIfConfigured({ ...input, trigger: "MANUAL" });
