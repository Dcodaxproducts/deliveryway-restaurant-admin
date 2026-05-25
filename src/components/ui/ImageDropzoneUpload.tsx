"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFileUpload } from "@/hooks/useFileUpload";

type ImageDropzoneUploadProps = {
  label?: string;
  value?: string | null;
  onChange: (fileUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  previewAlt?: string;
  previewUrl?: string | null;
onPreviewChange?: (previewUrl: string) => void;
  emptyTitle?: string;
  browseText?: string;
  helperText?: string;
  uploadedTitle?: string;
  replaceHint?: string;
  uploadingText?: string;
  maxSizeMB?: number;
  previewHeightClassName?: string;
  className?: string;
  clearKey?: React.Key;
};

const revokeBlobUrl = (url?: string | null) => {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

export default function ImageDropzoneUpload({
  label = "Image",
  value,
  onClear,
   previewUrl,
  onChange,
  onPreviewChange,
  disabled = false,
  onUploadingChange,
  previewAlt = "Image preview",
  emptyTitle = "Drag & drop your image here",
  browseText = "click to browse",
  helperText = "PNG, JPG, WEBP up to 10MB",
  uploadedTitle = "Image uploaded",
  replaceHint = "Drag & drop another image to replace it",
  uploadingText = "Uploading image...",
  maxSizeMB = 10,
  previewHeightClassName = "h-52",
  className = "",
  clearKey,
}: ImageDropzoneUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousValueRef = useRef<string | null | undefined>(value);

  const { uploadFile, uploading } = useFileUpload();


  const isPreviewControlled = typeof onPreviewChange === "function";
const isDisabled = disabled || uploading;
const previewSrc = previewUrl || localPreview || value || "";

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);
useEffect(() => {
  return () => {
    if (!isPreviewControlled) {
      revokeBlobUrl(localPreview);
    }
  };
}, [localPreview, isPreviewControlled]);

 useEffect(() => {
  if (!value && previousValueRef.current && localPreview) {
    if (!isPreviewControlled) {
      revokeBlobUrl(localPreview);
    }

    setLocalPreview(null);
  }

  previousValueRef.current = value;
}, [value, localPreview, isPreviewControlled]);

useEffect(() => {
  if (!clearKey) return;

  if (!isPreviewControlled) {
    revokeBlobUrl(localPreview);
  }

  setLocalPreview(null);
  onPreviewChange?.("");

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [clearKey]);
  const openFilePicker = () => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  };

  const processImageFile = async (file?: File) => {
  if (!file || isDisabled) return;

  if (!file.type.startsWith("image/")) {
    toast.error("Please upload a valid image file");
    return;
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    toast.error(`Image size must be less than ${maxSizeMB}MB`);
    return;
  }

  const objectUrl = URL.createObjectURL(file);

  if (isPreviewControlled) {
    onPreviewChange?.(objectUrl);
  } else {
    revokeBlobUrl(localPreview);
    setLocalPreview(objectUrl);
  }

  const syntheticEvent = {
    target: {
      files: [file],
    },
  } as unknown as React.ChangeEvent<HTMLInputElement>;

  try {
    const result = await uploadFile(syntheticEvent);

    if (result?.fileUrl) {
      onChange(result.fileUrl);

      if (!isPreviewControlled) {
        setLocalPreview(null);
      }
    } else {
      if (isPreviewControlled) {
        onPreviewChange?.("");
      } else {
        revokeBlobUrl(objectUrl);
        setLocalPreview(null);
      }

      toast.error("Image upload failed");
    }
  } catch {
    if (isPreviewControlled) {
      onPreviewChange?.("");
    } else {
      revokeBlobUrl(objectUrl);
      setLocalPreview(null);
    }

    toast.error("Image upload failed");
  } finally {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processImageFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!isDisabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (isDisabled) return;

    await processImageFile(e.dataTransfer.files?.[0]);
  };

  const handleClear = () => {
  if (isDisabled) return;

  if (!isPreviewControlled) {
    revokeBlobUrl(localPreview);
  }

  setLocalPreview(null);
  onPreviewChange?.("");

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }

  if (onClear) {
    onClear();
    return;
  }

  onChange("");
};

  return (
    <div className={`space-y-3 ${className}`}>
      {label ? <Label>{label}</Label> : null}

      {previewSrc ? (
        <div className="relative overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm">
          <img
            src={previewSrc}
            alt={previewAlt}
            className={`${previewHeightClassName} w-full object-cover`}
          />

          <div
            onClick={openFilePicker}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`absolute inset-0 z-10 transition ${
              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
            } ${
              isDragging ? "bg-primary/10 ring-2 ring-primary ring-inset" : ""
            }`}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/65 via-black/20 to-transparent px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{uploadedTitle}</p>
              <p className="text-xs text-white/80">{replaceHint}</p>
            </div>

            <button
              type="button"
              onClick={handleClear}
              disabled={isDisabled}
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={14} />
            </button>
          </div>

          {uploading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative overflow-hidden rounded-[18px] border border-dashed bg-white px-6 py-8 text-center transition-all duration-200 ${
            isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          } ${
            isDragging
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9FAFB] text-primary shadow-sm">
            {uploading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : isDragging ? (
              <UploadCloud size={24} />
            ) : (
              <ImagePlus size={24} />
            )}
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-sm font-semibold text-gray-900">{emptyTitle}</p>

            <p className="text-xs text-gray-500">
              or{" "}
              <span className="font-medium text-primary">{browseText}</span>
            </p>

            <p className="text-[11px] text-gray-400">{helperText}</p>
          </div>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isDisabled}
        className="hidden"
      />

      {uploading && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Loader2 className="animate-spin" size={12} />
          {uploadingText}
        </p>
      )}
    </div>
  );
}