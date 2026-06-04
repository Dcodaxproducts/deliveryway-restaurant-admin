import { z } from "zod";

const requiredString = (message: string) => z.string().trim().min(1, message);

const optionalString = (max?: number) => {
  let schema = z.string().trim();

  if (max) {
    schema = schema.max(max);
  }

  return schema.optional().or(z.literal(""));
};

const numberFromInput = ({
  min,
  integer = false,
  defaultValue,
}: {
  min?: number;
  integer?: boolean;
  defaultValue?: number;
} = {}) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return defaultValue;
      }
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
  );

const modifierGroupBaseSchema = z.object({
  restaurantId: requiredString("Restaurant ID is required"),
  name: requiredString("Modifier group name is required"),
  description: optionalString(500),
  minSelect: numberFromInput({
    min: 0,
    integer: true,
    defaultValue: 0,
  }),
  maxSelect: numberFromInput({
    min: 0,
    integer: true,
    defaultValue: 1,
  }),
  sortOrder: numberFromInput({
    min: 0,
    integer: true,
    defaultValue: 0,
  }),
});

export const modifierGroupSchema = modifierGroupBaseSchema.superRefine(
  (value, context) => {
    if (value.maxSelect < value.minSelect) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum selection cannot be less than minimum selection.",
        path: ["maxSelect"],
      });
    }
  }
);

export const updateModifierGroupSchema = modifierGroupBaseSchema
  .omit({ restaurantId: true })
  .extend({
    isActive: z.boolean().optional(),
  })
  .partial()
  .superRefine((value, context) => {
    if (
      typeof value.minSelect === "number" &&
      typeof value.maxSelect === "number" &&
      value.maxSelect < value.minSelect
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum selection cannot be less than minimum selection.",
        path: ["maxSelect"],
      });
    }
  });

export const attachModifierToGroupSchema = z.object({
  modifierId: requiredString("Modifier is required"),
  sortOrder: numberFromInput({
    min: 0,
    integer: true,
    defaultValue: 0,
  }),
});

export type ModifierGroupValues = z.infer<typeof modifierGroupSchema>;
export type UpdateModifierGroupValues = z.infer<
  typeof updateModifierGroupSchema
>;
export type AttachModifierToGroupValues = z.infer<
  typeof attachModifierToGroupSchema
>;
