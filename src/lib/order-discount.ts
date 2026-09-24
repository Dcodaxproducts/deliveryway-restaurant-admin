export type OrderCouponInput = {
  id?: string | null;
  code?: string | null;
  title?: string | null;
};

export type OrderDiscountInput = {
  coupon?: OrderCouponInput | null;
  discountAmount?: number | null;
};

export type AppliedOrderCoupon = {
  id?: string;
  code: string;
  title?: string;
  discountAmount: number;
};

const normalizeOptionalText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const resolveAppliedOrderCoupon = (
  order: OrderDiscountInput,
): AppliedOrderCoupon | null => {
  const code = normalizeOptionalText(order.coupon?.code);
  const discountAmount = order.discountAmount;

  if (
    !code ||
    typeof discountAmount !== "number" ||
    !Number.isFinite(discountAmount) ||
    discountAmount <= 0
  ) {
    return null;
  }

  return {
    ...(normalizeOptionalText(order.coupon?.id)
      ? { id: normalizeOptionalText(order.coupon?.id) }
      : {}),
    code,
    ...(normalizeOptionalText(order.coupon?.title)
      ? { title: normalizeOptionalText(order.coupon?.title) }
      : {}),
    discountAmount,
  };
};
