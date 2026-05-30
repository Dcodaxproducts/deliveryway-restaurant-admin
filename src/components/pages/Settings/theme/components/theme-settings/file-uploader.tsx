import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { FieldPath, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Link2, Upload, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { BrandingFormValues } from "@/validations/branding";

type AssetFieldName = FieldPath<BrandingFormValues>;

type FileUploaderProps = {
  id: string;
  title: string;
  recommendation: string;
  name: AssetFieldName;
  linkedNames?: AssetFieldName[];
  value?: string;
  register: UseFormRegister<BrandingFormValues>;
  setValue: UseFormSetValue<BrandingFormValues>;
  error?: string;
};

const labelClassName = "block text-base font-semibold text-dark";
const helperClassName = "text-sm text-gray max-w-[368px]";
const inputClassName = "h-[52px] rounded-[12px] border-gray-200 focus:ring-primary";
const actionButtonClassName = "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-3 text-sm font-semibold text-dark transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";

const isPreviewablePath = (value?: string) => Boolean(value?.trim());

export default function FileUploader({
  id,
  title,
  recommendation,
  name,
  linkedNames = [],
  value,
  register,
  setValue,
  error,
}: FileUploaderProps) {
  const { uploadFile, uploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const trimmedValue = value?.trim() ?? "";
  const previewValue = localPreviewUrl ?? trimmedValue;
  const fileInputId = `${id}-file`;
  const allTargetNames = [name, ...linkedNames];

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!trimmedValue && localPreviewUrl) {
      setLocalPreviewUrl(null);
    }
  }, [localPreviewUrl, trimmedValue]);

  const revokeLocalPreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    setLocalPreviewUrl(null);
  };

  const updateAssetFields = (nextValue: string) => {
    for (const targetName of allTargetNames) {
      setValue(targetName, nextValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    revokeLocalPreview();

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = objectUrl;
      setLocalPreviewUrl(objectUrl);
    }

    const result = await uploadFile(event);
    event.target.value = "";

    if (!result?.fileUrl) {
      return;
    }

    updateAssetFields(result.fileUrl);
    revokeLocalPreview();
  };

  const handleClear = () => {
    revokeLocalPreview();
    updateAssetFields("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

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
          {isPreviewablePath(previewValue) ? (
            <div
              aria-label={`${title} preview`}
              role="img"
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${previewValue})` }}
            />
          ) : (
            <Link2 className="text-gray" />
          )}
        </div>
        <div className="space-y-2">
          <Input
            id={id}
            type="url"
            placeholder="https://example.com/brand-image.png"
            aria-invalid={Boolean(error)}
            className={inputClassName}
            {...register(name)}
          />
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="image/*,.ico"
            className="sr-only"
            onChange={handleUpload}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-label={`Upload ${title}`}
              className={actionButtonClassName}
              disabled={uploading}
              onClick={handleUploadButtonClick}
            >
              <Upload size={16} aria-hidden="true" />
              {uploading ? "Uploading..." : `Upload ${title}`}
            </button>
            <button
              type="button"
              aria-label={`Clear ${title}`}
              className={actionButtonClassName}
              disabled={uploading || !previewValue}
              onClick={handleClear}
            >
              <X size={16} aria-hidden="true" />
              Clear
            </button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
