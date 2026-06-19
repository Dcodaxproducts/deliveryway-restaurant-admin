"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getClientStorageItem, removeClientStorageItem } from "@/services/storage";
import { getApiErrorMessage } from "@/lib/errors";
import { useGetCustomer } from "@/hooks/useCustomers";
import {
  useApplyCartCoupon,
  useCheckoutCart,
  useClearCart,
  useDeleteCartDeal,
  useDeleteCartItem,
  useGetCart,
  useGetCustomerAddresses,
  useQuoteCart,
  useRemoveCartCoupon,
  useSetCartAddress,
  useSetCartOrderType,
  useUpdateCartDealQuantity,
  useUpdateCartSettings,
  useUpdateCartItemQuantity,
} from "@/hooks/usePos";
import { useTranslations } from "next-intl";
import {
  formatPosCartBilling,
  formatPosCartItems,
  type PosCartLineItem,
} from "@/components/pages/Pos/components/pos/pos-cart-pricing";
import {
  buildPosCheckoutPayload,
  emptyGuestDeliveryAddress,
  getPosCustomerName,
  getOptionalNonNegativeNumber,
  getOptionalPositiveNumber,
  hasGuestContact,
  hasGuestDeliveryAddress,
  normalizePosCustomer,
  type PosPaymentMethod,
  type GuestDeliveryAddress,
  type PosCustomer,
  type PosOrderType,
} from "@/components/pages/Pos/components/pos/pos-checkout-payload";
import { GuestAddressLocationPicker } from "@/components/pages/Pos/components/pos/GuestAddressLocationPicker";

const POS_LAST_SELECTION_STORAGE_KEY = "posAddToCartLastSelection";
const POS_PAYMENT_METHODS: PosPaymentMethod[] = [
  "COD",
  "CARD_ON_DELIVERY",
  "STRIPE",
  "PAYPAL",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
  "WALLET",
];

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getCartData = (payload: unknown): UnknownRecord => {
  if (!isRecord(payload)) return {};
  return isRecord(payload.data) ? payload.data : payload;
};

const getString = (record: UnknownRecord, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : "";
};

const getNumberString = (record: UnknownRecord, key: string) => {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value;
  return "";
};

