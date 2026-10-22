"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { HookData } from "jspdf-autotable";
import { formatDateTime24 } from "@/lib/date-time-format";
import { formatMoney, resolveCurrency } from "@/lib/currency";
import type { AdminInvoice } from "@/services/reports/reports.api";

type DashboardReportType = "financial" | "order";

type ReportPdfStat = {
  id?: string;
  title: string;
  value: string;
  description?: string;
};

type ReportTableRow = [string, string];

type DownloadRestaurantDashboardReportPdfInput = {
  reportType: DashboardReportType;
  title: string;
  description?: string;
  restaurantId?: string;
  restaurantName?: string;
  currency?: string;
  period?: { fromDate: string; toDate: string };
  stats: ReportPdfStat[];
  data: any;
};

const PDF_GREEN_COLOR: [number, number, number] = [16, 185, 129];
const PDF_RED_COLOR: [number, number, number] = [239, 68, 68];
const PDF_DARK_COLOR: [number, number, number] = [17, 24, 39];
const PDF_GRAY_COLOR: [number, number, number] = [107, 114, 128];
const PDF_LIGHT_GRAY_COLOR: [number, number, number] = [249, 250, 251];
const PDF_BORDER_COLOR: [number, number, number] = [229, 231, 235];

const formatCurrency = (value: number, currency?: string | null) => {
  return formatMoney(value, currency);
};

const formatInvoiceCurrency = (value: number, currency?: string | null) => {
  return formatMoney(value, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return formatDateTime24({
    value: date,
    locale: "de-DE",
    options: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  });
};

const prettyLabel = (value?: string) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const sanitizeFileName = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const getInvoiceCurrency = (invoice?: AdminInvoice | null) => {
  return resolveCurrency(
    invoice?.currency,
    invoice?.transactions?.[0]?.currency,
  );
};

const getCustomerName = (invoice: AdminInvoice) => {
  return (
    invoice.customer?.name ||
    `${invoice.customer?.firstName || ""} ${
      invoice.customer?.lastName || ""
    }`.trim() ||
    invoice.customer?.email ||
    "-"
  );
};

const drawHeader = ({
  doc,
  title,
  description,
  restaurantId,
}: {
  doc: jsPDF;
  title: string;
  description?: string;
  restaurantId?: string;
}) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 96, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PDF_DARK_COLOR);
  doc.text(title, 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_GRAY_COLOR);
  doc.text(description || "Restaurant report", 40, 58);

  if (restaurantId) {
    doc.setFontSize(8);
    doc.text(`Restaurant ID: ${restaurantId}`, 40, 74);
  }

  doc.setFontSize(9);
  doc.text(
    formatDateTime24({ value: new Date(), locale: "de-DE" }),
    pageWidth - 40,
    58,
    {
      align: "right",
    },
  );

  doc.setDrawColor(...PDF_BORDER_COLOR);
  doc.line(40, 86, pageWidth - 40, 86);
};

const drawFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(...PDF_BORDER_COLOR);
    doc.line(40, pageHeight - 36, pageWidth - 40, pageHeight - 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_GRAY_COLOR);
    doc.text("Generated from restaurant dashboard", 40, pageHeight - 20);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - 40, pageHeight - 20, {
      align: "right",
    });
  }
};

type OrderReportRow = {
  id: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
};

type PaymentMethodSummaryRow = {
  paymentMethod: string;
  count: number;
  amount: number;
};

type OrderPeriodReportData = {
  orders?: OrderReportRow[];
  paymentMethodSummary?: PaymentMethodSummaryRow[];
  offlineOrderCount?: number;
  offlineAmount?: number;
  onlineOrderCount?: number;
  onlineAmount?: number;
  totalOrders?: number;
  totalRevenue?: number;
  payoutActivity?: Array<{
    id: string;
    requestedAt: string;
    status: string;
    amount: number;
    currency?: string | null;
    paidAt?: string | null;
    paymentReference?: string | null;
  }>;
};

