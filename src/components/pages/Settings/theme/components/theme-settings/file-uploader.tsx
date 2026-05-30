import type { FieldPath, UseFormRegister } from "react-hook-form";
import { Link2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { BrandingFormValues } from "@/validations/branding";

type AssetFieldName = FieldPath<BrandingFormValues>;

type FileUploaderProps = {
  id: string;
  title: string;
  recommendation: string;
  name: AssetFieldName;
  value?: string;
  register: UseFormRegister<BrandingFormValues>;
  error?: string;
};

const labelClassName = "block text-base font-semibold text-dark";
const helperClassName = "text-sm text-gray max-w-[368px]";
const inputClassName = "h-[52px] rounded-[12px] border-gray-200 focus:ring-primary";

const isPreviewablePath = (value?: string) => Boolean(value?.trim());

export default function FileUploader({
  id,
  title,
  recommendation,
  name,
  value,
  register,
  error,
}: FileUploaderProps) {
  const trimmedValue = value?.trim() ?? "";

  return (
    <div className="space-y-3">
      <div className="space-y-[4px]">
        <label htmlFor={id} className={labelClassName}>
          {title}
        </label>
        <p className={helperClassName}>{recommendation}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[96px_1fr] sm:items-center">
        <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-[12px] border border-gray-200 bg-gray-50">
          {isPreviewablePath(trimmedValue) ? (
            <div
              aria-label={`${title} preview`}
              role="img"
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${trimmedValue})` }}
            />
          ) : (
            <Link2 className="text-gray" />
          )}
        </div>
        <div className="space-y-2">
          <Input
            id={id}
            type="url"
            placeholder="/logo.png or https://example.com/logo.png"
            aria-invalid={Boolean(error)}
            className={inputClassName}
            {...register(name)}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
