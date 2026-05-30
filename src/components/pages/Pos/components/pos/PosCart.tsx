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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getClientStorageItem, removeClientStorageItem } from "@/services/storage";
import {
  useCheckoutCart,
  useClearCart,
  useDeleteCartItem,
  useGetCart,
  useGetCustomerAddresses,
  useSetCartAddress,
  useSetCartOrderType,
  useUpdateCartItemQuantity,
} from "@/hooks/usePos";

export default function PosCart() {
  const { branchId, isBranchAdmin } = useAuth();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderType, setOrderType] = useState<"TAKEAWAY" | "DELIVERY">("TAKEAWAY");

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

const [customerId, setCustomerId] = useState<string | null>(null);

useEffect(() => {
  const id = getClientStorageItem("activeCustomerId");
  setCustomerId(id);
}, []);
  const cartQuery = useGetCart(customerId);
  const addressesQuery = useGetCustomerAddresses(customerId);
  const updateQuantityMutation = useUpdateCartItemQuantity();
  const deleteCartItemMutation = useDeleteCartItem();
  const clearCartMutation = useClearCart();
  const setOrderTypeMutation = useSetCartOrderType();
  const setAddressMutation = useSetCartAddress();
  const checkoutMutation = useCheckoutCart();
  const loading = cartQuery.isLoading;
  const loadingAddresses = addressesQuery.isLoading;

useEffect(() => {
  const items = cartQuery.data?.data?.items || [];
  const formatted = items.map((i: any) => ({
    id: i.id,
    menuItemId: i.menuItemId,
    name: i.menuItem.name,
    price: Number(i.menuItem.unitPrice),
    quantity: i.quantity,
    img: i.menuItem.imageUrl,
  }));
  setCartItems(formatted);
}, [cartQuery.data]);

useEffect(() => {
  const list = addressesQuery.data?.data || [];
  setAddresses(list);
  if (list.length > 0) setSelectedAddress(list[0].id);
}, [addressesQuery.data]);

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((i) => i.id === id);
    if (!item || !customerId) return;

    const newQty =
      type === "inc"
        ? item.quantity + 1
        : Math.max(1, item.quantity - 1);

    try {
      await updateQuantityMutation.mutateAsync({ customerId, itemId: id, quantity: newQty });

      setCartItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, quantity: newQty } : i
        )
      );
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const deleteItem = async (id: string) => {
    if (!customerId) return;

    try {
      await deleteCartItemMutation.mutateAsync({ customerId, itemId: id });
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!customerId) return;

    try {
      await clearCartMutation.mutateAsync(customerId);
      setCartItems([]);
      removeClientStorageItem("activeCustomerId");
      setAddresses([]);
setSelectedAddress(null);
    } catch {
      toast.error("Failed to clear cart");
    }
  };


  const setOrderTypeApi = async () => {
    if (!customerId) return false;
    const res = await setOrderTypeMutation.mutateAsync({ customerId, orderType });

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

    if (!customerId) return false;
    const res = await setAddressMutation.mutateAsync({ customerId, deliveryAddressId: selectedAddress });

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

      const res = await checkoutMutation.mutateAsync({
        customerId,
        payload: {
          orderTime: new Date().toISOString(),
          paymentMethod: "COD",
          ...(isBranchAdmin && branchId ? { branchId } : {}),
        },
      });

      if (!res || res.error) {
        return toast.error("Checkout failed");
      }

      toast.success("Order placed");
      await clearCart();
      removeClientStorageItem("activeCustomerId");
      setAddresses([]);
setSelectedAddress(null);
    } catch (err) {
      void err;
      toast.error("Order failed");
    } finally {
      setPlacingOrder(false);
    }
  };

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="w-full bg-white rounded-xl border p-4 flex flex-col gap-4">

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
