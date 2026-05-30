"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { useBranding } from "@/hooks/useBranding";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showName?: boolean;
  priority?: boolean;
};

const FALLBACK_LOGO = "/logo.png";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "DW";

export default function BrandLogo({
  className,
  imageClassName,
  textClassName,
  showName = true,
  priority = false,
}: BrandLogoProps) {
  const { restaurant } = useBranding();
  const { resolvedTheme, theme } = useTheme();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentTheme = resolvedTheme ?? theme;

  const logoSrc = useMemo(() => {
    const themedLogo = currentTheme === "dark" ? restaurant.branding.logo.dark : restaurant.branding.logo.light;
    return themedLogo || restaurant.logoUrl || FALLBACK_LOGO;
  }, [currentTheme, restaurant.branding.logo.dark, restaurant.branding.logo.light, restaurant.logoUrl]);

  useEffect(() => {
    setFailedSrc(null);
  }, [logoSrc]);

  const showFallback = failedSrc === logoSrc;
  const restaurantName = restaurant.name || "Deliveryway";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--brand-radius)] bg-primary/10 text-sm font-bold text-primary",
          imageClassName
        )}
      >
        {showFallback ? (
          <span>{getInitials(restaurantName)}</span>
        ) : (
          <Image
            src={logoSrc}
            alt={`${restaurantName} logo`}
            fill
            sizes="44px"
            priority={priority}
            className="object-contain p-1"
            onError={() => setFailedSrc(logoSrc)}
          />
        )}
      </div>
      {showName ? (
        <span className={cn("truncate text-sm font-semibold text-foreground", textClassName)}>
          {restaurantName}
        </span>
      ) : null}
    </div>
  );
}
