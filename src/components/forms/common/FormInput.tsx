"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  FormField,
  getFormFieldDescriptionId,
} from "@/components/common/FormField";

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
    const describedBy = getFormFieldDescriptionId(inputId, {
      hasError: Boolean(error && errorText),
    });

    return (
      <FormField
        id={inputId}
        label={label}
        required={required}
        error={error ? errorText : undefined}
      >
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
            aria-invalid={error || undefined}
            aria-describedby={describedBy}
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
              className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </FormField>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
