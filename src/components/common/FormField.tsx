import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FormFieldProps = {
  id: string;
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode | ((controlProps: FormFieldControlProps) => ReactNode);
  className?: string;
  labelAction?: ReactNode;
};

export type FormFieldControlProps = {
  id: string;
  required: boolean;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
};

export function FormField({
  id,
  label,
  help,
  error,
  required = false,
  children,
  className,
  labelAction,
}: FormFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const controlProps: FormFieldControlProps = {
    id,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": getFormFieldDescriptionId(id, {
      hasHelp: Boolean(help),
      hasError: Boolean(error),
    }),
  };

  return (
    <div data-slot="form-field" className={cn("space-y-2", className)}>
      {label || labelAction ? (
        <div className="flex min-w-0 items-start justify-between gap-3">
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
          {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
        </div>
      ) : null}
      {typeof children === "function" ? children(controlProps) : children}
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
