"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Download,
  Hash,
  Loader2,
  MessageSquare,
  ReceiptText,
  Search,
  User,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
  getAdminReportInvoiceDetails,
  getAdminReportInvoices,
  AdminInvoice,
} from "@/services/reports/reports.api";

type RestaurantInvoicesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId?: string;
  branchId?: string;
};

type InvoicePdfOptions = {
  message?: string;
  additionalCharges?: number;
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

const formatSignedCurrency = (value: number, currency = "EUR") => {
  const numericValue = Number(value || 0);

  if (numericValue > 0) {
    return `+${formatCurrency(numericValue, currency)}`;
  }

  if (numericValue < 0) {
    return `-${formatCurrency(Math.abs(numericValue), currency)}`;
  }

  return formatCurrency(0, currency);
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const prettyLabel = (value?: string) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

const parseAdjustmentAmount = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "-" || trimmed === "+") return 0;

  const numeric = Number(trimmed);

  return Number.isFinite(numeric) ? numeric : 0;
};

const sanitizeFileName = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const matchesSearch = (invoice: AdminInvoice, search: string) => {
  const keyword = search.trim().toLowerCase();

  if (!keyword) return true;

  const text = [
    invoice.invoiceNumber,
    invoice.orderId,
    invoice.branch?.name,
    invoice.customer?.name,
    invoice.customer?.email,
    invoice.orderStatus,
    invoice.paymentStatus,
    invoice.paymentMethod,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(keyword);
};

const drawPdfHeader = ({
  doc,
  invoice,
}: {
  doc: jsPDF;
  invoice: AdminInvoice;
}) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 112, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PDF_DARK_COLOR);
  doc.text("Restaurant Invoice", 40, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_GRAY_COLOR);
  doc.text(invoice.restaurant?.name || "Restaurant", 40, 64);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_PRIMARY_COLOR);
  doc.text(invoice.invoiceNumber || "-", pageWidth - 40, 44, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_GRAY_COLOR);
  doc.text(`Issued: ${formatDate(invoice.issuedAt)}`, pageWidth - 40, 64, {
    align: "right",
  });

  doc.setDrawColor(...PDF_BORDER_COLOR);
  doc.line(40, 88, pageWidth - 40, 88);
};

const drawPdfFooter = (doc: jsPDF) => {
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

const getFinalAutoTableY = (doc: jsPDF, fallback: number) => {
  return (doc as any).lastAutoTable?.finalY || fallback;
};

const addNewPageIfNeeded = (
  doc: jsPDF,
  currentY: number,
  requiredHeight: number
) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (currentY + requiredHeight < pageHeight - 70) {
    return currentY;
  }

  doc.addPage();
  return 52;
};

const addPdfSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_DARK_COLOR);
  doc.text(title, 40, y);
};

