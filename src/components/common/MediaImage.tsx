"use client";

import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type MediaImageProps = Omit<ImageProps, "src"> & {
  src?: ImageProps["src"] | null;
  fallbackLabel?: string;
};

export function MediaImage({
  src,
  alt,
  className,
  fallbackLabel,
  priority = false,
  ...props
}: MediaImageProps) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const normalizedSrc = typeof src === "string" ? src.trim() : src;

  useEffect(() => {
    setFailed(false);
    setLoading(true);
  }, [src]);

  if (!normalizedSrc || failed) {
    return (
      <span
        role="img"
        aria-label={fallbackLabel || alt}
        className={cn(
          "absolute inset-0 flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_10%,white),#f4f4f5)] text-gray-400",
          className,
        )}
      >
        <ImageOff className="size-1/4 min-h-4 min-w-4 max-h-10 max-w-10" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Image
      {...props}
      src={normalizedSrc}
      alt={alt}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoading(false)}
      onError={() => {
        setFailed(true);
        setLoading(false);
      }}
      className={cn(
        "bg-gray-100 transition-opacity duration-300",
        loading && "animate-pulse opacity-60 motion-reduce:animate-none",
        !loading && "opacity-100",
        className,
      )}
    />
  );
}
