import type { z } from "zod";

export type SchemaValidationResult<T> =
  | { success: true; data: T; errors: Record<string, string> }
  | { success: false; data?: never; errors: Record<string, string> };

export const mapZodIssues = (issues: z.ZodIssue[], prefix?: string) =>
  issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path.join(".");
    const key = [prefix, field].filter(Boolean).join(".");

    if (key && !acc[key]) {
      acc[key] = issue.message;
    }

    return acc;
  }, {});

export const parseSchema = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  prefix?: string
): SchemaValidationResult<z.infer<TSchema>> => {
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  return { success: false, errors: mapZodIssues(result.error.issues, prefix) };
};

export const validateSchema = parseSchema;
