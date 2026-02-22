// src/core/processJsonData.ts

import { JsonAutoFillError, JsonAutoFillOptions } from "../types";
import { parseJson } from "./parseJson";
import { flattenObject } from "./flattenObject";
import { applyMapping } from "./applyMapping";

/**
 * Shared pipeline: parse → flatten → map → transform → validate → lifecycle.
 * Used by all adapter hooks (useState, React Hook Form, Formik).
 *
 * Returns the processed data ready to be applied, or throws on failure.
 */
export async function processJsonData<T extends Record<string, unknown>>(
  jsonInput: string | Record<string, unknown>,
  options?: Pick<
    JsonAutoFillOptions<T>,
    "flatten" | "fieldMap" | "transform" | "validate" | "onBeforeFill"
  >,
): Promise<{ data: T; cancelled: boolean }> {
  // 1. Parse
  const parsed =
    typeof jsonInput === "string" ? parseJson(jsonInput) : jsonInput;

  // 2. Optionally flatten (default: true)
  const shouldFlatten = options?.flatten !== false;
  const processed = shouldFlatten
    ? flattenObject(parsed as Record<string, unknown>)
    : (parsed as Record<string, unknown>);

  // 3. Apply field mapping
  const mapped = applyMapping(processed, options?.fieldMap);

  // 4. Transform
  const transformed = options?.transform
    ? await options.transform(mapped)
    : (mapped as T);

  // 5. Validate
  if (options?.validate) {
    const isValid = await options.validate(transformed as T);
    if (!isValid) {
      throw new JsonAutoFillError("Validation failed", "VALIDATION_ERROR");
    }
  }

  // 6. onBeforeFill lifecycle — return false to cancel
  if (options?.onBeforeFill) {
    const shouldProceed = await options.onBeforeFill(transformed as T);
    if (shouldProceed === false) {
      return { data: transformed as T, cancelled: true };
    }
  }

  return { data: transformed as T, cancelled: false };
}
