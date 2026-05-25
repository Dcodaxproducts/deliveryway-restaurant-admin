"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AdminInvoice } from "@/services/reports/reports.api";

type DashboardReportType = "financial" | "order";

type ReportPdfStat = {
  title: string;
  value: string;
  description?: string;
};

type DownloadRestaurantDashboardReportPdfInput = {
  reportType: DashboardReportType;
  title: string;
  description?: string;
  restaurantId?: string;
  currency?: string;
  stats: ReportPdfStat[];
  data: any;
};

const PDF_PRIMARY_COLOR: [number, number, number] = [206, 24, 27];
const PDF_GREEN_COLOR: [number, number, number] = [16, 185, 129];
const PDF_DARK_COLOR: [number, number, number] = [17, 24, 39];
const PDF_GRAY_COLOR: [number, number, number] = [107, 114, 128];
const PDF_LIGHT_GRAY_COLOR: [number, number, number] = [249, 250, 251];
const PDF_BORDER_COLOR: [number, number, number] = [229, 231, 235];

const formatCurrency = (value: number, currency = "EUR") => {
  const numericValue = Number(value || 0);

  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  return invoice?.transactions?.[0]?.currency || "EUR";
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
  doc.text(new Date().toLocaleString("de-DE"), pageWidth - 40, 58, {
    align: "right",
  });

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

const buildTopItemsRows = (items?: any[], currency = "EUR") => {
  if (!items?.length) return [];

  return items.map((item) => [
    item.menuItemName || item.name || "-",
    String(item.quantity ?? item.count ?? 0),
    formatCurrency(item.revenue ?? item.totalRevenue ?? 0, currency),
  ]);
};

export const downloadRestaurantDashboardReportPdf = ({
  reportType,
  title,
  description,
  restaurantId,
  currency = "EUR",
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

  drawHeader({
    doc,
    title,
    description,
    restaurantId,
  });

  let y = 116;

  addSectionTitle(doc, "Summary", y);

  autoTable(doc, {
    startY: y + 14,
    head: [["Metric", "Value", "Description"]],
    body: stats.map((stat) => [
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
    addSectionTitle(doc, "Financial Details", y);

    const rows = [
      ["Total Orders", String(data?.totalOrders ?? 0)],
      ["Gross Revenue", formatCurrency(data?.grossRevenue ?? 0, currency)],
      ["Paid Revenue", formatCurrency(data?.paidRevenue ?? 0, currency)],
      ["Net Revenue", formatCurrency(data?.netRevenue ?? 0, currency)],
      [
        "Average Order Value",
        formatCurrency(data?.averageOrderValue ?? 0, currency),
      ],
      ["Total Tax", formatCurrency(data?.totalTax ?? 0, currency)],
      [
        "Total Delivery Fee",
        formatCurrency(data?.totalDeliveryFee ?? 0, currency),
      ],
      ["Refunded Amount", formatCurrency(data?.refundedAmount ?? 0, currency)],
    ];

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
      .slice(0, 10)}.pdf`
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
        formatCurrency(item.unitPrice || 0, currency),
        String(item.quantity || 0),
        formatCurrency(item.lineTotal || 0, currency),
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
      ["Subtotal", formatCurrency(invoice.subtotal || 0, currency)],
      ["Tax", formatCurrency(invoice.taxAmount || 0, currency)],
      ["Delivery Fee", formatCurrency(invoice.deliveryFee || 0, currency)],
      ["Discount", `-${formatCurrency(invoice.discountAmount || 0, currency)}`],
      [
        "Wallet Applied",
        `-${formatCurrency(invoice.walletAppliedAmount || 0, currency)}`,
      ],
      [
        "Loyalty Discount",
        `-${formatCurrency(invoice.loyaltyDiscountAmount || 0, currency)}`,
      ],
      ["Total", formatCurrency(invoice.totalAmount || 0, currency)],
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
    `${sanitizeFileName(invoice.invoiceNumber || invoice.orderId || "invoice")}.pdf`
  );
};