const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const toIsoFromDatetimeLocal = (value?: string | null) => {
  if (!value?.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export default function PosCart() {
  const t = useTranslations("pos");
  const commonT = useTranslations("common");
  const router = useRouter();
  const { branchId, isBranchAdmin } = useAuth();

  const [cartItems, setCartItems] = useState<PosCartLineItem[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderType, setOrderType] = useState<PosOrderType>("TAKEAWAY");
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("COD");
  const [scheduledOrderTime, setScheduledOrderTime] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [guestDeliveryAddress, setGuestDeliveryAddress] =
    useState<GuestDeliveryAddress>(() => emptyGuestDeliveryAddress());

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);

  useEffect(() => {
    const id = getClientStorageItem("activeCustomerId");
    setCustomerId(id);

    const rawSelection = getClientStorageItem(POS_LAST_SELECTION_STORAGE_KEY);
    if (!rawSelection) return;

    try {
      const parsedSelection = JSON.parse(rawSelection);
      const normalizedCustomer = normalizePosCustomer(parsedSelection?.customer);

      if (normalizedCustomer) {
        setSelectedCustomer(normalizedCustomer);
        setCustomerId(normalizedCustomer.id);
      }
    } catch {
      removeClientStorageItem(POS_LAST_SELECTION_STORAGE_KEY);
    }
  }, []);
  const cartQuery = useGetCart(customerId);
  const addressesQuery = useGetCustomerAddresses(customerId);
  const customerDetailQuery = useGetCustomer(customerId || "");
  const updateQuantityMutation = useUpdateCartItemQuantity();
  const updateDealQuantityMutation = useUpdateCartDealQuantity();
  const deleteCartItemMutation = useDeleteCartItem();
  const deleteCartDealMutation = useDeleteCartDeal();
  const clearCartMutation = useClearCart();
  const setOrderTypeMutation = useSetCartOrderType();
  const setAddressMutation = useSetCartAddress();
  const updateCartSettingsMutation = useUpdateCartSettings();
  const applyCouponMutation = useApplyCartCoupon();
  const removeCouponMutation = useRemoveCartCoupon();
  const quoteCartMutation = useQuoteCart();
  const checkoutMutation = useCheckoutCart();
  const loading = cartQuery.isLoading;
  const loadingAddresses = addressesQuery.isLoading;

  useEffect(() => {
    setCartItems(formatPosCartItems(cartQuery.data));
  }, [cartQuery.data]);

  useEffect(() => {
    const data = getCartData(cartQuery.data);
    const nextOrderType = getString(data, "orderType");
    const nextPaymentMethod = getString(data, "paymentMethod");

    if (
      nextOrderType === "DELIVERY" ||
      nextOrderType === "TAKEAWAY" ||
      nextOrderType === "DINE_IN"
    ) {
      setOrderType(nextOrderType);
    }

    if (nextPaymentMethod) {
      setPaymentMethod(nextPaymentMethod);
    }

    setScheduledOrderTime(toDatetimeLocalValue(getString(data, "orderTime")));
    setCustomerNote(getString(data, "customerNote") || getString(data, "note"));
    setTipAmount(getNumberString(data, "tipAmount"));
    setCouponCode(getString(data, "couponCode"));
  }, [cartQuery.data]);

  useEffect(() => {
    const list = addressesQuery.data?.data || [];
    setAddresses(list);
    if (list.length > 0) setSelectedAddress(list[0].id);
  }, [addressesQuery.data]);

  useEffect(() => {
    const normalizedCustomer = normalizePosCustomer(customerDetailQuery.data);

    if (normalizedCustomer) {
      setSelectedCustomer(normalizedCustomer);
    }
  }, [customerDetailQuery.data]);

  const isGuestCustomer = selectedCustomer?.isGuest === true;

  const getResponseMessage = (res: unknown, fallback: string) => {
    if (!res || typeof res !== "object") return fallback;

    const record = res as {
      message?: unknown;
      error?: unknown;
      data?: { message?: unknown; error?: unknown };
    };
    const errorRecord =
      record.error && typeof record.error === "object"
        ? (record.error as { message?: unknown })
        : null;
    const dataErrorRecord =
      record.data?.error && typeof record.data.error === "object"
        ? (record.data.error as { message?: unknown })
        : null;
    const candidates = [
      record.message,
      errorRecord?.message,
      typeof record.error === "string" ? record.error : "",
      record.data?.message,
      dataErrorRecord?.message,
      typeof record.data?.error === "string" ? record.data.error : "",
    ];
    const message = candidates.find(
      (entry) => typeof entry === "string" && entry.trim(),
    );

    return typeof message === "string" ? message : fallback;
  };

  const updateGuestDeliveryAddress = (
    field: keyof GuestDeliveryAddress,
    value: string,
  ) => {
    setGuestDeliveryAddress((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleOrderTypeChange = async (nextOrderType: PosOrderType) => {
    setOrderType(nextOrderType);

    if (!customerId) return;

    try {
      const res = await setOrderTypeMutation.mutateAsync({
        customerId,
        orderType: nextOrderType,
      });

      if (!res || res.error) {
        toast.error(getResponseMessage(res, t("toast.failedSetOrderType")));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.failedSetOrderType")));
    }
  };

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((i) => i.id === id);
    if (!item || !customerId) return;

    const newQty =
      type === "inc"
        ? item.quantity + 1
        : Math.max(1, item.quantity - 1);

    try {
      if (item.type === "DEAL" && item.dealId) {
        await updateDealQuantityMutation.mutateAsync({
          customerId,
          dealId: item.dealId,
          quantity: newQty,
        });
      } else {
        await updateQuantityMutation.mutateAsync({
          customerId,
          itemId: id,
          quantity: newQty,
        });
      }

      setCartItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, quantity: newQty, lineTotal: i.unitPrice * newQty }
            : i
        )
      );
    } catch {
      toast.error(t("toast.failedUpdateQuantity"));
    }
  };

  const deleteItem = async (id: string) => {
    if (!customerId) return;
    const item = cartItems.find((cartItem) => cartItem.id === id);
    if (!item) return;

    try {
      if (item.type === "DEAL" && item.dealId) {
        await deleteCartDealMutation.mutateAsync({
          customerId,
          dealId: item.dealId,
        });
      } else {
        await deleteCartItemMutation.mutateAsync({ customerId, itemId: id });
      }
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      toast.success(t("toast.itemRemoved"));
    } catch {
      toast.error(t("toast.failedRemoveItem"));
    }
  };

  const clearCart = async () => {
    if (!customerId) return;

    try {
      await clearCartMutation.mutateAsync(customerId);
      setCartItems([]);
      removeClientStorageItem("activeCustomerId");
      removeClientStorageItem(POS_LAST_SELECTION_STORAGE_KEY);
      setAddresses([]);
setSelectedAddress(null);
      setSelectedCustomer(null);
      setCustomerId(null);
      setCustomerNote("");
      setCouponCode("");
      setTipAmount("");
      setWalletAmount("");
      setLoyaltyPoints("");
      setScheduledOrderTime("");
      setGuestDeliveryAddress(emptyGuestDeliveryAddress());
    } catch {
      toast.error(t("toast.failedClearCart"));
    }
  };


  const setOrderTypeApi = async () => {
    if (!customerId) return false;

    try {
      const res = await setOrderTypeMutation.mutateAsync({ customerId, orderType });

      if (!res || res.error) {
        toast.error(getResponseMessage(res, t("toast.failedSetOrderType")));
        return false;
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.failedSetOrderType")));
      return false;
    }

    return true;
  };

  const setAddressApi = async () => {
    if (orderType !== "DELIVERY") return true;
    if (isGuestCustomer) return true;

    if (!selectedAddress) {
      toast.error(t("toast.selectAddress"));
      return false;
    }

    if (!customerId) return false;

    try {
      const res = await setAddressMutation.mutateAsync({ customerId, deliveryAddressId: selectedAddress });

      if (!res || res.error) {
        toast.error(getResponseMessage(res, t("toast.failedSetAddress")));
        return false;
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.failedSetAddress")));
      return false;
    }

    return true;
  };

  const updateCartSettingsApi = async () => {
    if (!customerId) return false;

    const orderTime = toIsoFromDatetimeLocal(scheduledOrderTime);
    const normalizedTipAmount = getOptionalNonNegativeNumber(tipAmount);
    const payload = {
      orderType,
      paymentMethod,
      ...(orderTime ? { orderTime } : {}),
      ...(normalizedTipAmount !== undefined
        ? { tipAmount: normalizedTipAmount }
        : {}),
      customerNote: customerNote.trim() || null,
    };

    try {
      const res = await updateCartSettingsMutation.mutateAsync({
        customerId,
        payload,
      });

      if (!res || res.error) {
        toast.error(getResponseMessage(res, t("toast.failedUpdateCart")));
        return false;
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.failedUpdateCart")));
      return false;
    }

    return true;
  };

  const applyCoupon = async () => {
    if (!customerId) return;
    const normalizedCouponCode = couponCode.trim();

    if (!normalizedCouponCode) {
      toast.error(t("toast.couponRequired"));
      return;
    }

    try {
      const res = await applyCouponMutation.mutateAsync({
        customerId,
        couponCode: normalizedCouponCode,
      });

      if (!res || res.error) {
        toast.error(getResponseMessage(res, t("toast.failedApplyCoupon")));
        return;
      }

      toast.success(t("toast.couponApplied"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.failedApplyCoupon")));
    }
  };

  const removeCoupon = async () => {
    if (!customerId) return;

    try {
      const res = await removeCouponMutation.mutateAsync(customerId);

      if (!res || res.error) {
        toast.error(getResponseMessage(res, t("toast.failedRemoveCoupon")));
        return;
      }

      setCouponCode("");
      toast.success(t("toast.couponRemoved"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.failedRemoveCoupon")));
    }
  };

  const refreshQuote = async () => {
    if (!customerId) return;

    const okSettings = await updateCartSettingsApi();
    if (!okSettings) return;

    try {
      const res = await quoteCartMutation.mutateAsync(customerId);

      if (!res || res.error) {
        toast.error(getResponseMessage(res, t("toast.failedRefreshQuote")));
        return;
      }

      await cartQuery.refetch();
      toast.success(t("toast.quoteRefreshed"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.failedRefreshQuote")));
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerId) return;

    if (!cartItems.length) {
      return toast.error(t("toast.cartEmpty"));
    }

    if (!selectedCustomer) {
      return toast.error(t("toast.customerDetailsRequired"));
    }

    if (isGuestCustomer && !hasGuestContact(selectedCustomer)) {
      return toast.error(t("toast.guestContactRequired"));
    }

    if (
      isGuestCustomer &&
      orderType === "DELIVERY" &&
      !hasGuestDeliveryAddress(guestDeliveryAddress)
    ) {
      return toast.error(t("toast.guestDeliveryAddressRequired"));
    }

    const orderTime = toIsoFromDatetimeLocal(scheduledOrderTime);
    if (scheduledOrderTime.trim() && !orderTime) {
      return toast.error(t("toast.invalidOrderTime"));
    }

    const normalizedTipAmount = getOptionalNonNegativeNumber(tipAmount);
    if (tipAmount.trim() && normalizedTipAmount === undefined) {
      return toast.error(t("toast.invalidTipAmount"));
    }

    const normalizedWalletAmount = getOptionalNonNegativeNumber(walletAmount);
    if (walletAmount.trim() && normalizedWalletAmount === undefined) {
      return toast.error(t("toast.invalidWalletAmount"));
    }

    const normalizedLoyaltyPoints = getOptionalPositiveNumber(loyaltyPoints);
    if (loyaltyPoints.trim() && normalizedLoyaltyPoints === undefined) {
      return toast.error(t("toast.invalidLoyaltyPoints"));
    }

    try {
      setPlacingOrder(true);

      const okType = await setOrderTypeApi();
      if (!okType) return;

      const okAddress = await setAddressApi();
      if (!okAddress) return;

      const okSettings = await updateCartSettingsApi();
      if (!okSettings) return;

      const res = await checkoutMutation.mutateAsync({
        customerId,
        payload: buildPosCheckoutPayload({
          customer: selectedCustomer,
          orderType,
          orderTime: orderTime ?? new Date().toISOString(),
          paymentMethod,
          walletAmount:
            paymentMethod === "WALLET" ? normalizedWalletAmount : undefined,
          loyaltyPoints: normalizedLoyaltyPoints,
          tipAmount: normalizedTipAmount,
          customerNote,
          guestDeliveryAddress,
          ...(isBranchAdmin && branchId ? { branchId } : {}),
        }),
      });

      if (!res || res.error) {
        return toast.error(getResponseMessage(res, t("toast.checkoutFailed")));
      }

      toast.success(t("toast.orderPlaced"));
      await clearCart();
      removeClientStorageItem("activeCustomerId");
      removeClientStorageItem(POS_LAST_SELECTION_STORAGE_KEY);
      setAddresses([]);
      setSelectedAddress(null);
      router.push("/orders");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.orderFailed")));
    } finally {
      setPlacingOrder(false);
    }
  };

  const billing = formatPosCartBilling(cartQuery.data, cartItems);
  const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="w-full bg-white rounded-xl border p-4 flex flex-col gap-4">

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex justify-between w-full text-sm font-medium">
          {t("cartList")}
          <ChevronDown size={18} />
        </CollapsibleTrigger>

        <Separator className="my-3" />

        <CollapsibleContent>
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-6">
              {commonT("loading")}
            </p>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t("noItems")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 border p-2 rounded-md items-center">

                  <div className="w-12 h-12 relative rounded-md overflow-hidden">
                    <Image
                      src={item.img || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.type === "DEAL" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          {t("deal")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatMoney(item.unitPrice)} × {item.quantity}
                    </p>
                    {item.modifiers.length > 0 ? (
                      <div className="mt-1 space-y-0.5">
                        {item.modifiers.map((modifier, modifierIndex) => (
                          <p
                            key={`${item.id}-${modifier.id || modifierIndex}`}
                            className="text-[11px] leading-4 text-gray-400"
                          >
                            {modifier.name} + {formatMoney(modifier.unitPrice)} ×{" "}
                            {modifier.quantity}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, "dec")}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, "inc")}>+</button>
                    <button onClick={() => deleteItem(item.id)} className="text-red-500 text-xs">✕</button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex justify-between w-full text-sm font-medium">
          {t("orderInformation")}
          <ChevronDown size={18} />
        </CollapsibleTrigger>

        <Separator className="my-3" />

        <CollapsibleContent className="space-y-4">
          <div className="rounded-md border bg-gray-50 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  {selectedCustomer
                    ? getPosCustomerName(selectedCustomer)
                    : t("customerNotSelected")}
                </p>
                {selectedCustomer ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {[selectedCustomer.phone, selectedCustomer.email]
                      .filter(Boolean)
                      .join(" · ") || t("customerContactMissing")}
                  </p>
                ) : null}
              </div>

              {isGuestCustomer ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">
                  {t("guestCustomer")}
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{t("orderType")}</p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderType === "TAKEAWAY"}
                  onChange={() => void handleOrderTypeChange("TAKEAWAY")}
                   className="accent-primary cursor-pointer"
                />
                {t("pickup")}
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderType === "DELIVERY"}
                  onChange={() => void handleOrderTypeChange("DELIVERY")}
                   className="accent-primary cursor-pointer"
                />
                {t("delivery")}
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderType === "DINE_IN"}
                  onChange={() => void handleOrderTypeChange("DINE_IN")}
                   className="accent-primary cursor-pointer"
                />
                {t("dineIn")}
              </label>
            </div>
          </div>

          {orderType === "DELIVERY" && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{t("selectAddress")}</p>

              {isGuestCustomer ? (
                <div className="space-y-2">
                  <input
                    value={guestDeliveryAddress.street}
                    onChange={(event) =>
                      updateGuestDeliveryAddress("street", event.target.value)
                    }
                    placeholder={t("guestAddressStreet")}
                    className="h-10 w-full rounded-md border px-3 text-sm"
                  />
                  <input
                    value={guestDeliveryAddress.area}
                    onChange={(event) =>
                      updateGuestDeliveryAddress("area", event.target.value)
                    }
                    placeholder={t("guestAddressArea")}
                    className="h-10 w-full rounded-md border px-3 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={guestDeliveryAddress.postalCode}
                      onChange={(event) =>
                        updateGuestDeliveryAddress(
                          "postalCode",
                          event.target.value,
                        )
                      }
                      placeholder={t("guestAddressPostalCode")}
                      className="h-10 w-full rounded-md border px-3 text-sm"
                    />
                    <input
                      value={guestDeliveryAddress.city}
                      onChange={(event) =>
                        updateGuestDeliveryAddress("city", event.target.value)
                      }
                      placeholder={t("guestAddressCity")}
                      className="h-10 w-full rounded-md border px-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={guestDeliveryAddress.state}
                      onChange={(event) =>
                        updateGuestDeliveryAddress("state", event.target.value)
                      }
                      placeholder={t("guestAddressState")}
                      className="h-10 w-full rounded-md border px-3 text-sm"
                    />
                    <input
                      value={guestDeliveryAddress.country}
                      onChange={(event) =>
                        updateGuestDeliveryAddress("country", event.target.value)
                      }
                      placeholder={t("guestAddressCountry")}
                      className="h-10 w-full rounded-md border px-3 text-sm"
                    />
                  </div>
                  <GuestAddressLocationPicker
                    address={guestDeliveryAddress}
                    onChange={updateGuestDeliveryAddress}
                  />
                </div>
              ) : loadingAddresses ? (
                <p className="text-sm text-gray-400">{commonT("loading")}</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-red-500">{t("noAddressFound")}</p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label key={addr.id} className="flex gap-2 border p-2 rounded-md cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                         className="accent-primary cursor-pointer"
                      />
                      <div>
                      <p className="text-sm font-medium">
  {addr.street}
</p>

<p className="text-xs text-gray-500">
  {[addr.area, addr.city, addr.state, addr.country]
    .filter(Boolean)
    .join(", ")}
</p>

{addr.isDefault && (
  <span className="text-[10px] text-primary font-medium">
    {t("defaultAddress")}
  </span>
)}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-2">{t("paymentMethod")}</p>
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PosPaymentMethod)
              }
              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            >
              {POS_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {t(`paymentMethods.${method}`)}
                </option>
              ))}
            </select>
          </div>

          {paymentMethod === "WALLET" ? (
            <div>
              <p className="text-xs text-gray-400 mb-2">{t("walletAmount")}</p>
              <input
                value={walletAmount}
                onChange={(event) => setWalletAmount(event.target.value)}
                min="0"
                step="0.01"
                type="number"
                placeholder="0.00"
                className="h-10 w-full rounded-md border px-3 text-sm"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400 mb-2">
                {t("scheduledOrderTime")}
              </p>
              <input
                value={scheduledOrderTime}
                onChange={(event) => setScheduledOrderTime(event.target.value)}
                type="datetime-local"
                className="h-10 w-full rounded-md border px-3 text-sm"
              />
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">{t("tipAmount")}</p>
              <input
                value={tipAmount}
                onChange={(event) => setTipAmount(event.target.value)}
                min="0"
                step="0.01"
                type="number"
                placeholder="0.00"
                className="h-10 w-full rounded-md border px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{t("loyaltyPoints")}</p>
            <input
              value={loyaltyPoints}
              onChange={(event) => setLoyaltyPoints(event.target.value)}
              min="1"
              step="1"
              type="number"
              placeholder="0"
              className="h-10 w-full rounded-md border px-3 text-sm"
            />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{t("couponCode")}</p>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder={t("couponCodePlaceholder")}
                className="h-10 min-w-0 flex-1 rounded-md border px-3 text-sm uppercase"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void applyCoupon()}
                disabled={applyCouponMutation.isPending}
                className="h-10"
              >
                {t("applyCoupon")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void removeCoupon()}
                disabled={!couponCode || removeCouponMutation.isPending}
                className="h-10"
              >
                {commonT("clear")}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">{t("customerNote")}</p>
            <textarea
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              placeholder={t("customerNotePlaceholder")}
              className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshQuote()}
            disabled={quoteCartMutation.isPending || updateCartSettingsMutation.isPending}
            className="h-10 w-full"
          >
            {quoteCartMutation.isPending || updateCartSettingsMutation.isPending
              ? commonT("loading")
              : t("refreshTotals")}
          </Button>

        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex justify-between w-full text-sm font-medium">
          {t("billing")}
          <ChevronDown size={18} />
        </CollapsibleTrigger>

        <Separator className="my-3" />

        <CollapsibleContent className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{t("subtotal")}</span>
            <span>{formatMoney(billing.subtotal)}</span>
          </div>

          {billing.deliveryFee > 0 ? (
            <div className="flex justify-between text-gray-500">
              <span>{t("deliveryFee")}</span>
              <span>{formatMoney(billing.deliveryFee)}</span>
            </div>
          ) : null}

          {billing.taxAmount > 0 ? (
            <div className="flex justify-between text-gray-500">
              <span>{t("tax")}</span>
              <span>{formatMoney(billing.taxAmount)}</span>
            </div>
          ) : null}

          {billing.serviceChargeAmount > 0 ? (
            <div className="flex justify-between text-gray-500">
              <span>{t("serviceCharge")}</span>
              <span>{formatMoney(billing.serviceChargeAmount)}</span>
            </div>
          ) : null}

          {billing.tipAmount > 0 ? (
            <div className="flex justify-between text-gray-500">
              <span>{t("tip")}</span>
              <span>{formatMoney(billing.tipAmount)}</span>
            </div>
          ) : null}

          {billing.discountAmount > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <span>{t("discount")}</span>
              <span>-{formatMoney(billing.discountAmount)}</span>
            </div>
          ) : null}

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>{t("total")}</span>
            <span>{formatMoney(billing.totalAmount)}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={clearCart}>
          {commonT("clear")}
        </Button>
      </div>

      <Button
        onClick={handlePlaceOrder}
        disabled={placingOrder}
        className="w-full bg-primary text-white h-11"
      >
        {placingOrder ? t("placing") : t("placeOrder")}
      </Button>

    </div>
  );
}