const downloadPremiumRestaurantInvoicePdf = (
  invoice: AdminInvoice,
  options: InvoicePdfOptions
) => {
  const currency = getInvoiceCurrency(invoice);
  const additionalCharges = Number(options.additionalCharges || 0);
  const baseTotalAmount = Number(invoice.totalAmount || 0);
  const finalTotalAmount = baseTotalAmount + additionalCharges;
  const message = options.message?.trim();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  doc.setProperties({
    title: invoice.invoiceNumber || "Invoice",
    subject: "Restaurant invoice",
    creator: "Restaurant Dashboard",
  });

  drawPdfHeader({
    doc,
    invoice,
  });

  let y = 122;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...PDF_BORDER_COLOR);
  doc.roundedRect(40, y, 515, 112, 12, 12, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_DARK_COLOR);
  doc.text("Invoice Summary", 58, y + 28);

  const summaryRows = [
    ["Order ID", invoice.orderId || "-"],
    ["Branch", invoice.branch?.name || "-"],
    ["Customer", getCustomerName(invoice)],
    [
      "Payment",
      `${prettyLabel(invoice.paymentStatus)} / ${invoice.paymentMethod || "-"}`,
    ],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  summaryRows.forEach(([label, value], index) => {
    const rowY = y + 50 + index * 18;

    doc.setTextColor(...PDF_GRAY_COLOR);
    doc.text(label, 58, rowY);

    doc.setTextColor(...PDF_DARK_COLOR);
    doc.text(doc.splitTextToSize(value, 330), 160, rowY);
  });

  y += 142;

  if (message) {
    const messageLines = doc.splitTextToSize(message, 480);
    const messageHeight = Math.max(78, 48 + messageLines.length * 12);

    y = addNewPageIfNeeded(doc, y, messageHeight);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...PDF_BORDER_COLOR);
    doc.roundedRect(40, y, 515, messageHeight, 12, 12, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_DARK_COLOR);
    doc.text("Invoice Message", 58, y + 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_GRAY_COLOR);
    doc.text(messageLines, 58, y + 50);

    y += messageHeight + 28;
  }

  y = addNewPageIfNeeded(doc, y, 140);

  addPdfSectionTitle(doc, "Items", y);

  autoTable(doc, {
    startY: y + 16,
    head: [["Item", "Variation", "Unit", "Qty", "Line Total"]],
    body:
      invoice.items?.length
        ? invoice.items.map((item) => [
            item.menuItemName || "-",
            item.variationName || "-",
            formatCurrency(item.unitPrice || 0, currency),
            String(item.quantity || 0),
            formatCurrency(item.lineTotal || 0, currency),
          ])
        : [["No item details available", "-", "-", "-", "-"]],
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
      valign: "middle",
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
      4: { cellWidth: 90, halign: "right", fontStyle: "bold" },
    },
  } as any);

  y = getFinalAutoTableY(doc, y + 140) + 28;
  y = addNewPageIfNeeded(doc, y, 170);

  addPdfSectionTitle(doc, "Amount Summary", y);

  autoTable(doc, {
    startY: y + 16,
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
      ["Base Total", formatCurrency(baseTotalAmount, currency)],
      ["Additional Charges", formatSignedCurrency(additionalCharges, currency)],
      ["Final Total", formatCurrency(finalTotalAmount, currency)],
    ],
    margin: {
      left: 260,
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
      0: { cellWidth: 150, fontStyle: "bold" },
      1: { cellWidth: 145, halign: "right" },
    },
    didParseCell: (data: any) => {
      const label = data.row.raw?.[0];

      if (label === "Final Total") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = PDF_GREEN_COLOR;
      }

      if (label === "Additional Charges") {
        data.cell.styles.textColor =
          additionalCharges < 0 ? PDF_PRIMARY_COLOR : PDF_GREEN_COLOR;
      }
    },
  } as any);

  drawPdfFooter(doc);

  doc.save(
    `${sanitizeFileName(
      invoice.invoiceNumber || invoice.orderId || "invoice"
    )}.pdf`
  );
};

