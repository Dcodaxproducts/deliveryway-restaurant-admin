"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import FormInput from "./FormInput";
import { Upload } from "lucide-react";
import { validateSchema } from "@/lib/zod-errors";
import { userSchema } from "@/validations/register";

interface Props {
  formData: any;
  updateFormData: (section: string, data: any) => void;
  next: () => void;
}

export default function UserInfoStep({ formData, updateFormData, next }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---------------- INPUT REFS (AUTO FOCUS) ---------------- */

  const inputRefs = {
    firstName: useRef<HTMLInputElement>(null),
    lastName: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  /* ---------------- CLEAR ERROR WHILE TYPING ---------------- */

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  /* ---------------- VALIDATE SINGLE FIELD (BLUR) ---------------- */

  const validateField = (field: string) => {
    const result = validateSchema(userSchema, formData.user);

    if (!result.success) {
      setErrors((prev) => ({
        ...prev,
        [field]: result.errors[field] || "",
      }));
    }
  };

  /* ---------------- FILE CHANGE ---------------- */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      updateFormData("user", { profileUrl: file });

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.profileUrl;
        return newErrors;
      });
    }
  };

  /* ---------------- VALIDATION (NEXT STEP) ---------------- */

  const handleNext = () => {
    const { success, errors } = validateSchema(userSchema, formData.user);

    if (!success) {
      setErrors(errors);

      const firstErrorField = Object.keys(errors)[0];

      if (
        firstErrorField &&
        inputRefs[firstErrorField as keyof typeof inputRefs]
      ) {
        inputRefs[
          firstErrorField as keyof typeof inputRefs
        ].current?.focus();
      }

      return;
    }

    setErrors({});
    next();
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8">
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">
        User Info
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* FIRST NAME */}
        <div>
          <FormInput
            ref={inputRefs.firstName}
            label="First Name*"
            placeholder="Ahmed"
            value={formData.user.firstName || ""}
            onChange={(val: string) => {
              updateFormData("user", { firstName: val });
              clearError("firstName");
            }}
            onBlur={() => validateField("firstName")}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        {/* LAST NAME */}
        <div>
          <FormInput
            ref={inputRefs.lastName}
            label="Last Name*"
            placeholder="Ali"
            value={formData.user.lastName || ""}
            onChange={(val: string) => {
              updateFormData("user", { lastName: val });
              clearError("lastName");
            }}
            onBlur={() => validateField("lastName")}
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <FormInput
            ref={inputRefs.email}
            label="Email*"
            placeholder="owner@indusfoods.com"
            value={formData.user.email || ""}
            onChange={(val: string) => {
              updateFormData("user", { email: val });
              clearError("email");
            }}
            onBlur={() => validateField("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* PHONE */}
        <div>
          <FormInput
            ref={inputRefs.phone}
            label="Phone Number*"
            placeholder="+923001234567"
            value={formData.user.phone || ""}
            onChange={(val: string) => {
              updateFormData("user", { phone: val });
              clearError("phone");
            }}
            onBlur={() => validateField("phone")}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <FormInput
            ref={inputRefs.password}
            label="Password*"
            placeholder="StrongPassword123!"
            value={formData.user.password || ""}
            onChange={(val: string) => {
              updateFormData("user", { password: val });
              clearError("password");
            }}
            onBlur={() => validateField("password")}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {/* FILE UPLOAD */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Profile Photo*</label>

          <label className="flex items-center gap-4 cursor-pointer rounded-lg pt-1 hover:bg-gray-50 transition">
            <div className="w-12 h-12 border border-[#909090] rounded-lg flex items-center justify-center">
              <Upload className="text-[#909090]" />
            </div>

            <div>
              <p className="text-sm font-medium">
                {formData.user.profileUrl?.name || "Choose File"}
              </p>
              <p className="text-xs text-[#909090]">
                PNG, JPG, JPEG upto 2MB
              </p>
            </div>

            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {errors.profileUrl && (
            <p className="text-red-500 text-xs">{errors.profileUrl}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8">
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