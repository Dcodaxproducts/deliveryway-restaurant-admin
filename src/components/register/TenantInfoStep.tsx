"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import FormInput from "./form/FormInput";
import FormSelect from "./form/FormSelect";
import { validateSchema } from "@/lib/zod-errors";
import { restaurantSchema, tenantSchema } from "@/validations/register";

interface Props {
  formData: any;
  updateFormData: (section: string, data: any) => void;
  next: () => void;
  back: () => void;
}

export default function TenantInfoStep({
  formData,
  updateFormData,
  next,
  back,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
/* ---------------- SLUG GENERATOR ---------------- */

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
    .replace(/\s+/g, "-")           // spaces -> dash
    .replace(/-+/g, "-");           // remove duplicate dashes
};
  /* ---------------- REFS FOR UX ---------------- */

  const refs: any = {
    tenantName: useRef<HTMLInputElement>(null),
    tenantBio: useRef<HTMLInputElement>(null),

    restaurantName: useRef<HTMLInputElement>(null),
    slug: useRef<HTMLInputElement>(null),
    tagline: useRef<HTMLInputElement>(null),

    supportEmail: useRef<HTMLInputElement>(null),
    supportPhone: useRef<HTMLInputElement>(null),
    supportWhatsapp: useRef<HTMLInputElement>(null),

    primaryColor: useRef<HTMLInputElement>(null),
    secondaryColor: useRef<HTMLInputElement>(null),
  };

  /* ---------------- ERROR HELPERS ---------------- */

  const clearError = (field: string) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const validateField = (schema: any, data: any, path: string) => {
    const result = validateSchema(schema, data);
    const message = result.success ? undefined : result.errors[path];

    if (message) {
      setErrors((prev) => ({
        ...prev,
        [path]: message,
      }));
    }
  };

  /* ---------------- FILE HANDLERS ---------------- */

  const handleTenantLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateFormData("tenant", { logoUrl: file });
      clearError("tenant.logoUrl");
    }
  };

  const handleRestaurantLogoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      updateFormData("restaurant", { logoUrl: file });
      clearError("restaurant.logoUrl");
    }
  };

  /* ---------------- NEXT VALIDATION ---------------- */

  const handleNext = () => {
    const tenant = validateSchema(tenantSchema, formData.tenant, "tenant");
    const restaurant = validateSchema(
      restaurantSchema,
      formData.restaurant,
      "restaurant"
    );

    const mergedErrors = {
      ...tenant.errors,
      ...restaurant.errors,
    };

    if (Object.keys(mergedErrors).length > 0) {
      setErrors(mergedErrors);

      const firstError = Object.keys(mergedErrors)[0];

      const focusMap: any = {
        "tenant.name": refs.tenantName,
        "tenant.bio": refs.tenantBio,

        "restaurant.name": refs.restaurantName,
        "restaurant.slug": refs.slug,
        "restaurant.tagline": refs.tagline,

        "restaurant.supportContact.email": refs.supportEmail,
        "restaurant.supportContact.phone": refs.supportPhone,
        "restaurant.supportContact.whatsapp": refs.supportWhatsapp,

        "restaurant.branding.primaryColor": refs.primaryColor,
        "restaurant.branding.secondaryColor": refs.secondaryColor,
      };

      focusMap[firstError]?.current?.focus();

      return;
    }

    setErrors({});
    next();
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8">
      {/* Tenant Info */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Tenant Info
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <FormInput
            ref={refs.tenantName}
            label="Tenant Name*"
            placeholder="Indus Foods Group"
            value={formData.tenant.name || ""}
            onChange={(val: string) => {
              updateFormData("tenant", { name: val });
              clearError("tenant.name");
            }}
            onBlur={() => validateField(tenantSchema, formData.tenant, "name")}
          />
          {errors["tenant.name"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["tenant.name"]}
            </p>
          )}
        </div>

        {/* Tenant Logo */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tenant Logo*</label>

          <label className="flex items-center gap-4 cursor-pointer rounded-lg hover:bg-gray-50 transition">
            <div className="w-14 h-14 border border-[#909090] rounded-lg flex items-center justify-center">
              <Upload className="text-[#909090]" />
            </div>

            <div>
              <p className="text-sm font-medium">
                {formData.tenant.logoUrl?.name || "Choose File"}
              </p>
              <p className="text-xs text-[#909090]">
                PNG, JPG, JPEG upto 2MB
              </p>
            </div>

            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleTenantLogoChange}
            />
          </label>

          {errors["tenant.logoUrl"] && (
            <p className="text-red-500 text-xs">
              {errors["tenant.logoUrl"]}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <FormInput
            ref={refs.tenantBio}
            label="Tenant Bio*"
            placeholder="Leading hospitality group in South Asia."
            value={formData.tenant.bio || ""}
            onChange={(val: string) => {
              updateFormData("tenant", { bio: val });
              clearError("tenant.bio");
            }}
            onBlur={() => validateField(tenantSchema, formData.tenant, "bio")}
          />
          {errors["tenant.bio"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["tenant.bio"]}
            </p>
          )}
        </div>
      </div>

      {/* Restaurant Info */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Restaurant Info
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <FormInput
            ref={refs.restaurantName}
            label="Restaurant Name*"
            placeholder="KFC Pakistan"
            value={formData.restaurant.name || ""}
          onChange={(val: string) => {
  const slug = generateSlug(val);

  updateFormData("restaurant", {
    name: val,
    slug: slug,
  });

  clearError("restaurant.name");
  clearError("restaurant.slug");
}}
            onBlur={() =>
              validateField(restaurantSchema, formData.restaurant, "name")
            }
          />
          {errors["restaurant.name"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.name"]}
            </p>
          )}
        </div>

        {/* Restaurant Logo */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Restaurant Logo*</label>

          <label className="flex items-center gap-4 cursor-pointer rounded-lg hover:bg-gray-50 transition">
            <div className="w-14 h-14 border border-[#909090] rounded-lg flex items-center justify-center">
              <Upload className="text-[#909090]" />
            </div>

            <div>
              <p className="text-sm font-medium">
                {formData.restaurant.logoUrl?.name || "Choose File"}
              </p>
              <p className="text-xs text-[#909090]">
                PNG, JPG, JPEG upto 2MB
              </p>
            </div>

            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleRestaurantLogoChange}
            />
          </label>

          {errors["restaurant.logoUrl"] && (
            <p className="text-red-500 text-xs">
              {errors["restaurant.logoUrl"]}
            </p>
          )}
        </div>

        <div>
         <FormInput
  ref={refs.slug}
  label="Slug*"
  placeholder="kfc-pakistan"
  value={formData.restaurant.slug || ""}
  
/>
          {errors["restaurant.slug"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.slug"]}
            </p>
          )}
        </div>

        <div>
          <FormInput
            ref={refs.tagline}
            label="Tagline*"
            placeholder="It's Finger Lickin' Good"
            value={formData.restaurant.tagline || ""}
            onChange={(val: string) => {
              updateFormData("restaurant", { tagline: val });
              clearError("restaurant.tagline");
            }}
            onBlur={() =>
              validateField(restaurantSchema, formData.restaurant, "tagline")
            }
          />
          {errors["restaurant.tagline"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.tagline"]}
            </p>
          )}
        </div>
      </div>

      {/* Support Contact */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Support Contact
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <FormInput
            ref={refs.supportEmail}
            label="Support Email*"
            placeholder="support@kfc.com.pk"
            value={formData.restaurant.supportContact.email || ""}
            onChange={(val: string) => {
              updateFormData("restaurant", {
                supportContact: {
                  ...formData.restaurant.supportContact,
                  email: val,
                },
              });
              clearError("restaurant.supportContact.email");
            }}
          />
          {errors["restaurant.supportContact.email"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.supportContact.email"]}
            </p>
          )}
        </div>

        <div>
          <FormInput
            ref={refs.supportPhone}
            label="Support Phone*"
            placeholder="111-532-532"
            value={formData.restaurant.supportContact.phone || ""}
            onChange={(val: string) => {
              updateFormData("restaurant", {
                supportContact: {
                  ...formData.restaurant.supportContact,
                  phone: val,
                },
              });
              clearError("restaurant.supportContact.phone");
            }}
          />
          {errors["restaurant.supportContact.phone"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.supportContact.phone"]}
            </p>
          )}
        </div>

        <div>
          <FormInput
            ref={refs.supportWhatsapp}
            label="Support WhatsApp*"
            placeholder="+923000000000"
            value={formData.restaurant.supportContact.whatsapp || ""}
            onChange={(val: string) => {
              updateFormData("restaurant", {
                supportContact: {
                  ...formData.restaurant.supportContact,
                  whatsapp: val,
                },
              });
              clearError("restaurant.supportContact.whatsapp");
            }}
          />
          {errors["restaurant.supportContact.whatsapp"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.supportContact.whatsapp"]}
            </p>
          )}
        </div>
      </div>

      {/* Branding */}
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        Branding
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <FormInput
            ref={refs.primaryColor}
            label="Primary Color*"
            placeholder="#e4002b"
            value={formData.restaurant.branding.primaryColor || ""}
            onChange={(val: string) => {
              updateFormData("restaurant", {
                branding: {
                  ...formData.restaurant.branding,
                  primaryColor: val,
                },
              });
              clearError("restaurant.branding.primaryColor");
            }}
          />
          {errors["restaurant.branding.primaryColor"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.branding.primaryColor"]}
            </p>
          )}
        </div>

        <div>
          <FormInput
            ref={refs.secondaryColor}
            label="Secondary Color*"
            placeholder="#ffffff"
            value={formData.restaurant.branding.secondaryColor || ""}
            onChange={(val: string) => {
              updateFormData("restaurant", {
                branding: {
                  ...formData.restaurant.branding,
                  secondaryColor: val,
                },
              });
              clearError("restaurant.branding.secondaryColor");
            }}
          />
          {errors["restaurant.branding.secondaryColor"] && (
            <p className="text-red-500 text-xs mt-1">
              {errors["restaurant.branding.secondaryColor"]}
            </p>
          )}
        </div>

        <div>
          <FormSelect
            placeholder="Font Family"
            options={["Poppins", "Inter", "Roboto", "Open Sans"]}
            value={formData.restaurant.branding.fontFamily || "Poppins"}
            onChange={(val: string) =>
              updateFormData("restaurant", {
                branding: {
                  ...formData.restaurant.branding,
                  fontFamily: val,
                },
              })
            }
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-10">
        <Button
          onClick={back}
          className="bg-gray-300 hover:bg-gray-400 px-6 py-2.5 rounded-[10px]"
        >
          Back
        </Button>

        <Button
          onClick={handleNext}
          className="bg-primary hover:bg-red-800 px-6 py-2.5 rounded-[10px]"
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}