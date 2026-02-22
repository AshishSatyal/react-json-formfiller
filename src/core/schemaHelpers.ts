// src/core/schemaHelpers.ts

/**
 * Creates a `validate` function from a Zod schema.
 * Requires `zod` to be installed as a peer dependency by the consumer.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { withZodSchema } from "react-json-form-autofill";
 *
 * const schema = z.object({ name: z.string(), age: z.number() });
 *
 * const { processJson } = useJsonAutoFill(setForm, {
 *   validate: withZodSchema(schema),
 * });
 * ```
 */
export function withZodSchema<T>(schema: {
  safeParse: (data: unknown) => { success: boolean };
}): (data: T) => boolean {
  return (data: T) => {
    const result = schema.safeParse(data);
    return result.success;
  };
}

/**
 * Creates a `validate` function from a Yup schema.
 * Requires `yup` to be installed as a peer dependency by the consumer.
 *
 * @example
 * ```ts
 * import * as yup from "yup";
 * import { withYupSchema } from "react-json-form-autofill";
 *
 * const schema = yup.object({ name: yup.string().required(), age: yup.number().required() });
 *
 * const { processJson } = useJsonAutoFill(setForm, {
 *   validate: withYupSchema(schema),
 * });
 * ```
 */
export function withYupSchema<T>(schema: {
  isValidSync: (data: unknown) => boolean;
}): (data: T) => boolean {
  return (data: T) => {
    return schema.isValidSync(data);
  };
}