export const ORDER_REPORT_LABELS = {
  history: "Bestellhistorie",
  overview: "Bestellübersicht",
  orderDateTime: "Bestelldatum und Uhrzeit",
  paidWith: "Bezahlt mit",
  summary: "Zusammenfassung",
  payoutOverview: "Auszahlungsübersicht",
} as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Barzahlung",
  CARD_ON_DELIVERY: "Kartenzahlung",
  PAYPAL: "PayPal",
  STRIPE: "Online-Zahlung",
  EASYPAISA: "Online-Zahlung",
  JAZZCASH: "Online-Zahlung",
  BANK_TRANSFER: "Online-Zahlung",
  WALLET: "Online-Zahlung",
};

export const formatPaymentMethod = (paymentMethod: string) =>
  PAYMENT_METHOD_LABELS[paymentMethod.toUpperCase()] ??
  prettyLabel(paymentMethod);

export const buildOrderPaymentDetailsTable = (
  orders: OrderReportRow[],
  currency?: string,
) => ({
  head: [
    "Bestellnummer",
    ORDER_REPORT_LABELS.orderDateTime,
    ORDER_REPORT_LABELS.paidWith,
    `Gesamt (${resolveCurrency(currency)})`,
  ],
  body: orders.map((order) => [
    order.id,
    formatDateTime(order.createdAt),
    formatPaymentMethod(order.paymentMethod),
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(order.totalAmount),
  ]),
});

const formatReportMoney = (value: number, currency?: string | null) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: resolveCurrency(currency),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatReportDate = (value?: string) => {
  if (!value) return "-";
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnlyMatch) {
    return `${dateOnlyMatch[3]}.${dateOnlyMatch[2]}.${dateOnlyMatch[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getPaymentMethodSummary = (data: OrderPeriodReportData) => {
  if (data.paymentMethodSummary?.length) {
    return data.paymentMethodSummary;
  }

  const summary = new Map<string, PaymentMethodSummaryRow>();
  for (const order of data.orders ?? []) {
    const paymentMethod = order.paymentMethod.toUpperCase();
    const current = summary.get(paymentMethod) ?? {
      paymentMethod,
      count: 0,
      amount: 0,
    };
    current.count += 1;
    current.amount += Number(order.totalAmount || 0);
    summary.set(paymentMethod, current);
  }
  return [...summary.values()];
};

export const buildOrderReportSummaryRows = (
  data: OrderPeriodReportData,
  currency?: string,
): ReportTableRow[] => {
  const summaries = getPaymentMethodSummary(data);
  const exact = (paymentMethod: string) =>
    summaries.find(
      (entry) => entry.paymentMethod.toUpperCase() === paymentMethod,
    );
  const online = summaries
    .filter(
      (entry) =>
        !["COD", "CARD_ON_DELIVERY"].includes(
          entry.paymentMethod.toUpperCase(),
        ),
    )
    .reduce(
      (total, entry) => ({
        count: total.count + Number(entry.count || 0),
        amount: total.amount + Number(entry.amount || 0),
      }),
      { count: 0, amount: 0 },
    );
  const rows = [
    ["Barzahlung", exact("COD")],
    ["Kartenzahlung", exact("CARD_ON_DELIVERY")],
    ["Online-Zahlung", online],
  ] as const;

  return [
    ...rows.map(
      ([label, summary]) =>
        [
          `${label} (${summary?.count ?? 0})`,
          formatReportMoney(summary?.amount ?? 0, currency),
        ] as ReportTableRow,
    ),
    [
      `Gesamtbestellungen (${data.totalOrders ?? 0})`,
      formatReportMoney(data.totalRevenue ?? 0, currency),
    ],
  ];
};

const drawOrderReportHeader = (
  doc: jsPDF,
  restaurantName: string,
  period?: { fromDate: string; toDate: string },
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_RED_COLOR);
  doc.rect(0, 0, pageWidth, 74, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(ORDER_REPORT_LABELS.history, 40, 34);
  doc.setFontSize(13);
  doc.text(restaurantName || "Restaurant", 40, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${formatReportDate(period?.fromDate)} - ${formatReportDate(period?.toDate)}`,
    pageWidth - 40,
    55,
    { align: "right" },
  );
};

const drawOrderReportFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...PDF_BORDER_COLOR);
    doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34);
    doc.setTextColor(...PDF_GRAY_COLOR);
    doc.setFontSize(8);
    doc.text("Erstellt von DeliveryWays", 40, pageHeight - 18);
    doc.text(
      `Seite ${page} von ${pageCount}`,
      pageWidth - 40,
      pageHeight - 18,
      {
        align: "right",
      },
    );
  }
};

const renderOrderPeriodReport = ({
  doc,
  restaurantName,
  currency,
  period,
  data,
}: {
  doc: jsPDF;
  restaurantName: string;
  currency?: string;
  period?: { fromDate: string; toDate: string };
  data: OrderPeriodReportData;
}) => {
  drawOrderReportHeader(doc, restaurantName, period);

  addSectionTitle(doc, ORDER_REPORT_LABELS.overview, 98);
  const paymentDetails = buildOrderPaymentDetailsTable(
    data.orders ?? [],
    currency,
  );

  autoTable(doc, {
    startY: 108,
    head: [paymentDetails.head],
    body: paymentDetails.body,
    margin: { top: 90, left: 40, right: 40, bottom: 150 },
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 6,
      textColor: PDF_DARK_COLOR,
      lineColor: PDF_BORDER_COLOR,
      lineWidth: { bottom: 0.4 },
    },
    headStyles: {
      fillColor: PDF_LIGHT_GRAY_COLOR,
      textColor: PDF_GRAY_COLOR,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 205 },
      1: { cellWidth: 125 },
      2: { cellWidth: 110 },
      3: { cellWidth: 100, halign: "right" },
    },
    didDrawPage: ({ pageNumber }: HookData) => {
      if (pageNumber > 1) drawOrderReportHeader(doc, restaurantName, period);
    },
  } as any);

  const summaryY = getFinalY(doc, 120) + 24;
  addSectionTitle(doc, ORDER_REPORT_LABELS.summary, summaryY);
  autoTable(doc, {
    startY: summaryY + 10,
    body: buildOrderReportSummaryRows(data, currency),
    margin: { left: 40, right: 40, bottom: 52 },
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 250 },
      1: { halign: "right", cellWidth: 265 },
    },
  } as any);

  const payoutActivity = data.payoutActivity ?? [];
  let payoutY = getFinalY(doc, summaryY + 150) + 24;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (payoutY > pageHeight - 90) {
    doc.addPage();
    drawOrderReportHeader(doc, restaurantName, period);
    payoutY = 98;
  }

  addSectionTitle(doc, ORDER_REPORT_LABELS.payoutOverview, payoutY);
  if (payoutActivity.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_GRAY_COLOR);
    doc.text(
      "Keine Auszahlungsaktivität im ausgewählten Zeitraum.",
      40,
      payoutY + 18,
    );
  } else {
    autoTable(doc, {
      startY: payoutY + 10,
      head: [
        ["Anfrage", "Beantragt", "Status", "Bezahlt", "Betrag", "Referenz"],
      ],
      body: payoutActivity.map((request) => [
        request.id,
        formatReportDate(request.requestedAt),
        request.status.toUpperCase(),
        request.paidAt ? formatReportDate(request.paidAt) : "-",
        formatReportMoney(request.amount, request.currency ?? currency),
        request.paymentReference ?? "-",
      ]),
      margin: { top: 90, left: 40, right: 40, bottom: 52 },
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 5,
        textColor: PDF_DARK_COLOR,
        lineColor: PDF_BORDER_COLOR,
        lineWidth: { bottom: 0.4 },
      },
      headStyles: {
        fillColor: PDF_LIGHT_GRAY_COLOR,
        textColor: PDF_GRAY_COLOR,
        fontStyle: "bold",
      },
      didDrawPage: ({ pageNumber }: HookData) => {
        if (pageNumber > 1) drawOrderReportHeader(doc, restaurantName, period);
      },
    } as any);
  }

  drawOrderReportFooter(doc);
};

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_DARK_COLOR);
  doc.text(title, 40, y);
};

