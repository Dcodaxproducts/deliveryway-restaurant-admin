import type { PrintingPaperSize } from "@/services/printing";

type TicketModifier = {
  name: string;
  quantity: number;
};

type TicketItem = {
  name: string;
  variationName?: string;
  quantity: number;
  lineTotal?: number;
  note?: string;
  modifiers: TicketModifier[];
};

export type OrderTicket = {
  id: string;
  orderNumber?: string;
  orderType?: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  customerNote?: string;
  preOrderAt?: string;
  isScheduled?: boolean;
  paymentMethod?: string;
  subtotal?: number;
  taxAmount?: number;
  deliveryFee?: number;
  serviceChargeAmount?: number;
  tipAmount?: number;
  discountAmount?: number;
  loyaltyDiscountAmount?: number;
  walletAppliedAmount?: number;
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
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const readBoolean = (record: Record<string, unknown> | null, key: string) =>
  typeof record?.[key] === "boolean" ? record[key] : undefined;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeModifiers = (value: unknown): TicketModifier[] => {
  const values = Array.isArray(value)
    ? value
    : asRecord(value)
      ? Object.values(asRecord(value) ?? {})
      : [];

  return values.flatMap((entry) => {
    if (Array.isArray(entry)) return normalizeModifiers(entry);

    const modifier = asRecord(entry);
    if (!modifier) return [];

    const name = readString(modifier, "name");
    const nested = Object.values(modifier).flatMap((nestedValue) =>
      typeof nestedValue === "object" && nestedValue !== null
        ? normalizeModifiers(nestedValue)
        : [],
    );

    return [
      ...(name
        ? [{ name, quantity: readNumber(modifier, "quantity", 1) ?? 1 }]
        : []),
      ...nested,
    ];
  });
};

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
                lineTotal: readNumber(item, "lineTotal"),
                note: readString(item, "note"),
                modifiers: normalizeModifiers([
                  item?.snapshotModifiers,
                  item?.snapshotSections,
                ]),
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
  const normalizedCustomerName = customerName
    ?.replace(/\s+Customer$/i, "")
    .trim();
  const deliveryAddress = asRecord(order.deliveryAddress);
  const formattedAddress = deliveryAddress
    ? [
        readString(deliveryAddress, "street"),
        readString(deliveryAddress, "area"),
        [
          readString(deliveryAddress, "postalCode"),
          readString(deliveryAddress, "city"),
        ]
          .filter(Boolean)
          .join(" "),
        readString(deliveryAddress, "state"),
        readString(deliveryAddress, "country"),
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return {
    id,
    orderNumber: readString(order, "orderNumber"),
    orderType: readString(order, "orderType"),
    createdAt: readString(order, "createdAt"),
    customerName: normalizedCustomerName,
    customerEmail: readString(customer, "email"),
    customerPhone: readString(customer, "phone"),
    deliveryAddress: formattedAddress,
    customerNote: readString(order, "customerNote"),
    preOrderAt: readString(order, "orderTime"),
    isScheduled: readBoolean(order, "isScheduled"),
    paymentMethod: readString(order, "paymentMethod"),
    subtotal: readNumber(order, "subtotal"),
    taxAmount: readNumber(order, "taxAmount"),
    deliveryFee: readNumber(order, "deliveryFee"),
    serviceChargeAmount: readNumber(order, "serviceChargeAmount"),
    tipAmount: readNumber(order, "tipAmount"),
    discountAmount: readNumber(order, "discountAmount"),
    loyaltyDiscountAmount: readNumber(order, "loyaltyDiscountAmount"),
    walletAppliedAmount: readNumber(order, "walletAppliedAmount"),
    totalAmount: readNumber(order, "totalAmount"),
    currency: readString(order, "currency"),
    items: normalizeItems(
      Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : Array.isArray(order.itemsPreview) && order.itemsPreview.length > 0
          ? order.itemsPreview
          : order.displayItems,
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
  const money = (value: number) =>
    `${new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} ${escapeHtml(ticket.currency ?? "")}`.trim();
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
      const lineTotal =
        typeof item.lineTotal === "number"
          ? `<span style="float:right">${money(item.lineTotal)}</span>`
          : "";
      const note = item.note
        ? `<div style="padding-left:12px;font-weight:700">Special instructions: ${escapeHtml(item.note)}</div>`
        : "";
      return `<div style="margin:0 0 8px">${lineTotal}<strong>${item.quantity} × ${escapeHtml(item.name)}</strong>${variation}${modifiers}${note}</div>`;
    })
    .join("");
  const total =
    typeof ticket.totalAmount === "number"
      ? money(ticket.totalAmount)
      : undefined;
  const amountRows = [
    ["Subtotal", ticket.subtotal],
    ["Tax", ticket.taxAmount],
    ["Delivery fee", ticket.deliveryFee],
    ["Service charge", ticket.serviceChargeAmount],
    ["Tip", ticket.tipAmount],
    ["Discount", ticket.discountAmount, true],
    ["Loyalty discount", ticket.loyaltyDiscountAmount, true],
    ["Wallet applied", ticket.walletAppliedAmount, true],
  ]
    .map(([label, value, subtract], index) =>
      typeof value === "number" && (index === 0 || value !== 0)
        ? `<div><span>${label}:</span><span style="float:right">${subtract ? "-" : ""}${money(value)}</span></div>`
        : "",
    )
    .join("");
  const fulfillmentBanner =
    ticket.isScheduled && ticket.preOrderAt
      ? `<div style="border:4px solid #000;padding:10px;margin:0 0 12px;text-align:center"><div style="font-size:1.55em;font-weight:900;letter-spacing:0.08em">PRE-ORDER / VORBESTELLUNG</div><div style="font-size:1.25em;font-weight:800;margin-top:4px">${escapeHtml(new Date(ticket.preOrderAt).toLocaleString())}</div></div>`
      : '<div style="border:2px solid #000;padding:7px;margin:0 0 12px;text-align:center;font-size:1.2em;font-weight:800">ASAP / SOFORT</div>';

  return [
    `<div style="box-sizing:border-box;width:${getTicketWidth(paperSize)};padding-right:4mm;font-family:Arial,sans-serif;font-size:${fontSize};color:#000;overflow-wrap:anywhere;word-break:break-word">`,
    fulfillmentBanner,
    '<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px">',
    '<div style="font-size:1.4em;font-weight:700">DeliveryWays</div>',
    `<div>Order / Bestellung ${escapeHtml(orderLabel)}</div>`,
    "</div>",
    ticket.orderType
      ? `<div><strong>Type:</strong> ${escapeHtml(ticket.orderType)}</div>`
      : "",
    ticket.createdAt
      ? `<div><strong>Time:</strong> ${escapeHtml(new Date(ticket.createdAt).toLocaleString())}</div>`
      : "",
    ticket.customerName
      ? `<div><strong>Customer:</strong> ${escapeHtml(ticket.customerName)}</div>`
      : "",
    ticket.customerEmail
      ? `<div><strong>Email:</strong> ${escapeHtml(ticket.customerEmail)}</div>`
      : "",
    ticket.customerPhone
      ? `<div><strong>Phone:</strong> ${escapeHtml(ticket.customerPhone)}</div>`
      : "",
    ticket.deliveryAddress
      ? `<div><strong>Address:</strong> ${escapeHtml(ticket.deliveryAddress)}</div>`
      : "",
    '<div style="border-top:1px dashed #000;margin:10px 0"></div>',
    '<div style="font-weight:700;margin-bottom:8px">Ordered items</div>',
    itemRows || "<div>No item details available</div>",
    ticket.customerNote
      ? `<div style="border:1px solid #000;padding:6px;margin-top:10px"><strong>Note:</strong> ${escapeHtml(ticket.customerNote)}</div>`
      : "",
    `<div style="border-top:1px dashed #000;margin-top:10px;padding-top:8px">${amountRows}</div>`,
    total
      ? `<div style="border-top:2px solid #000;margin-top:10px;padding-top:8px;font-size:1.2em;font-weight:700">Total: ${total}</div>`
      : "",
    ticket.paymentMethod
      ? `<div><strong>Payment method:</strong> ${escapeHtml(ticket.paymentMethod)}</div>`
      : "",
    "</div>",
  ].join("");
};

const ESC = "\x1b";
const GS = "\x1d";

const wrapText = (value: string, columns: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (word.length > columns) {
      if (line) {
        lines.push(line);
        line = "";
      }
      for (let index = 0; index < word.length; index += columns) {
        lines.push(word.slice(index, index + columns));
      }
      continue;
    }

    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= columns) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
};

