"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Image as ImageIcon } from "lucide-react";
import FormInput from "./form/FormInput";
import FormSelect from "./form/FormSelect";
import { z } from "zod";
import { validateSchema } from "@/lib/zod-errors";
import { branchSchema } from "@/validations/register";

interface Props {
  formData: any;
  updateFormData: (section: string, data: any) => void;
  next: () => void;
  back: () => void;
}

export default function BranchStep({
  formData,
  updateFormData,
  next,
  back,
}: Props) {
  const branch = formData.branch;

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---------------- FILE ---------------- */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateFormData("branch", { coverImage: file });
    }
  };

  /* ---------------- HELPERS ---------------- */

  const updateField = (field: keyof typeof branch, value: any) => {
    updateFormData("branch", { [field]: value });
  };

  const updateAddressField = (
    field: keyof typeof branch.address,
    value: any
  ) => {
    updateFormData("branch", {
      address: { ...branch.address, [field]: value },
    });
  };

  const updateSettingsField = (
    field: keyof typeof branch.settings,
    value: any
  ) => {
    updateFormData("branch", {
      settings: { ...branch.settings, [field]: value },
    });
  };

  /* ---------------- VALIDATION ---------------- */

const handleNext = () => {
  const { success, errors } = validateSchema(branchSchema, formData.branch, "branch");

  if (!success) {
    setErrors(errors);
    return;
  }

  setErrors({});
  next();
};
  /* ---------------- ERROR HELPER ---------------- */

  const error = (path: string) => errors[path];

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8">
      {/* Branch Info */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Branch Info
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <FormInput
            label="Branch Name*"
            placeholder="F-6 Super Market"
            value={branch.name || ""}
            onChange={(val) => updateField("name", val)}
          />
          {error("branch.name") && (
            <p className="text-red-500 text-xs mt-1">{error("branch.name")}</p>
          )}
        </div>

        <div>
          <FormInput
            label="Description*"
            placeholder="Our flagship branch in Islamabad."
            value={branch.description || ""}
            onChange={(val) => updateField("description", val)}
          />
          {error("branch.description") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.description")}
            </p>
          )}
        </div>

        {/* Image */}
        <div className="sm:col-span-2">
          <label className="text-[16px] mb-2 block">Upload Image*</label>

          <label className="h-[190px] rounded-xl border border-dashed border-[#bbbbbb] bg-[#F5F5F5] flex flex-col items-center justify-center text-center cursor-pointer">
            <ImageIcon className="text-gray-400 mb-2" size={30} />

            <p className="text-sm font-medium mt-2">
              <span className="text-primary">Click to upload</span>
              <span className="text-[#909090] font-semibold ml-1">
                or drag and drop
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-1">
              JPG, JPEG, PNG less than 1MB
            </p>

            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          {error("branch.coverImage") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.coverImage")}
            </p>
          )}
        </div>
      </div>

      {/* Address */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Address
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <FormInput
            label="Street*"
            placeholder="Shop 12, Block A"
            value={branch.address.street || ""}
            onChange={(val) => updateAddressField("street", val)}
          />
          {error("branch.address.street") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.address.street")}
            </p>
          )}
        </div>

        <div>
          <FormInput
            label="Area*"
            placeholder="F-6 Super Market"
            value={branch.address.area || ""}
            onChange={(val) => updateAddressField("area", val)}
          />
          {error("branch.address.area") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.address.area")}
            </p>
          )}
        </div>

        <div>
          <FormInput
            label="City*"
            placeholder="Islamabad"
            value={branch.address.city || ""}
            onChange={(val) => updateAddressField("city", val)}
          />
          {error("branch.address.city") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.address.city")}
            </p>
          )}
        </div>

        <div>
          <FormInput
            label="State*"
            placeholder="ICT"
            value={branch.address.state || ""}
            onChange={(val) => updateAddressField("state", val)}
          />
          {error("branch.address.state") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.address.state")}
            </p>
          )}
        </div>

        <div>
          <FormSelect
            placeholder="Country"
            options={["Pakistan"]}
            value={branch.address.country || "Pakistan"}
            onChange={(value) => updateAddressField("country", value)}
          />
          {error("branch.address.country") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.address.country")}
            </p>
          )}
        </div>
      </div>

      {/* Location */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Location
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div>
          <label className="text-[16px] mb-2 block">Get Location</label>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-primary text-[#030401] rounded-[10px] py-6"
          >
            <MapPin size={16} />
            Get Current Location
          </Button>
        </div>

        <div>
          <FormInput
            label="Latitude*"
            placeholder="33.7297"
            value={branch.address.lat || ""}
            onChange={(val) => updateAddressField("lat", val)}
          />
          {error("branch.address.lat") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.address.lat")}
            </p>
          )}
        </div>

        <div>
          <FormInput
            label="Longitude*"
            placeholder="73.0745"
            value={branch.address.lng || ""}
            onChange={(val) => updateAddressField("lng", val)}
          />
          {error("branch.address.lng") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.address.lng")}
            </p>
          )}
        </div>
      </div>

      {/* Settings */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Order Settings
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <FormInput
            label="Tax Percentage (%)"
            placeholder="16"
            value={branch.settings.taxPercentage || ""}
            onChange={(val) =>
              updateSettingsField("taxPercentage", Number(val))
            }
          />
          {error("branch.settings.taxPercentage") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.settings.taxPercentage")}
            </p>
          )}
        </div>

        <div>
          <FormInput
            label="Minimum Order Amount"
            placeholder="500"
            value={branch.settings.minOrderAmount || ""}
            onChange={(val) =>
              updateSettingsField("minOrderAmount", Number(val))
            }
          />
          {error("branch.settings.minOrderAmount") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.settings.minOrderAmount")}
            </p>
          )}
        </div>

        <div>
          <FormInput
            label="Delivery Radius (KM)"
            placeholder="7.5"
            value={branch.settings.radiusKm || ""}
            onChange={(val) =>
              updateSettingsField("radiusKm", Number(val))
            }
          />
          {error("branch.settings.radiusKm") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.settings.radiusKm")}
            </p>
          )}
        </div>

        <div>
          <FormInput
            label="Estimated Preparation Time (Minutes)"
            placeholder="25"
            value={branch.settings.estimatedPrepTime || ""}
            onChange={(val) =>
              updateSettingsField("estimatedPrepTime", Number(val))
            }
          />
          {error("branch.settings.estimatedPrepTime") && (
            <p className="text-red-500 text-xs mt-1">
              {error("branch.settings.estimatedPrepTime")}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-10">
        <Button
          onClick={back}
          className="px-6 py-2 rounded-full bg-[#F5F5F5] text-sm text-gray-500"
        >
          Back
        </Button>

        <Button
          onClick={handleNext}
          className="bg-primary hover:bg-red-800 px-16 py-2.5 rounded-[10px]"
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}