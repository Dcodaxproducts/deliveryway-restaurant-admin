import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FormFieldProps = {
  id: string;
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  help,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div data-slot="form-field" className={cn("space-y-2", className)}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium text-[var(--ui-text)]">
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-[var(--ui-danger)]">
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {help && !error ? (
        <p id={helpId} className="text-xs leading-5 text-[var(--ui-text-subtle)]">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs leading-5 text-[var(--ui-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function getFormFieldDescriptionId(
  id: string,
  options: { hasHelp?: boolean; hasError?: boolean },
) {
  if (options.hasError) return `${id}-error`;
  if (options.hasHelp) return `${id}-help`;
  return undefined;
}
