"use client";
import { FormSection } from "@/components/common/FormLayout";

interface SectionProps {
  label?: string;
  children?: React.ReactNode;

  className?: string;
  contentClassName?: string;
  labelClassName?: string;

  padded?: boolean;
  withMargin?: boolean; // ⭐ NEW
}

export default function Section({
  label,
  children,
  className,
  contentClassName,
  labelClassName,
  padded = true,
  withMargin = false, // ⭐ default adds spacing between sections
}: SectionProps) {
  return (
    <FormSection
      title={label}
      padding={padded ? "lg" : "none"}
      className={`${withMargin ? "mb-5" : ""} ${className || ""}`}
      fieldsClassName={contentClassName}
    >
      <div className={`space-y-6 ${labelClassName || ""}`}>
        {children}
      </div>
    </FormSection>
  );
}
