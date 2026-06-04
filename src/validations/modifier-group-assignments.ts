import { z } from "zod";

const requiredString = (message: string) => z.string().trim().min(1, message);

const numberFromInput = ({
  min,
  integer = true,
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

export const modifierGroupAssignmentSchema = z
  .object({
    groupId: requiredString("Modifier group is required"),
    selectionType: z.enum(["SINGLE", "MULTIPLE"], {
      required_error: "Selection type is required",
    }),
    minSelect: numberFromInput({
      min: 0,
      defaultValue: 0,
    }),
    maxSelect: numberFromInput({
      min: 0,
      defaultValue: 1,
    }),
    sortOrder: numberFromInput({
      min: 0,
      defaultValue: 0,
    }),
  })
  .superRefine((value, context) => {
    if (value.maxSelect < value.minSelect) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum selection cannot be less than minimum selection.",
        path: ["maxSelect"],
      });
    }

    if (value.selectionType === "SINGLE" && value.maxSelect !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Single-select groups must have a maximum selection of 1.",
        path: ["maxSelect"],
      });
    }
  });

export type ModifierGroupAssignmentValues = z.infer<
  typeof modifierGroupAssignmentSchema
>;

export const isRequiredModifierGroupAssignment = ({
  minSelect,
}: {
  minSelect: number;
}) => minSelect > 0;