export default function RestaurantInvoicesModal({
  open,
  onOpenChange,
  restaurantId,
  branchId,
}: RestaurantInvoicesModalProps) {
  const [search, setSearch] = useState("");
  const [downloadOrderId, setDownloadOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [additionalChargesInput, setAdditionalChargesInput] = useState("");

  const additionalCharges = useMemo(() => {
    return parseAdjustmentAmount(additionalChargesInput);
  }, [additionalChargesInput]);

  const {
    data: invoicesResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["restaurant-dashboard-invoices", restaurantId, branchId],
    queryFn: () =>
      getAdminReportInvoices({
        restaurantId,
        branchId,
      }),
    enabled: Boolean(open && restaurantId),
  });

  const invoices = useMemo(() => {
    return invoicesResponse?.data || [];
  }, [invoicesResponse]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => matchesSearch(invoice, search));
  }, [invoices, search]);

  const previewCurrency = getInvoiceCurrency(filteredInvoices[0] || invoices[0]);

  const handleSearchClick = () => {
    setSearch((current) => current.trim());
  };

  const handleDownloadInvoice = async (invoice: AdminInvoice) => {
    if (!restaurantId) {
      toast.error("Restaurant is not available");
      return;
    }

    try {
      setDownloadOrderId(invoice.orderId);

      const response = await getAdminReportInvoiceDetails({
        orderId: invoice.orderId,
        restaurantId,
        branchId: branchId || invoice.branch?.id,
      });

      downloadPremiumRestaurantInvoicePdf(response.data, {
        message,
        additionalCharges,
      });

      toast.success("Invoice PDF downloaded successfully");
    } catch {
      toast.error("Failed to download invoice PDF");
    } finally {
      setDownloadOrderId(null);
    }
  };

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDownloadOrderId(null);
      setMessage("");
      setAdditionalChargesInput("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className="
          flex h-[96vh] !w-[calc(100vw-24px)] !max-w-none flex-col overflow-hidden
          rounded-[26px] border-0 bg-[#F7F7F7] p-0 shadow-2xl
          sm:!w-[calc(100vw-48px)]
          lg:!w-[980px]
          xl:!w-[1120px]
        "
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <DialogTitle className="text-[28px] font-semibold tracking-tight text-gray-950">
                Restaurant Invoices
              </DialogTitle>

              <p className="mt-2 max-w-[680px] text-sm leading-6 text-gray-700">
                Add an optional invoice message and amount adjustment, then
                download invoice PDFs for this restaurant.
              </p>
            </div>

            <div className="rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Shown
              </p>
              <p className="mt-1 text-xl font-bold text-gray-950">
                {filteredInvoices.length}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-4 sm:px-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
                Invoice Message
              </label>

              <div className="relative">
                <MessageSquare
                  size={17}
                  className="absolute left-3 top-3.5 text-gray-500"
                />

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Add an optional message for downloaded invoice PDFs..."
                  rows={2}
                  className="min-h-[86px] w-full resize-none rounded-[14px] border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
                Additional Charges
              </label>

              <input
                type="number"
                step="0.01"
                value={additionalChargesInput}
                onChange={(event) =>
                  setAdditionalChargesInput(event.target.value)
                }
                placeholder="0.00 or -25.00"
                className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-950 outline-none transition placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />

              <div className="mt-2 rounded-[14px] border border-gray-200 bg-[#FAFAFA] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">
                    Adjustment
                  </span>
                  <span
                    className={`font-bold ${
                      additionalCharges < 0
                        ? "text-primary"
                        : additionalCharges > 0
                        ? "text-green"
                        : "text-gray-800"
                    }`}
                  >
                    {formatSignedCurrency(additionalCharges, previewCurrency)}
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-gray-600">
                  Positive values are added. Negative values are subtracted.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearchClick();
                  }
                }}
                placeholder="Search invoice, customer, branch, order ID..."
                className="h-[48px] w-full rounded-[14px] border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <Button
              type="button"
              onClick={handleSearchClick}
              className="h-[48px] rounded-[14px] px-9 font-semibold bg-primary text-white transition hover:bg-primary/90"
            >
              <Search size={17}  />
              Search
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
          {isLoading || isFetching ? (
            <div className="flex min-h-[520px] items-center justify-center gap-2 text-gray-600">
              <Loader2 size={18} className="animate-spin" />
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ReceiptText size={26} />
              </div>

              <h3 className="text-base font-semibold text-gray-950">
                No invoices found
              </h3>

              <p className="mt-1 max-w-[420px] text-sm text-gray-700">
                There are no generated invoices matching your current search.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {filteredInvoices.map((invoice) => {
                const currency = getInvoiceCurrency(invoice);
                const isCurrentDownload = downloadOrderId === invoice.orderId;
                const baseAmount = Number(invoice.totalAmount || 0);
                const finalAmount = baseAmount + additionalCharges;

                return (
                  <div
                    key={invoice.orderId}
                    className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)_210px] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                            <ReceiptText size={21} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-all text-base font-bold leading-5 text-gray-950">
                                {invoice.invoiceNumber}
                              </p>

                              <StatusPill
                                label={prettyLabel(invoice.paymentStatus)}
                                variant={
                                  invoice.paymentStatus === "PAID"
                                    ? "success"
                                    : "neutral"
                                }
                              />

                              <StatusPill
                                label={prettyLabel(invoice.orderStatus)}
                                variant={
                                  ["CANCELLED", "REJECTED"].includes(
                                    invoice.orderStatus
                                  )
                                    ? "danger"
                                    : "primary"
                                }
                              />
                            </div>

                            <div className="mt-3 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                              <InfoLine
                                icon={<User size={15} />}
                                label={getCustomerName(invoice)}
                              />

                              <InfoLine
                                icon={<Building2 size={15} />}
                                label={invoice.branch?.name || "-"}
                              />

                              <InfoLine
                                icon={<Hash size={15} />}
                                label={invoice.orderId}
                                className="md:col-span-2"
                                allowWrap
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-[16px] border border-gray-100 bg-[#FAFAFA] p-4">
                        <MiniInfo
                          label="Issued"
                          value={formatDate(invoice.issuedAt)}
                          icon={<CalendarDays size={15} />}
                        />

                        <MiniInfo
                          label="Payment"
                          value={invoice.paymentMethod || "-"}
                          icon={<Wallet size={15} />}
                        />

                        <MiniInfo
                          label="Base"
                          value={formatCurrency(baseAmount, currency)}
                        />

                        <MiniInfo
                          label="Adjustment"
                          value={formatSignedCurrency(
                            additionalCharges,
                            currency
                          )}
                          valueClassName={
                            additionalCharges < 0
                              ? "text-primary"
                              : additionalCharges > 0
                              ? "text-green"
                              : "text-gray-950"
                          }
                        />
                      </div>

                      <div className="rounded-[16px] border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
                          Final PDF Amount
                        </p>

                        <p className="mt-1 text-2xl font-bold text-green">
                          {formatCurrency(finalAmount, currency)}
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={Boolean(downloadOrderId)}
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="mt-4 h-[44px] w-full rounded-[13px] border-gray-300 px-4 font-semibold text-gray-900 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          {isCurrentDownload ? (
                            <Loader2
                              size={16}
                              className="mr-2 animate-spin"
                            />
                          ) : (
                            <Download size={16} className="mr-2" />
                          )}
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {filteredInvoices.length} invoice(s) shown
              </p>
              <p className="mt-0.5 text-xs text-gray-600">
                Downloads include message and adjustment values when provided.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-[42px] rounded-[12px] border-gray-300 px-6 font-semibold text-gray-900"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: "success" | "primary" | "danger" | "neutral";
}) {
  const className =
    variant === "success"
      ? "bg-green-50 text-green"
      : variant === "primary"
      ? "bg-primary/10 text-primary"
      : variant === "danger"
      ? "bg-red-50 text-red-600"
      : "bg-gray-100 text-gray-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function InfoLine({
  icon,
  label,
  className,
  allowWrap = false,
}: {
  icon: ReactNode;
  label: string;
  className?: string;
  allowWrap?: boolean;
}) {
  return (
    <div className={`flex min-w-0 items-start gap-2 ${className || ""}`}>
      <span className="mt-0.5 shrink-0 text-gray-500">{icon}</span>
      <span
        className={
          allowWrap
            ? "min-w-0 break-all text-xs font-medium leading-5 text-gray-700"
            : "truncate font-medium text-gray-800"
        }
      >
        {label}
      </span>
    </div>
  );
}

function MiniInfo({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
        {icon ? <span>{icon}</span> : null}
        <span>{label}</span>
      </div>

      <p
        className={`mt-1 truncate text-sm font-bold ${
          valueClassName || "text-gray-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}