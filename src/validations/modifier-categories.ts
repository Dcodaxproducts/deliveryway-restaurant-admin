import { z } from "zod";

const requiredString = (message: string) => z.string().trim().min(1, message);

const optionalString = (max?: number) => {
  let schema = z.string().trim();

  if (max) {
    schema = schema.max(max);
  }

  return schema.optional().or(z.literal(""));
};

const optionalNumberFromInput = ({
  min,
  integer = false,
}: {
  min?: number;
  integer?: boolean;
} = {}) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      if (typeof value === "string") return Number(value);
      return value;
    },
    z
      .number({ invalid_type_error: "Must be a number" })
      .refine((value) => !Number.isNaN(value), "Must be a valid number")
      .superRefine((value, context) => {
        if (integer && !Number.isInteger(value)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be an integer",
          });
        }

        if (min !== undefined && value < min) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Must be at least ${min}`,
          });
        }
      })
      .optional()
  );

export const modifierCategorySchema = z.object({
  restaurantId: requiredString("Restaurant ID is required"),
  name: requiredString("Category name is required"),
  slug: optionalString(150),
  description: optionalString(500),
  sortOrder: optionalNumberFromInput({ min: 0, integer: true }).default(0),
  isActive: z.boolean().optional(),
});

export const updateModifierCategorySchema = modifierCategorySchema
  .omit({ restaurantId: true })
  .partial();

export type ModifierCategoryValues = z.infer<typeof modifierCategorySchema>;
export type UpdateModifierCategoryValues = z.infer<
  typeof updateModifierCategorySchema
>;
