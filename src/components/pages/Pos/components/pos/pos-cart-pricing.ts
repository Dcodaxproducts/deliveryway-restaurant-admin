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
  lineTotal: number;
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
    const unitPrice =
      firstNumber(
        readNumber(item, "unitPriceWithModifiers"),
        readNumber(item, "unitPrice"),
        readNumber(menuItem, "unitPrice"),
        readNumber(menuItem, "price")
      ) ?? 0;
    const lineTotal =
      firstNumber(readNumber(item, "lineTotal"), unitPrice * quantity) ?? 0;

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
      lineTotal,
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
  const subtotal = firstNumber(readNumber(quote, "subtotal"), fallbackSubtotal) ?? 0;
  const deliveryFee = firstNumber(readNumber(quote, "deliveryFee"), 0) ?? 0;
  const taxAmount = firstNumber(readNumber(quote, "taxAmount"), 0) ?? 0;
  const serviceChargeAmount =
    firstNumber(readNumber(quote, "serviceChargeAmount"), 0) ?? 0;
  const tipAmount = firstNumber(readNumber(quote, "tipAmount"), 0) ?? 0;
  const discountAmount = firstNumber(readNumber(quote, "discountAmount"), 0) ?? 0;
  const fallbackTotal =
    subtotal + deliveryFee + taxAmount + serviceChargeAmount + tipAmount - discountAmount;

  return {
    subtotal,
    deliveryFee,
    taxAmount,
    serviceChargeAmount,
    tipAmount,
    discountAmount,
    totalAmount:
      firstNumber(
        readNumber(quote, "totalAmount"),
        readNumber(quote, "payableAmount"),
        fallbackTotal
      ) ?? 0,
  };
};
