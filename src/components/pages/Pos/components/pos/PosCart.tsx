"use client";

import Image from "next/image";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function PosCart() {
  const { token, branchId, isBranchAdmin } = useAuth();
  const { get, patch, del, post } = useHttpClient(token);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderType, setOrderType] = useState<"TAKEAWAY" | "DELIVERY">("TAKEAWAY");

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

const [customerId, setCustomerId] = useState<string | null>(null);

useEffect(() => {
  const id = localStorage.getItem("activeCustomerId");
  setCustomerId(id);
}, []);
  /* ================= FETCH CART ================= */
  const fetchCart = async () => {
    if (!customerId) return;

    try {
      setLoading(true);

      const res = await get(`/v1/cart?customerId=${customerId}`);
      const items = res?.data?.items || [];

      const formatted = items.map((i: any) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        name: i.menuItem.name,
        price: Number(i.menuItem.unitPrice),
        quantity: i.quantity,
        img: i.menuItem.imageUrl,
      }));

      setCartItems(formatted);
    } catch (err) {
      void err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH ADDRESSES ================= */
  const fetchAddresses = async () => {
    if (!customerId) return;

    try {
      setLoadingAddresses(true);

      const res = await get(`/v1/addresses?customerId=${customerId}`);
      const list = res?.data || [];

      setAddresses(list);

      if (list.length > 0) {
        setSelectedAddress(list[0].id);
      }
    } catch (err) {
      void err;
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, [customerId]);

  /* ================= UPDATE ================= */
  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((i) => i.id === id);
    if (!item || !customerId) return;

    const newQty =
      type === "inc"
        ? item.quantity + 1
        : Math.max(1, item.quantity - 1);

    try {
      await patch(`/v1/cart/items/${id}?customerId=${customerId}`, {
        quantity: newQty,
      });

      setCartItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, quantity: newQty } : i
        )
      );
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  /* ================= DELETE ================= */
  const deleteItem = async (id: string) => {
    if (!customerId) return;

    try {
      await del(`/v1/cart/items/${id}?customerId=${customerId}`);
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  /* ================= CLEAR ================= */
  const clearCart = async () => {
    if (!customerId) return;

    try {
      await del(`/v1/cart?customerId=${customerId}`);
      setCartItems([]);
         localStorage.removeItem("activeCustomerId");
      setAddresses([]);
setSelectedAddress(null);
    } catch {
      toast.error("Failed to clear cart");
    }
  };

  /* ================= ORDER FLOW ================= */

  const setOrderTypeApi = async () => {
    const res = await patch(`/v1/cart/order-type?customerId=${customerId}`, {
      orderType,
    });

    if (!res || res.error) {
      toast.error("Failed to set order type");
      return false;
    }

    return true;
  };

  const setAddressApi = async () => {
    if (orderType !== "DELIVERY") return true;

    if (!selectedAddress) {
      toast.error("Select address");
      return false;
    }

    const res = await patch(`/v1/cart/address?customerId=${customerId}`, {
      deliveryAddressId: selectedAddress,
    });

    if (!res || res.error) {
      toast.error("Failed to set address");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!customerId) return;

    if (!cartItems.length) {
      return toast.error("Cart empty");
    }

    try {
      setPlacingOrder(true);

      const okType = await setOrderTypeApi();
      if (!okType) return;

      const okAddress = await setAddressApi();
      if (!okAddress) return;

      const res = await post(`/v1/cart/checkout?customerId=${customerId}`, {
        orderTime: new Date().toISOString(),
        paymentMethod: "COD",
        ...(isBranchAdmin && branchId ? { branchId } : {}),
      });

      if (!res || res.error) {
        return toast.error("Checkout failed");
      }

      toast.success("Order placed");
      await clearCart();
      localStorage.removeItem("activeCustomerId");
      setAddresses([]);
setSelectedAddress(null);
    } catch (err) {
      void err;
      toast.error("Order failed");
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ================= CALCULATIONS ================= */
  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="w-full bg-white rounded-xl border p-4 flex flex-col gap-4">

      {/* ================= CART ================= */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex justify-between w-full text-sm font-medium">
          Cart List
          <ChevronDown size={18} />
        </CollapsibleTrigger>

        <Separator className="my-3" />

        <CollapsibleContent>
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-6">
              Loading...
            </p>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto mb-2" />
              <p className="text-sm text-gray-400">No items</p>
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
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ${item.price} × {item.quantity}
                    </p>
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

      {/* ================= ORDER INFO ================= */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex justify-between w-full text-sm font-medium">
          Order Information
          <ChevronDown size={18} />
        </CollapsibleTrigger>

        <Separator className="my-3" />

        <CollapsibleContent className="space-y-4">

          <div>
            <p className="text-xs text-gray-400 mb-2">Order Type</p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderType === "TAKEAWAY"}
                  onChange={() => setOrderType("TAKEAWAY")}
                   className="accent-primary cursor-pointer"
                />
                Pickup
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderType === "DELIVERY"}
                  onChange={() => setOrderType("DELIVERY")}
                   className="accent-primary cursor-pointer"
                />
                Delivery
              </label>
            </div>
          </div>

          {orderType === "DELIVERY" && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Select Address</p>

              {loadingAddresses ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-red-500">No address found</p>
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
    Default
  </span>
)}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

        </CollapsibleContent>
      </Collapsible>

      {/* ================= BILL ================= */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex justify-between w-full text-sm font-medium">
          Billing
          <ChevronDown size={18} />
        </CollapsibleTrigger>

        <Separator className="my-3" />

        <CollapsibleContent className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ================= ACTIONS ================= */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={clearCart}>
          Clear
        </Button>
      </div>

      <Button
        onClick={handlePlaceOrder}
        disabled={placingOrder}
        className="w-full bg-primary text-white h-11"
      >
        {placingOrder ? "Placing..." : "Place Order"}
      </Button>

    </div>
  );
}