const formatEscPosAmount = (label: string, value: string, columns: number) => {
  const spacing = columns - label.length - value.length;
  return spacing > 0
    ? `${label}${" ".repeat(spacing)}${value}`
    : `${label}\n${value.padStart(columns)}`;
};

export const buildOrderTicketEscPos = (
  ticket: OrderTicket,
  paperSize: Extract<PrintingPaperSize, "58MM" | "80MM">,
) => {
  const columns = paperSize === "58MM" ? 32 : 48;
  const orderLabel = ticket.orderNumber ?? ticket.id.slice(-8);
  const money = (value: number) =>
    `${new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} ${ticket.currency ?? ""}`.trim();
  const lines: string[] = [
    `${ESC}@`,
    `${ESC}t\x13`,
    `${ESC}a\x01`,
    `${GS}!\x11`,
    "DeliveryWays\n",
    `${GS}!\x00`,
    `Order / Bestellung ${orderLabel}\n`,
    `${ESC}a\x00`,
    `${"=".repeat(columns)}\n`,
  ];

  if (ticket.isScheduled && ticket.preOrderAt) {
    lines.push(`${ESC}E\x01PRE-ORDER / VORBESTELLUNG${ESC}E\x00\n`);
    lines.push(`${new Date(ticket.preOrderAt).toLocaleString()}\n`);
  } else {
    lines.push(`${ESC}E\x01ASAP / SOFORT${ESC}E\x00\n`);
  }

  const details = [
    ticket.orderType ? `Type: ${ticket.orderType}` : undefined,
    ticket.createdAt
      ? `Time: ${new Date(ticket.createdAt).toLocaleString()}`
      : undefined,
    ticket.customerName ? `Customer: ${ticket.customerName}` : undefined,
    ticket.customerEmail ? `Email: ${ticket.customerEmail}` : undefined,
    ticket.customerPhone ? `Phone: ${ticket.customerPhone}` : undefined,
    ticket.deliveryAddress ? `Address: ${ticket.deliveryAddress}` : undefined,
  ].filter((value): value is string => Boolean(value));

  for (const detail of details) {
    for (const line of wrapText(detail, columns)) lines.push(`${line}\n`);
  }

  lines.push(`${"-".repeat(columns)}\n`);
  lines.push(`${ESC}E\x01Ordered items${ESC}E\x00\n`);

  if (ticket.items.length === 0) {
    lines.push("No item details available\n");
  }

  for (const item of ticket.items) {
    const itemLabel = `${item.quantity} x ${item.name}${item.variationName ? ` (${item.variationName})` : ""}`;
    for (const line of wrapText(itemLabel, columns)) {
      lines.push(`${ESC}E\x01${line}${ESC}E\x00\n`);
    }
    for (const modifier of item.modifiers) {
      for (const line of wrapText(
        `  + ${modifier.name} x ${modifier.quantity}`,
        columns,
      )) {
        lines.push(`${line}\n`);
      }
    }
    if (item.note) {
      for (const line of wrapText(`  Note: ${item.note}`, columns)) {
        lines.push(`${line}\n`);
      }
    }
    if (typeof item.lineTotal === "number") {
      lines.push(`${money(item.lineTotal).padStart(columns)}\n`);
    }
  }

  if (ticket.customerNote) {
    lines.push(`${"-".repeat(columns)}\n`);
    for (const line of wrapText(`Note: ${ticket.customerNote}`, columns)) {
      lines.push(`${ESC}E\x01${line}${ESC}E\x00\n`);
    }
  }

  lines.push(`${"-".repeat(columns)}\n`);
  const amounts: Array<[string, number | undefined, boolean?]> = [
    ["Subtotal", ticket.subtotal],
    ["Tax", ticket.taxAmount],
    ["Delivery fee", ticket.deliveryFee],
    ["Service charge", ticket.serviceChargeAmount],
    ["Tip", ticket.tipAmount],
    ["Discount", ticket.discountAmount, true],
    ["Loyalty discount", ticket.loyaltyDiscountAmount, true],
    ["Wallet applied", ticket.walletAppliedAmount, true],
  ];

  amounts.forEach(([label, value, subtract], index) => {
    if (typeof value !== "number" || (index !== 0 && value === 0)) return;
    lines.push(
      `${formatEscPosAmount(`${label}:`, `${subtract ? "-" : ""}${money(value)}`, columns)}\n`,
    );
  });

  if (typeof ticket.totalAmount === "number") {
    lines.push(`${ESC}E\x01`);
    lines.push(
      `${formatEscPosAmount("TOTAL:", money(ticket.totalAmount), columns)}\n`,
    );
    lines.push(`${ESC}E\x00`);
  }
  if (ticket.paymentMethod) {
    for (const line of wrapText(
      `Payment method: ${ticket.paymentMethod}`,
      columns,
    )) {
      lines.push(`${line}\n`);
    }
  }

  lines.push("\n\n\n\n");
  return lines.join("");
};
