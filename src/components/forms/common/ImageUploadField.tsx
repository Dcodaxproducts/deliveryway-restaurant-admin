"use client";

import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import type {
  FieldPath,
  FieldValues,
  PathValue,
  UseFormSetValue,
} from "react-hook-form";
import { toast } from "sonner";

import {
  FIELD_ERROR_CLASS,
  INPUT_BASE_CLASS,
  MUTED_TEXT_SM_CLASS,
} from "@/components/common/common-classes";
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
  const [isDragging, setIsDragging] = useState(false);
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

  const uploadSelectedFile = async (file?: File) => {
    if (!file || isDisabled) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setLocalPreviewUrl(objectUrl);

    const syntheticEvent = {
      target: {
        files: [file],
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    const result = await uploadFile(syntheticEvent);
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadSelectedFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDisabled) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await uploadSelectedFile(event.dataTransfer.files?.[0]);
  };

  const dropzoneClassName = `group relative overflow-hidden rounded-xl border border-dashed bg-white transition-all duration-200 ${
    isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
  } ${
    isDragging
      ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(232,62,73,0.10)]"
      : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
  }`;

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId}>{label}</Label>

      <div
        onClick={openFilePicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={dropzoneClassName}
      >
        {previewSrc ? (
          <div className="relative">
            <Image
              src={previewSrc}
              alt={previewAlt}
              width={640}
              height={160}
              unoptimized
              className="h-44 w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 py-3">
              <div className="pr-12">
                <p className="text-sm font-semibold text-white">Image uploaded</p>
                <p className="text-xs text-white/80">
                  Drop another image here to replace it.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                updateValue("");
              }}
              disabled={isDisabled}
              aria-label={`Clear ${label}`}
              className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 p-0 text-red-500 shadow hover:bg-white"
            >
              <Trash2 size={15} />
            </Button>
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center px-5 py-7 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-sm">
              {uploading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : isDragging ? (
                <UploadCloud size={24} />
              ) : (
                <ImagePlus size={24} />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-900">Drag & drop image here</p>
            <p className="mt-1 text-xs text-gray-500">
              or <span className="font-medium text-primary">click to browse</span>
            </p>
            <p className="mt-1 text-[11px] text-gray-400">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>

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
