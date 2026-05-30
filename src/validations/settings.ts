import { z } from "zod";

export const settingsSchema = z.object({
  globalTaxPercentage: z.string(),
  taxHandlingRule: z.string(),
  defaultCommissionPercentage: z.string(),
  defaultHybridFeePercentage: z.string(),
  defaultPlatformCurrency: z.string(),
  currencyFormat: z.string(),
  defaultPlatformLanguage: z.string(),
  dateFormat: z.string(),
  timezone: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  fontSelection: z.string(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
