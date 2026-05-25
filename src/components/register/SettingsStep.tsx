"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FormInput from "./form/FormInput";
import { ShoppingBag, Bike, UtensilsCrossed } from "lucide-react";

interface Props {
  formData: any;
  updateFormData: (section: string, data: any) => void;
  next: () => void;
  back: () => void;
  isLoading: boolean;
}

export default function SettingsStep({ formData, updateFormData, next, back, isLoading }: Props) {
  const settings = formData.branch.settings;
const orderTypes = [
  {
    label: "Takeaway",
    value: "TAKEAWAY",
    description: "Customers collect orders from you",
    icon: <ShoppingBag className="text-primary" size={28} />,
  },
  {
    label: "Delivery",
    value: "DELIVERY",
    description: "Delivered to customer's location",
    icon: <Bike className="text-primary" size={28} />,
  },
  {
    label: "Dine-in / QR",
    value: "DINE_IN",
    description: "Table service with QR code ordering",
    icon: <UtensilsCrossed className="text-primary" size={28} />,
  },
];
  const toggleFreeDelivery = (value: boolean) => {
    updateFormData("branch", { settings: { ...settings, isFreeDelivery: value } });
  };

  const toggleAutoAccept = (value: boolean) => {
    updateFormData("branch", { settings: { ...settings, autoAcceptOrders: value } });
  };

  const updateField = (field: keyof typeof settings, value: string) => {
    updateFormData("branch", { settings: { ...settings, [field]: value } });
  };

  const toggleOrderType = (type: string) => {
    const updated = settings.allowedOrderTypes.includes(type)
      ? settings.allowedOrderTypes.filter((t: string) => t !== type)
      : [...settings.allowedOrderTypes, type];
    updateField("allowedOrderTypes", updated);
  };

  const togglePaymentMethod = (method: string) => {
    const updated = settings.allowedPaymentMethods.includes(method)
      ? settings.allowedPaymentMethods.filter((m: string) => m !== method)
      : [...settings.allowedPaymentMethods, method];
    updateField("allowedPaymentMethods", updated);
  };
const paymentMethods = [
  { label: "Cash on Delivery", value: "COD" },
  { label: "Stripe", value: "STRIPE" },
  { label: "JazzCash", value: "JAZZCASH" },
];
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8">

      {/* DELIVERY SETTINGS */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Delivery Settings
      </h2>

      <div className="flex items-center justify-between bg-[#F5F5F5] rounded-xl px-6 py-5 mb-6">
        <span className="font-medium">Free Delivery</span>
        <Switch checked={settings.isFreeDelivery} onCheckedChange={toggleFreeDelivery} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <FormInput
          label="Free Delivery Threshold"
          placeholder="2000"
          value={settings.freeDeliveryThreshold || ""}
          onChange={(val) => updateField("freeDeliveryThreshold", val)}
        />
        <FormInput
          label="Delivery Fee"
          placeholder="150"
          value={settings.deliveryFee || ""}
          onChange={(val) => updateField("deliveryFee", val)}
        />
      </div>

      {/* ORDER TYPES */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Order Types Supported
      </h2>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
  {orderTypes.map((type) => (
    <OrderTypeCard
      key={type.value}
      icon={type.icon}
      title={type.label}
      description={type.description}
      enabled={settings.allowedOrderTypes.includes(type.value)}
      onToggle={() => toggleOrderType(type.value)}
    />
  ))}
</div>
      {/* PAYMENT METHODS */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Payment Methods
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {paymentMethods.map((method) => (
    <div
      key={method.value}
      className="flex items-center justify-between bg-[#F5F5F5] rounded-xl px-6 py-5"
    >
      <span className="font-medium">{method.label}</span>

      <Switch
        checked={settings.allowedPaymentMethods.includes(method.value)}
        onCheckedChange={() => togglePaymentMethod(method.value)}
      />
    </div>
  ))}
      </div>

      {/* ORDER PROCESSING */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Order Processing
      </h2>

      <div className="flex items-center justify-between bg-[#F5F5F5] rounded-xl px-6 py-5 mb-10">
        <span className="font-medium">Auto Accept Orders</span>
        <Switch checked={settings.autoAcceptOrders} onCheckedChange={toggleAutoAccept} />
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center">
        <Button
          onClick={back}
          className="px-6 py-2 rounded-full bg-[#F5F5F5] text-sm text-gray-500"
        >
          Back
        </Button>

       <Button
  onClick={next}
  disabled={isLoading}
  className="bg-primary hover:bg-red-800 px-16 py-2.5 rounded-[10px] flex items-center justify-center min-w-[180px]"
>
  {isLoading ? (
    <>
      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      Publishing...
    </>
  ) : (
    "Publish"
  )}
</Button>
      </div>

    </div>
  );
}

function OrderTypeCard({
  icon,
  title,
  description,
  enabled = false,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-[#F5F5F5] rounded-2xl py-10 px-12 flex flex-col items-center text-center">
      {icon}
      <h3 className="font-medium mt-4">{title}</h3>
      <p className="text-sm text-gray-600 mt-2 mb-6">{description}</p>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}