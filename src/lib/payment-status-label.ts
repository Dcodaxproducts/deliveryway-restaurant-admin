const ONLINE_PAYMENT_METHODS = new Set(["STRIPE", "PAYPAL"]);

export const formatPaymentStatusLabel = (
  status?: string | null,
  paymentMethod?: string | null,
) => {
  if (!status) return "-";

  const normalizedStatus = status.toUpperCase();
  const normalizedMethod = paymentMethod?.toUpperCase() ?? "";

  if (normalizedStatus === "PAID") {
    return ONLINE_PAYMENT_METHODS.has(normalizedMethod)
      ? "ONLINE PAID"
      : "PAID";
  }

  return normalizedStatus.replaceAll("_", " ");
};
