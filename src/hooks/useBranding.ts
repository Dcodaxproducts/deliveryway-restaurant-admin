"use client";

import { useContext } from "react";

import { BrandingContext } from "@/components/providers/branding-provider";

export const useBranding = () => {
  const context = useContext(BrandingContext);

  if (!context) {
    throw new Error("useBranding must be used inside BrandingProvider");
  }

  return context;
};
