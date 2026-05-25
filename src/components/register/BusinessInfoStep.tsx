"use client";

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import FormInput from "./form/FormInput";
import FormSelect from "./form/FormSelect";

export default function BusinessInfoStep() {
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8">
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Business Info
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormInput label="Business Name*" placeholder="Your business name" />

        {/* Logo Upload */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 border border-[#909090] rounded-lg flex items-center justify-center">
            <Upload className="text-[#909090]" />
          </div>
          <div>
            <p className="text-sm font-medium">Choose File</p>
            <p className="text-xs text-[#909090]">PNG, JPG, JPEG upto 2MB</p>
          </div>
        </div>

        <FormInput label="Business Address (Optional)" placeholder="Your business address" />
        <FormInput label="Business Address 2 (Optional)" placeholder="Street address" />

        {/* Location: India + State | City + ZIP */}
        <div className="grid grid-cols-4 gap-4 col-span-2">
          <FormSelect placeholder="India" options={["India"]} />
          <FormSelect placeholder="Select State" options={["State"]} />
          <FormSelect placeholder="Select City" options={["City"]} />
          <FormSelect placeholder="ZIP Code (Optional)" options={["ZIP"]} />
        </div>

        {/* Phone & Support */}
        <FormInput label="Phone Number*" placeholder="Your phone number" />
        <FormInput label="Support Phone Number (Optional)" placeholder="Your phone number" />
        <FormInput label="Support Whatsapp Number (Optional)" placeholder="Your whatsapp number" />
        <FormInput label="Support Email (Optional)" placeholder="Your email address" />
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-8">
        <Button className="bg-primary hover:bg-red-800 px-15 py-2.5 rounded-[10px]">
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
