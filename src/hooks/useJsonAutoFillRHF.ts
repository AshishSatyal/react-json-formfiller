// src/hooks/useJsonAutoFillRHF.ts

import { useCallback, useRef } from "react";
import { JsonAutoFillError, RHFAutoFillOptions } from "../types";
import { processJsonData } from "../core/processJsonData";

/**
 * React Hook Form adapter for auto-filling forms from JSON.
 *
 * Works with `react-hook-form`'s `UseFormReturn` — uses `setValue` or `reset`
 * to set individual fields, which triggers RHF validation and dirty tracking.
 *
 * @param formMethods - An object with `setValue`, `reset`, and `getValues` from `useForm()`.
 * @param options - Configuration for field mapping, validation, merge strategy, etc.
 * @returns `{ processJson, resetForm }`
 *
 * @example
 * ```tsx
 * import { useForm } from "react-hook-form";
 * import { useJsonAutoFillRHF, JsonFileUploader } from "react-json-form-autofill";
 *
 * function MyForm() {
 *   const form = useForm({ defaultValues: { name: "", email: "" } });
 *   const { processJson } = useJsonAutoFillRHF(
 *     { setValue: form.setValue, reset: form.reset, getValues: form.getValues },
 *     { mergeStrategy: "strict", fieldMap: { full_name: "name" } },
 *   );
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <JsonFileUploader onJsonLoaded={processJson} />
 *       <input {...form.register("name")} />
 *       <input {...form.register("email")} />
 *     </form>
 *   );
 * }
 * ```
 */
export function useJsonAutoFillRHF<T extends Record<string, unknown>>(
  formMethods: {
    setValue: (
      name: string,
      value: unknown,
      options?: Record<string, unknown>,
    ) => void;
    reset: (values?: T, options?: Record<string, unknown>) => void;
    getValues: () => T;
  },
  options?: RHFAutoFillOptions<T>,
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const processJson = useCallback(
    async (jsonInput: string | Record<string, unknown>): Promise<boolean> => {
      const opts = optionsRef.current;

      try {
        const { data, cancelled } = await processJsonData(jsonInput, opts);
        if (cancelled) return false;

        const strategy = opts?.mergeStrategy ?? "merge";
        const setValueOptions = opts?.setValueOptions ?? {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        };

        if (strategy === "replace") {
          // Full replacement — use RHF's reset for clean state
          formMethods.reset(data as T, opts?.resetOptions);
        } else {
          // For merge/strict/deep — set individual fields
          const currentValues = formMethods.getValues();
          const fieldsToSet = getFieldsToSet(currentValues, data, strategy);

          for (const [key, value] of Object.entries(fieldsToSet)) {
            formMethods.setValue(key, value, setValueOptions);
          }
        }

        opts?.onAfterFill?.(data as T);
        opts?.onSuccess?.(data as T);
        return true;
      } catch (error: unknown) {
        const autoFillError =
          error instanceof JsonAutoFillError
            ? error
            : new JsonAutoFillError(
                error instanceof Error ? error.message : "Unknown error",
                "PARSE_ERROR",
              );
        opts?.onError?.(autoFillError);
        return false;
      }
    },
    [formMethods],
  );

  const resetForm = useCallback(
    (values?: T) => {
      formMethods.reset(values, optionsRef.current?.resetOptions);
    },
    [formMethods],
  );

  return { processJson, resetForm };
}

/**
 * Determines which fields to set based on the merge strategy.
 */
function getFieldsToSet(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
  strategy: string,
): Record<string, unknown> {
  if (strategy === "strict") {
    // Only fields that exist in current form values
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(incoming)) {
      if (key in current) {
        result[key] = incoming[key];
      }
    }
    return result;
  }

  // "merge" and "deep" — set all incoming fields
  return incoming;
}
