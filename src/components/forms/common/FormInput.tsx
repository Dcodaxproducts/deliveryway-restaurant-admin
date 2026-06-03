"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "type" | "onBlur" | "placeholder" | "required"
  > {
  label: string;
  placeholder?: string;
  value?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  onChange?: (val: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  showPasswordToggle?: boolean;
  id?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      placeholder,
      value,
      type = "text",
      onChange,
      onBlur,
      required,
      error,
      errorText,
      showPasswordToggle,
      className = "",
      id,
      ...inputProps
    },
    ref
  ) => {
    const t = useTranslations("auth");
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [showPassword, setShowPassword] = useState(false);

    const inputType =
      showPasswordToggle && type === "password"
        ? showPassword
          ? "text"
          : "password"
        : type;

    return (
      <div>
        <Label htmlFor={inputId} className="mb-2 text-[16px]">
          {label}
          {required && <span className="text-primary"> *</span>}
        </Label>

        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            onChange={({ target: { value: nextValue } }) => onChange?.(nextValue)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            className={`
              border-[#BBBBBB]
              placeholder-[#BBBBBB]
              focus:border-primary
              focus:ring-1
              focus:ring-primary
              ${showPasswordToggle && type === "password" ? "pr-10" : ""}
              ${error ? "border-primary bg-primary/5" : ""}
              ${className}
            `}
            {...inputProps}
          />

          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && errorText && <p className="mt-1 text-xs text-primary">{errorText}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
