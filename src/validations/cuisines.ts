import { z } from "zod";
import type {
  CuisineBulkCreatePayload,
  CuisineCreatePayload,
  CuisineUpdatePayload,
} from "@/types/cuisines";

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

export const cuisineSchema = z.object({
  restaurantId: requiredString("Restaurant ID is required"),
  name: requiredString("Cuisine name is required"),
  slug: requiredString("Cuisine slug is required").max(150),
  description: optionalString(500),
  imageUrl: optionalString(),
  sortOrder: optionalNumberFromInput({ min: 0, integer: true }).default(0),
  isActive: z.boolean().optional(),
});

export const updateCuisineSchema = cuisineSchema
  .omit({ restaurantId: true })
  .partial();

export const bulkCuisineSchema = z.object({
  restaurantId: requiredString("Restaurant ID is required").optional(),
  items: z
    .array(
      cuisineSchema.omit({ restaurantId: true, description: true, imageUrl: true })
    )
    .min(1, "At least one cuisine is required"),
});

export type CuisineValues = z.infer<typeof cuisineSchema>;
export type UpdateCuisineValues = z.infer<typeof updateCuisineSchema>;
export type BulkCuisineValues = z.infer<typeof bulkCuisineSchema>;

export const buildCuisineCreatePayload = (
  values: CuisineValues
): CuisineCreatePayload => ({
  restaurantId: values.restaurantId.trim(),
  name: values.name.trim(),
  slug: values.slug.trim(),
  ...(values.description?.trim()
    ? { description: values.description.trim() }
    : {}),
  ...(values.imageUrl?.trim() ? { imageUrl: values.imageUrl.trim() } : {}),
  ...(typeof values.sortOrder === "number" ? { sortOrder: values.sortOrder } : {}),
  ...(typeof values.isActive === "boolean" ? { isActive: values.isActive } : {}),
});

export const buildCuisineUpdatePayload = (
  values: UpdateCuisineValues
): CuisineUpdatePayload => ({
  ...(values.name?.trim() ? { name: values.name.trim() } : {}),
  ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
  ...(values.description?.trim()
    ? { description: values.description.trim() }
    : values.description === ""
    ? { description: "" }
    : {}),
  ...(values.imageUrl?.trim()
    ? { imageUrl: values.imageUrl.trim() }
    : values.imageUrl === ""
    ? { imageUrl: "" }
    : {}),
  ...(typeof values.sortOrder === "number" ? { sortOrder: values.sortOrder } : {}),
  ...(typeof values.isActive === "boolean" ? { isActive: values.isActive } : {}),
});

export const buildCuisineBulkCreatePayload = (
  values: BulkCuisineValues
): CuisineBulkCreatePayload => ({
  ...(values.restaurantId?.trim() ? { restaurantId: values.restaurantId.trim() } : {}),
  items: values.items.map((item) => ({
    name: item.name.trim(),
    slug: item.slug.trim(),
    ...(typeof item.sortOrder === "number" ? { sortOrder: item.sortOrder } : {}),
    ...(typeof item.isActive === "boolean" ? { isActive: item.isActive } : {}),
  })),
});