const getFinalY = (doc: jsPDF, fallback: number) => {
  return (doc as any).lastAutoTable?.finalY || fallback;
};

const buildBreakdownRows = (items?: Array<{ key: string; count: number }>) => {
  if (!items?.length) return [];

  return items.map((item) => [prettyLabel(item.key), String(item.count ?? 0)]);
};

const buildTopItemsRows = (items?: any[], currency?: string | null) => {
  if (!items?.length) return [];

  return items.map((item) => [
    item.menuItemName || item.name || "-",
    String(item.quantity ?? item.count ?? 0),
    formatCurrency(item.revenue ?? item.totalRevenue ?? 0, currency),
  ]);
};

const normalizeReportCell = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^total\s+/, "")
    .replace(/\s+/g, " ");

const areRowsCoveredByStats = (
  rows: ReportTableRow[],
  stats: ReportPdfStat[],
) => {
  if (!rows.length || !stats.length) return false;

  const normalizedStats = new Set(
    stats.map(
      (stat) =>
        `${normalizeReportCell(stat.title)}:${normalizeReportCell(stat.value)}`,
    ),
  );

  return rows.every(([label, value]) =>
    normalizedStats.has(
      `${normalizeReportCell(label)}:${normalizeReportCell(value)}`,
    ),
  );
};

export const buildFinancialDetailRows = (
  data: any,
  currency?: string | null,
): ReportTableRow[] => [
  [
    `Gesamtbestellungen (${data?.totalOrders ?? 0})`,
    formatReportMoney(data?.grossRevenue ?? 0, currency),
  ],
];

export const buildFinancialSummaryStats = (
  stats: ReportPdfStat[],
): ReportPdfStat[] =>
  stats
    .filter((stat) => stat.id !== "financial-refunded")
    .map((stat) =>
      stat.id === "financial-cod-amount"
        ? { ...stat, title: "Barzahlung gesamt" }
        : stat,
    );

