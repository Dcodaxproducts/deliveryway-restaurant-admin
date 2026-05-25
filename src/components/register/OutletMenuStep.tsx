"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Image as ImageIcon } from "lucide-react";
import FormInput from "./form/FormInput";
import FormSelect from "./form/FormSelect";

export default function OutletMenuStep() {
  const [activeTab, setActiveTab] = useState<"outlet" | "menu">("outlet");

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8">
      {/* Tabs + Skip */}
      <div className="flex items-center justify-center mb-10 relative">
        <div className="flex gap-10">
          {["outlet", "menu"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "outlet" | "menu")}
              className={`text-sm font-medium pb-2 relative ${
                activeTab === tab ? "text-black" : "text-gray-400"
              }`}
            >
              {tab === "outlet" ? "Outlet" : "Menu"}
              {activeTab === tab && (
                <span className="absolute left-[-10px] right-[-10px] -bottom-1 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Skip (menu only) */}
        {activeTab === "menu" && (
          <button className="absolute right-0 text-sm text-[#909090] px-4 py-2 rounded-full bg-[#F5F5F5]">
            Skip
          </button>
        )}
      </div>

      {/* ================= OUTLET (UNCHANGED) ================= */}
      {activeTab === "outlet" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-3">
              <FormInput label="Outlet Name*" placeholder="Your business name" />
            </div>

            <div>
              <label className="text-[16px] mb-2 block">Outlet Location*</label>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-primary text-[#030401] rounded-[10px] py-6"
              >
                <MapPin size={16} />
                Get Current Location
              </Button>
            </div>

            <FormInput label="Latitude*" placeholder="Latitude" />
            <FormInput label="Longitude*" placeholder="Longitude" />
          </div>

          <div className="flex justify-end mt-10">
            <Button className="bg-primary hover:bg-red-800 px-16 py-2.5 rounded-[10px]">
              Save & Continue
            </Button>
          </div>
        </>
      )}

      {/* ================= MENU ================= */}
      {activeTab === "menu" && (
        <>
          <h2 className="text-[18px] font-semibold mb-6">Add Menu Item</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-6">
              <FormInput label="Name*" placeholder="Product name" />

              <FormSelect
                placeholder="Product category"
                options={["Category 1", "Category 2"]}
              />

              <FormInput
                label="Subcategory (Optional)"
                placeholder="Product category"
              />

              <FormInput label="Price*" placeholder="Product price" />

              <FormInput
                label="Compare-at Price (Optional)"
                placeholder="Product price"
              />

              {/* Veg / Non Veg */}
              <div>
                <label className="text-[16px] mb-3 block">Food Type</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                      <span className="w-2 h-2 bg-primary rounded-full" />
                    </span>
                    <span className="text-sm">Veg</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="w-4 h-4 rounded-full border border-gray-400" />
                    <span className="text-sm">Non Veg</span>
                  </label>
                </div>
              </div>

              <FormInput
                label="Description"
                placeholder="Product description"
              />
            </div>

            {/* RIGHT COLUMN (STRICT) */}
            <div className="flex flex-col gap-6">
             {/* Upload Image */}
<div>
  <label className="text-[16px] mb-2 block">Upload Image</label>
  <div className="h-[190px] rounded-xl border border-dashed border-[#bbbbbb] bg-[#F5F5F5] flex flex-col items-center justify-center text-center cursor-pointer">
    <ImageIcon className="text-gray-400 mb-2" size={30} />

    <p className="text-sm font-medium mt-2">
      <span className="text-primary">Click to upload</span>
      <span className="text-[#909090] font-semibold ml-1">or drag and drop</span>
    </p>

    <p className="text-xs text-gray-400 mt-1">
      JPG, JPEG, PNG less than 1MB
    </p>
  </div>
</div>


              {/* Add Variant */}
              <div>
                <label className="text-[16px] mb-2 block">Add Variant</label>
                <button className="w-full text-left px-4 py-3 border border-[#bbbbbb] py-4 rounded-[10px] text-primary text-sm bg-[#F5F5F5]">
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-10">
            <button className="px-6 py-2 rounded-full bg-[#F5F5F5] text-sm text-gray-500">
              Back
            </button>
            <Button className="bg-primary hover:bg-red-800 px-16 py-2.5 rounded-[10px]">
              Save & Continue
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
