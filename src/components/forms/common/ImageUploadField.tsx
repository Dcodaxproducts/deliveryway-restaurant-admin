"use client";

import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type {
  FieldPath,
  FieldValues,
  PathValue,
  UseFormSetValue,
} from "react-hook-form";

import { FIELD_ERROR_CLASS, INPUT_BASE_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFileUpload } from "@/hooks/useFileUpload";

type ImageUploadFieldProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>;
  label: string;
  value?: string | null;
  error?: string;
  setValue: UseFormSetValue<TFieldValues>;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  previewAlt?: string;
  disabled?: boolean;
};

const toFieldValue = <TFieldValues extends FieldValues>(
  value: string
): PathValue<TFieldValues, FieldPath<TFieldValues>> => {
  return value as PathValue<TFieldValues, FieldPath<TFieldValues>>;
};

export function ImageUploadField<TFieldValues extends FieldValues>({
  name,
  label,
  value,
  error,
  setValue,
  onValueChange,
  placeholder = "https://cdn.example.com/image.jpg or /uploads/image.jpg",
  helperText = "Upload an image or paste an existing image URL.",
  previewAlt = "Image preview",
  disabled = false,
}: ImageUploadFieldProps<TFieldValues>) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const { uploadFile, uploading } = useFileUpload();
  const currentValue = value?.trim() ?? "";
  const isDisabled = disabled || uploading;
  const previewSrc = localPreviewUrl || currentValue;

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const updateValue = (nextValue: string) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
      setLocalPreviewUrl(null);
    }

    setValue(name, toFieldValue<TFieldValues>(nextValue), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    onValueChange?.(nextValue);
  };

  const openFilePicker = () => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = objectUrl;
      setLocalPreviewUrl(objectUrl);
    }

    const result = await uploadFile(event);
    if (result?.fileUrl) {
      setValue(name, toFieldValue<TFieldValues>(result.fileUrl), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      onValueChange?.(result.fileUrl);
    } else if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
      setLocalPreviewUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId}>{label}</Label>

      {previewSrc ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <Image
            src={previewSrc}
            alt={previewAlt}
            width={640}
            height={160}
            unoptimized
            className="h-40 w-full object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => updateValue("")}
            disabled={isDisabled}
            aria-label={`Clear ${label}`}
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 p-0 text-red-500 shadow hover:bg-white"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <ImagePlus className="mx-auto h-6 w-6 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700">No thumbnail selected</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={inputId}
          type="url"
          value={currentValue}
          placeholder={placeholder}
          disabled={isDisabled}
          onChange={(event) => updateValue(event.target.value)}
          className={INPUT_BASE_CLASS}
        />
        <Button
          type="button"
          variant="outline"
          onClick={openFilePicker}
          disabled={isDisabled}
          className="h-[44px] shrink-0 rounded-lg px-4"
        >
          {uploading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <UploadCloud size={16} className="mr-2" />
          )}
          Upload
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />

      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
      {helperText ? <p className={MUTED_TEXT_SM_CLASS}>{helperText}</p> : null}
    </div>
  );
}