export const downloadRestaurantDashboardReportPdf = ({
  reportType,
  title,
  description,
  restaurantId,
  restaurantName,
  currency,
  period,
  stats,
  data,
}: DownloadRestaurantDashboardReportPdfInput) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  doc.setProperties({
    title,
    subject: description || title,
    creator: "Restaurant Dashboard",
  });

  if (reportType === "order") {
    renderOrderPeriodReport({
      doc,
      restaurantName: restaurantName || "Restaurant",
      currency,
      period,
      data: (data ?? {}) as OrderPeriodReportData,
    });
    doc.save(
      `${sanitizeFileName(title || "order-report")}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
    );
    return;
  }

  drawHeader({
    doc,
    title,
    description,
    restaurantId,
  });

  let y = 116;

  addSectionTitle(doc, "Summary", y);

  const summaryStats =
    reportType === "financial" ? buildFinancialSummaryStats(stats) : stats;

  autoTable(doc, {
    startY: y + 14,
    head: [["Metric", "Value", "Description"]],
    body: summaryStats.map((stat) => [
      stat.title,
      stat.value,
      stat.description || "-",
    ]),
    margin: {
      left: 40,
      right: 40,
    },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 8,
      lineColor: PDF_BORDER_COLOR,
      lineWidth: 0.4,
      textColor: PDF_DARK_COLOR,
    },
    headStyles: {
      fillColor: PDF_LIGHT_GRAY_COLOR,
      textColor: PDF_GRAY_COLOR,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 170 },
      1: { cellWidth: 140 },
      2: { cellWidth: 200 },
    },
  } as any);

  y = getFinalY(doc, y + 160) + 28;

  if (reportType === "financial") {
    const rows = buildFinancialDetailRows(data, currency);
    const shouldRenderFinancialDetails = !areRowsCoveredByStats(rows, stats);

    if (shouldRenderFinancialDetails) {
      addSectionTitle(doc, "Financial Details", y);

      autoTable(doc, {
        startY: y + 14,
        head: [["Field", "Value"]],
        body: rows,
        margin: {
          left: 40,
          right: 40,
        },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 8,
          lineColor: PDF_BORDER_COLOR,
          lineWidth: 0.4,
          textColor: PDF_DARK_COLOR,
        },
        headStyles: {
          fillColor: PDF_LIGHT_GRAY_COLOR,
          textColor: PDF_GRAY_COLOR,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 240 },
          1: { cellWidth: 250, halign: "right" },
        },
      } as any);
    }
  } else {
    const statusRows = buildBreakdownRows(data?.statusBreakdown);
    const paymentRows = buildBreakdownRows(data?.paymentStatusBreakdown);
    const orderTypeRows = buildBreakdownRows(data?.orderTypeBreakdown);
    const topItemsRows = buildTopItemsRows(data?.topItems, currency);

    if (statusRows.length) {
      addSectionTitle(doc, "Order Status Breakdown", y);

      autoTable(doc, {
        startY: y + 14,
        head: [["Status", "Count"]],
        body: statusRows,
        margin: {
          left: 40,
          right: 40,
        },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 8,
          lineColor: PDF_BORDER_COLOR,
          lineWidth: 0.4,
          textColor: PDF_DARK_COLOR,
        },
        headStyles: {
          fillColor: PDF_LIGHT_GRAY_COLOR,
          textColor: PDF_GRAY_COLOR,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 320 },
          1: { cellWidth: 160, halign: "right" },
        },
      } as any);

      y = getFinalY(doc, y + 120) + 28;
    }

    if (paymentRows.length) {
      addSectionTitle(doc, "Payment Status Breakdown", y);

      autoTable(doc, {
        startY: y + 14,
        head: [["Payment Status", "Count"]],
        body: paymentRows,
        margin: {
          left: 40,
          right: 40,
        },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 8,
          lineColor: PDF_BORDER_COLOR,
          lineWidth: 0.4,
          textColor: PDF_DARK_COLOR,
        },
        headStyles: {
          fillColor: PDF_LIGHT_GRAY_COLOR,
          textColor: PDF_GRAY_COLOR,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 320 },
          1: { cellWidth: 160, halign: "right" },
        },
      } as any);

      y = getFinalY(doc, y + 120) + 28;
    }

    if (orderTypeRows.length) {
      addSectionTitle(doc, "Order Type Breakdown", y);

      autoTable(doc, {
        startY: y + 14,
        head: [["Order Type", "Count"]],
        body: orderTypeRows,
        margin: {
          left: 40,
          right: 40,
        },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 8,
          lineColor: PDF_BORDER_COLOR,
          lineWidth: 0.4,
          textColor: PDF_DARK_COLOR,
        },
        headStyles: {
          fillColor: PDF_LIGHT_GRAY_COLOR,
          textColor: PDF_GRAY_COLOR,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 320 },
          1: { cellWidth: 160, halign: "right" },
        },
      } as any);

      y = getFinalY(doc, y + 120) + 28;
    }

    if (topItemsRows.length) {
      addSectionTitle(doc, "Top Items", y);

      autoTable(doc, {
        startY: y + 14,
        head: [["Item", "Quantity", "Revenue"]],
        body: topItemsRows,
        margin: {
          left: 40,
          right: 40,
        },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 8,
          lineColor: PDF_BORDER_COLOR,
          lineWidth: 0.4,
          textColor: PDF_DARK_COLOR,
        },
        headStyles: {
          fillColor: PDF_LIGHT_GRAY_COLOR,
          textColor: PDF_GRAY_COLOR,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 260 },
          1: { cellWidth: 100, halign: "right" },
          2: { cellWidth: 140, halign: "right" },
        },
      } as any);
    }
  }

  drawFooter(doc);

  doc.save(
    `${sanitizeFileName(title || "restaurant-report")}-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
};

export const downloadRestaurantInvoicePdf = (invoice: AdminInvoice) => {
  const currency = getInvoiceCurrency(invoice);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const title = `Invoice ${invoice.invoiceNumber}`;

  doc.setProperties({
    title,
    subject: title,
    creator: "Restaurant Dashboard",
  });

  drawHeader({
    doc,
    title,
    description: "Generated order invoice",
    restaurantId: invoice.restaurant?.id,
  });

  let y = 116;

  addSectionTitle(doc, "Invoice Summary", y);

  autoTable(doc, {
    startY: y + 14,
    body: [
      ["Invoice Number", invoice.invoiceNumber || "-"],
      ["Order ID", invoice.orderId || "-"],
      ["Restaurant", invoice.restaurant?.name || "-"],
      ["Branch", invoice.branch?.name || "-"],
      ["Customer", getCustomerName(invoice)],
      ["Order Type", prettyLabel(invoice.orderType)],
      ["Order Status", prettyLabel(invoice.orderStatus)],
      ["Payment Status", prettyLabel(invoice.paymentStatus)],
      ["Payment Method", invoice.paymentMethod || "-"],
      ["Issued At", formatDateTime(invoice.issuedAt)],
      ["Order Time", formatDateTime(invoice.orderTime)],
    ],
    margin: {
      left: 40,
      right: 40,
    },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 7,
      lineColor: PDF_BORDER_COLOR,
      lineWidth: 0.4,
      textColor: PDF_DARK_COLOR,
    },
    columnStyles: {
      0: { cellWidth: 160, fontStyle: "bold", fillColor: PDF_LIGHT_GRAY_COLOR },
      1: { cellWidth: 350 },
    },
  } as any);

  y = getFinalY(doc, y + 220) + 28;

  addSectionTitle(doc, "Items", y);

  autoTable(doc, {
    startY: y + 14,
    head: [["Item", "Variation", "Unit", "Qty", "Line Total"]],
    body:
      invoice.items?.map((item) => [
        item.menuItemName || "-",
        item.variationName || "-",
        formatInvoiceCurrency(item.unitPrice || 0, currency),
        String(item.quantity || 0),
        formatInvoiceCurrency(item.lineTotal || 0, currency),
      ]) || [],
    margin: {
      left: 40,
      right: 40,
    },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 7,
      lineColor: PDF_BORDER_COLOR,
      lineWidth: 0.4,
      textColor: PDF_DARK_COLOR,
    },
    headStyles: {
      fillColor: PDF_LIGHT_GRAY_COLOR,
      textColor: PDF_GRAY_COLOR,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 190 },
      1: { cellWidth: 110 },
      2: { cellWidth: 80, halign: "right" },
      3: { cellWidth: 60, halign: "right" },
      4: { cellWidth: 90, halign: "right" },
    },
  } as any);

  y = getFinalY(doc, y + 160) + 28;

  addSectionTitle(doc, "Amount Summary", y);

  autoTable(doc, {
    startY: y + 14,
    body: [
      ["Subtotal", formatInvoiceCurrency(invoice.subtotal || 0, currency)],
      ["Tax", formatInvoiceCurrency(invoice.taxAmount || 0, currency)],
      [
        "Delivery Fee",
        formatInvoiceCurrency(invoice.deliveryFee || 0, currency),
      ],
      [
        "Discount",
        `-${formatInvoiceCurrency(invoice.discountAmount || 0, currency)}`,
      ],
      [
        "Wallet Applied",
        `-${formatInvoiceCurrency(invoice.walletAppliedAmount || 0, currency)}`,
      ],
      [
        "Loyalty Discount",
        `-${formatInvoiceCurrency(invoice.loyaltyDiscountAmount || 0, currency)}`,
      ],
      ["Total", formatInvoiceCurrency(invoice.totalAmount || 0, currency)],
    ],
    margin: {
      left: 300,
      right: 40,
    },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 7,
      lineColor: PDF_BORDER_COLOR,
      lineWidth: 0.4,
      textColor: PDF_DARK_COLOR,
    },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: "bold" },
      1: { cellWidth: 120, halign: "right", textColor: PDF_GREEN_COLOR },
    },
  } as any);

  drawFooter(doc);

  doc.save(
    `${sanitizeFileName(invoice.invoiceNumber || invoice.orderId || "invoice")}.pdf`,
  );
};
