"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function PaymentDeliveryStep() {
  const [activeTab, setActiveTab] = useState<"payment" | "delivery">("payment");

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8">
      {/* Tabs (NO extra padding) */}
      <div className="flex justify-center gap-10 mb-10 relative">
        {["payment", "delivery"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "payment" | "delivery")}
            className={`text-sm font-medium pb-2 relative ${
              activeTab === tab ? "text-black" : "text-gray-400"
            }`}
          >
            {tab === "payment" ? "Payment" : "Delivery"}
            {activeTab === tab && (
              <span className="absolute left-[-12px] right-[-12px] -bottom-1 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT (extra padding on large screens only) */}
      <div className="lg:px-12">
        {/* ================= PAYMENT ================= */}
        {activeTab === "payment" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[18px] font-semibold">Payment Method</h2>
              <button className="text-sm text-primary underline">
                How It Works!
              </button>
            </div>

            <div className="border border-[#E5E5E5] rounded-xl p-6 space-y-6">
              {/* Cash on Delivery */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium mb-1">Cash On Delivery</h3>
                  <p className="text-sm text-[#909090] mb-4">
                    Allow customers to pay with cash when their order is delivered
                  </p>

                  {/* Checkboxes */}
                  <div className="flex gap-6">
                    {["Takeaway", "Delivery", "Dine-in"].map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <span className="w-4 h-4 rounded-[4px] bg-primary flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.414a1 1 0 011.414-1.414l3.222 3.222 6.657-6.657a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <Switch defaultChecked />
              </div>

              {/* Online Payment */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium mb-1">Online Payment</h3>
                  <p className="text-sm text-[#909090]">
                    Accept payment through online payment gateways
                  </p>
                </div>

                <Switch />
              </div>
            </div>

            <div className="flex justify-end mt-10">
              <Button className="bg-primary hover:bg-red-800 px-16 py-2.5 rounded-[10px]">
                Save & Continue
              </Button>
            </div>
          </>
        )}

        {/* ================= DELIVERY ================= */}
        {activeTab === "delivery" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[18px] font-semibold">Delivery Method</h2>
              <button className="text-sm text-primary underline">
                How It Works!
              </button>
            </div>

            <div className="border border-[#E5E5E5] rounded-xl p-6 space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                </span>
                <span className="text-sm font-medium">Free Delivery</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <span className="w-4 h-4 rounded-full border border-gray-400" />
                <span className="text-sm font-medium">
                  Delivery Charge per order
                </span>
              </label>
            </div>

            <div className="flex justify-end mt-10">
              <Button className="bg-primary hover:bg-red-800 px-16 py-2.5 rounded-[10px]">
                Save & Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
