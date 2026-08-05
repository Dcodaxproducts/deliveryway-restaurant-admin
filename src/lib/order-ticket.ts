import type { PrintingPaperSize } from "@/services/printing";

type TicketModifier = {
  name: string;
  quantity: number;
};

type TicketItem = {
  name: string;
  variationName?: string;
  quantity: number;
  modifiers: TicketModifier[];
};

export type OrderTicket = {
  id: string;
  orderNumber?: string;
  orderType?: string;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerNote?: string;
  totalAmount?: number;
  currency?: string;
  items: TicketItem[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (record: Record<string, unknown> | null, key: string) => {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const readNumber = (
  record: Record<string, unknown> | null,
  key: string,
  fallback?: number,
) => {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeModifiers = (value: unknown): TicketModifier[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const modifier = asRecord(entry);
        const name = readString(modifier, "name");
        return name
          ? [{ name, quantity: readNumber(modifier, "quantity", 1) ?? 1 }]
          : [];
      })
    : [];

const normalizeItems = (value: unknown): TicketItem[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const item = asRecord(entry);
        const name =
          readString(item, "name") ?? readString(item, "menuItemName");
        return name
          ? [
              {
                name,
                variationName: readString(item, "variationName"),
                quantity: readNumber(item, "quantity", 1) ?? 1,
                modifiers: normalizeModifiers(item?.snapshotModifiers),
              },
            ]
          : [];
      })
    : [];

export const normalizeOrderTicket = (value: unknown): OrderTicket => {
  const order = asRecord(value);
  const id = readString(order, "id");
  if (!order || !id) {
    throw new Error("Order details are unavailable for printing.");
  }

  const customer = asRecord(order.customer);
  const firstName = readString(customer, "firstName") ?? "";
  const lastName = readString(customer, "lastName") ?? "";
  const fallbackCustomerName = `${firstName} ${lastName}`.trim() || undefined;
  const customerName =
    readString(customer, "fullName") ??
    readString(customer, "name") ??
    fallbackCustomerName;

  return {
    id,
    orderNumber: readString(order, "orderNumber"),
    orderType: readString(order, "orderType"),
    createdAt: readString(order, "createdAt"),
    customerName,
    customerPhone: readString(customer, "phone"),
    customerNote: readString(order, "customerNote"),
    totalAmount: readNumber(order, "totalAmount"),
    currency: readString(order, "currency"),
    items: normalizeItems(
      Array.isArray(order.displayItems) && order.displayItems.length > 0
        ? order.displayItems
        : order.items,
    ),
  };
};

const getTicketWidth = (paperSize: PrintingPaperSize) => {
  if (paperSize === "58MM") return "50mm";
  if (paperSize === "80MM") return "72mm";
  if (paperSize === "A5") return "132mm";
  return "190mm";
};

export const buildOrderTicketHtml = (
  ticket: OrderTicket,
  paperSize: PrintingPaperSize,
) => {
  const compact = paperSize === "58MM" || paperSize === "80MM";
  const fontSize = compact ? "12px" : "15px";
  const orderLabel = ticket.orderNumber ?? ticket.id.slice(-8);
  const itemRows = ticket.items
    .map((item) => {
      const variation = item.variationName
        ? ` <span style="font-weight:400">(${escapeHtml(item.variationName)})</span>`
        : "";
      const modifiers = item.modifiers.length
        ? `<div style="padding-left:12px;font-size:0.9em">${item.modifiers
            .map(
              (modifier) =>
                `+ ${escapeHtml(modifier.name)} × ${modifier.quantity}`,
            )
            .join("<br>")}</div>`
        : "";
      return `<div style="margin:0 0 8px"><strong>${item.quantity} × ${escapeHtml(item.name)}</strong>${variation}${modifiers}</div>`;
    })
    .join("");
  const total =
    typeof ticket.totalAmount === "number"
      ? `${ticket.totalAmount.toFixed(2)} ${escapeHtml(ticket.currency ?? "")}`.trim()
      : undefined;

  return [
    `<div style="box-sizing:border-box;width:${getTicketWidth(paperSize)};font-family:Arial,sans-serif;font-size:${fontSize};color:#000">`,
    '<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px">',
    '<div style="font-size:1.4em;font-weight:700">DeliveryWays</div>',
    `<div>Order / Bestellung ${escapeHtml(orderLabel)}</div>`,
    "</div>",
    ticket.orderType ? `<div><strong>Type:</strong> ${escapeHtml(ticket.orderType)}</div>` : "",
    ticket.createdAt ? `<div><strong>Time:</strong> ${escapeHtml(new Date(ticket.createdAt).toLocaleString())}</div>` : "",
    ticket.customerName ? `<div><strong>Customer:</strong> ${escapeHtml(ticket.customerName)}</div>` : "",
    ticket.customerPhone ? `<div><strong>Phone:</strong> ${escapeHtml(ticket.customerPhone)}</div>` : "",
    '<div style="border-top:1px dashed #000;margin:10px 0"></div>',
    itemRows || "<div>No item details available</div>",
    ticket.customerNote
      ? `<div style="border:1px solid #000;padding:6px;margin-top:10px"><strong>Note:</strong> ${escapeHtml(ticket.customerNote)}</div>`
      : "",
    total
      ? `<div style="border-top:2px solid #000;margin-top:10px;padding-top:8px;font-size:1.2em;font-weight:700">Total: ${total}</div>`
      : "",
    "</div>",
  ].join("");
};
