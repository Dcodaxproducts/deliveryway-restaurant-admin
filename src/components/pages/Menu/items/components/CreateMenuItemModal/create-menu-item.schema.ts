import { z } from "zod";
import { validationMessages } from "@/lib/validation";

export const createMenuItemSchema = z.object({
  name: z.string().min(1, validationMessages.required),
  description: z.string().optional(),
  basePrice: z.coerce.number().nonnegative(),
  categoryIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type CreateMenuItemFormValues = z.infer<typeof createMenuItemSchema>;
