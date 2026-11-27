import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

/**
 * ==============================
 * Customer App FAQ Schema
 * ==============================
 */

export const faqStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export const faqVisibilityEnum = z.enum(["PUBLIC", "PRIVATE"]);

export const faqSchema = z.object({
  question: z.string().min(3, getLocalizedMessage("validation094")),
  category: z.string().min(1, getLocalizedMessage("validation017")),
  answer: z.string().min(3, getLocalizedMessage("validation003")),
  status: faqStatusEnum,
  visibility: faqVisibilityEnum,
});

export type FaqValues = z.infer<typeof faqSchema>;
export type FaqStatus = z.infer<typeof faqStatusEnum>;
export type FaqVisibility = z.infer<typeof faqVisibilityEnum>;