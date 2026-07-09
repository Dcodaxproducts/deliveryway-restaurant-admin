type UnknownRecord = Record<string, unknown>;

export type PosCartModifier = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PosCartLineItem = {
  id: string;
  type: "ITEM" | "DEAL";
  menuItemId: string;
  dealId?: string;
  name: string;
  unitPrice: number;
  originalUnitPrice: number;
  lineTotal: number;
  originalLineTotal: number;
  quantity: number;
  img?: string;
  modifiers: PosCartModifier[];
};

export type PosCartBilling = {
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  serviceChargeAmount: number;
  tipAmount: number;
  discountAmount: number;
  totalAmount: number;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const readNumber = (record: UnknownRecord, key: string): number | undefined =>
  toNumber(record[key]);

const firstNumber = (...values: Array<number | undefined>): number | undefined =>
  values.find((value) => typeof value === "number" && Number.isFinite(value));

const readString = (record: UnknownRecord, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

const numbersMatch = (left: number, right: number) =>
  Math.abs(left - right) < 0.005;

const getPromotionInfo = (source: UnknownRecord) => {
  const happyHour = isRecord(source.happyHour) ? source.happyHour : null;

  if (happyHour && happyHour.isCurrentlyActive !== false) return happyHour;

  const promotion = isRecord(source.promotion) ? source.promotion : null;
  if (!promotion) return null;

  const discountValue = firstNumber(readNumber(promotion, "discountValue"), 0) ?? 0;
  const discountAmount = firstNumber(readNumber(promotion, "discountAmount"), 0) ?? 0;
  const discountedPrice =
    firstNumber(readNumber(promotion, "discountedPrice"), readNumber(promotion, "discountedAmount"), 0) ?? 0;
  const discountType = String(promotion.discountType || "").toUpperCase();

  if (
    ((discountType === "PERCENTAGE" || discountType === "FLAT") && discountValue > 0) ||
    discountAmount > 0 ||
    discountedPrice > 0
  ) {
    return promotion;
  }

  return null;
};

const calculatePromotionDiscount = (originalPrice: number, promotion: UnknownRecord | null) => {
  if (!promotion || originalPrice <= 0) return 0;

  const discountValue = firstNumber(readNumber(promotion, "discountValue"), 0) ?? 0;
  const backendDiscountAmount = firstNumber(readNumber(promotion, "discountAmount"), 0) ?? 0;
  const maxDiscountAmount = firstNumber(readNumber(promotion, "maxDiscountAmount"), 0) ?? 0;
  const discountType = String(promotion.discountType || "").toUpperCase();
  let discountAmount = 0;

  if (backendDiscountAmount > 0) {
    discountAmount = backendDiscountAmount;
  } else if (discountType === "PERCENTAGE") {
    discountAmount = (originalPrice * discountValue) / 100;
  } else if (discountType === "FLAT") {
    discountAmount = discountValue;
  }

  if (maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, maxDiscountAmount);
  }

  return Math.min(Math.max(discountAmount, 0), originalPrice);
};

const getCartData = (payload: unknown): UnknownRecord => {
  if (!isRecord(payload)) return {};
  return isRecord(payload.data) ? payload.data : payload;
};

const normalizeModifiers = (item: UnknownRecord): PosCartModifier[] => {
  const rawModifiers = Array.isArray(item.selectedModifiers)
    ? item.selectedModifiers
    : Array.isArray(item.snapshotModifiers)
      ? item.snapshotModifiers
      : [];

  return rawModifiers
    .filter(isRecord)
    .map((modifier) => {
      const quantity = firstNumber(readNumber(modifier, "quantity"), 1) ?? 1;
      const unitPrice =
        firstNumber(
          readNumber(modifier, "unitPrice"),
          readNumber(modifier, "price"),
          readNumber(modifier, "priceDelta")
        ) ?? 0;

      return {
        id: readString(modifier, "modifierId") ?? readString(modifier, "id") ?? "",
        name: readString(modifier, "name") ?? "Modifier",
        quantity,
        unitPrice,
        total: firstNumber(readNumber(modifier, "total"), unitPrice * quantity) ?? 0,
      };
    });
};

export const formatPosCartItems = (payload: unknown): PosCartLineItem[] => {
  const data = getCartData(payload);
  const rawItems = Array.isArray(data.items) ? data.items : [];

  return rawItems.filter(isRecord).map((item) => {
    const menuItem = isRecord(item.menuItem) ? item.menuItem : {};
    const deal = isRecord(item.deal) ? item.deal : {};
    const quantity = firstNumber(readNumber(item, "quantity"), 1) ?? 1;
    const modifiers = normalizeModifiers(item);
    const modifiersTotal = modifiers.reduce(
      (total, modifier) => total + modifier.total,
      0
    );
    const rawItemUnitPrice = readNumber(item, "unitPrice");
    const rawDiscountedUnitPrice = firstNumber(
      readNumber(item, "discountedUnitPrice"),
      readNumber(item, "discountedUnitPriceWithModifiers"),
      readNumber(item, "finalUnitPrice")
    );
    const rawDiscountedLineTotal = firstNumber(
      readNumber(item, "discountedLineTotal"),
      readNumber(item, "finalLineTotal")
    );
    const menuItemUnitPrice = firstNumber(
      readNumber(menuItem, "unitPrice"),
      readNumber(menuItem, "price")
    );
    const rawLineTotal = readNumber(item, "lineTotal");
    const explicitUnitPriceWithModifiers = readNumber(
      item,
      "unitPriceWithModifiers"
    );
    const shouldAddModifierTotals =
      explicitUnitPriceWithModifiers === undefined &&
      modifiersTotal > 0 &&
      rawItemUnitPrice !== undefined &&
      menuItemUnitPrice !== undefined &&
      numbersMatch(rawItemUnitPrice, menuItemUnitPrice);
    const originalUnitPrice =
      firstNumber(
        explicitUnitPriceWithModifiers,
        shouldAddModifierTotals && rawItemUnitPrice !== undefined
          ? rawItemUnitPrice + modifiersTotal
          : undefined,
        rawItemUnitPrice,
        menuItemUnitPrice
      ) ?? 0;
    const promotion = getPromotionInfo(menuItem) || getPromotionInfo(item);
    const itemDiscount = calculatePromotionDiscount(
      Math.max(0, originalUnitPrice - modifiersTotal),
      promotion
    );
    const computedDiscountedUnitPrice = Math.max(0, originalUnitPrice - itemDiscount);
    const unitPrice = firstNumber(rawDiscountedUnitPrice, computedDiscountedUnitPrice) ?? originalUnitPrice;
    const rawBaseLineTotal = (rawItemUnitPrice ?? originalUnitPrice) * quantity;
    const computedOriginalLineTotal = originalUnitPrice * quantity;
    const computedLineTotal = unitPrice * quantity;
    const originalLineTotal =
      rawLineTotal !== undefined &&
      !(shouldAddModifierTotals && numbersMatch(rawLineTotal, rawBaseLineTotal))
        ? rawLineTotal
        : computedOriginalLineTotal;
    const lineTotal = firstNumber(rawDiscountedLineTotal, computedLineTotal) ?? originalLineTotal;

    return {
      id: readString(item, "id") ?? "",
      type: readString(item, "type") === "DEAL" ? "DEAL" : "ITEM",
      menuItemId: readString(item, "menuItemId") ?? readString(menuItem, "id") ?? "",
      dealId: readString(item, "dealId") || readString(deal, "id"),
      name:
        readString(deal, "title") ||
        readString(item, "menuItemName") ||
        readString(menuItem, "name") ||
        "Menu item",
      unitPrice,
      originalUnitPrice,
      lineTotal,
      originalLineTotal,
      quantity,
      img: readString(item, "imageUrl") ?? readString(menuItem, "imageUrl"),
      modifiers,
    };
  });
};

export const formatPosCartBilling = (
  payload: unknown,
  items: PosCartLineItem[]
): PosCartBilling => {
  const data = getCartData(payload);
  const quote = isRecord(data.quote) ? data.quote : {};
  const fallbackSubtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const quoteSubtotal = readNumber(quote, "subtotal");
  const subtotal =
    quoteSubtotal !== undefined
      ? Math.max(quoteSubtotal, fallbackSubtotal)
      : fallbackSubtotal;
  const deliveryFee = firstNumber(readNumber(quote, "deliveryFee"), 0) ?? 0;
  const taxAmount = firstNumber(readNumber(quote, "taxAmount"), 0) ?? 0;
  const serviceChargeAmount =
    firstNumber(readNumber(quote, "serviceChargeAmount"), 0) ?? 0;
  const tipAmount = firstNumber(readNumber(quote, "tipAmount"), 0) ?? 0;
  const discountAmount = firstNumber(readNumber(quote, "discountAmount"), 0) ?? 0;
  const fallbackTotal =
    subtotal + deliveryFee + taxAmount + serviceChargeAmount + tipAmount - discountAmount;

  const quotedTotal = firstNumber(
    readNumber(quote, "totalAmount"),
    readNumber(quote, "payableAmount")
  );

  return {
    subtotal,
    deliveryFee,
    taxAmount,
    serviceChargeAmount,
    tipAmount,
    discountAmount,
    totalAmount:
      quotedTotal !== undefined
        ? Math.max(quotedTotal, fallbackTotal)
        : fallbackTotal,
  };
};
