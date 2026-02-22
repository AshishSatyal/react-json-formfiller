// src/hooks/useJsonAutoFillFormik.ts

import { useCallback, useRef } from "react";
import { JsonAutoFillError, FormikAutoFillOptions } from "../types";
import { processJsonData } from "../core/processJsonData";
import { mergeData } from "../core/mergeStrategies";

/**
 * Formik adapter for auto-filling forms from JSON.
 *
 * Works with Formik's `setValues`, `setFieldValue`, and `values`.
 * Uses `setValues` for replace and `setFieldValue` for per-field strategies.
 *
 * @param formikBag - An object with `setValues`, `setFieldValue`, and `values` from `useFormik()`.
 * @param options - Configuration for field mapping, validation, merge strategy, etc.
 * @returns `{ processJson, resetForm }`
 *
 * @example
 * ```tsx
 * import { useFormik } from "formik";
 * import { useJsonAutoFillFormik, JsonFileUploader } from "react-json-form-autofill";
 *
 * function MyForm() {
 *   const formik = useFormik({
 *     initialValues: { name: "", email: "" },
 *     onSubmit: (values) => console.log(values),
 *   });
 *
 *   const { processJson } = useJsonAutoFillFormik(
 *     {
 *       setValues: formik.setValues,
 *       setFieldValue: formik.setFieldValue,
 *       values: formik.values,
 *       resetForm: formik.resetForm,
 *     },
 *     { mergeStrategy: "strict" },
 *   );
 *
 *   return (
 *     <form onSubmit={formik.handleSubmit}>
 *       <JsonFileUploader onJsonLoaded={processJson} />
 *       <input name="name" value={formik.values.name} onChange={formik.handleChange} />
 *       <input name="email" value={formik.values.email} onChange={formik.handleChange} />
 *     </form>
 *   );
 * }
 * ```
 */
export function useJsonAutoFillFormik<T extends Record<string, unknown>>(
  formikBag: {
    setValues: (values: T, shouldValidate?: boolean) => void;
    setFieldValue: (
      field: string,
      value: unknown,
      shouldValidate?: boolean,
    ) => void;
    values: T;
    resetForm: (nextState?: { values?: T }) => void;
  },
  options?: FormikAutoFillOptions<T>,
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
        const shouldValidate = opts?.shouldValidate ?? true;

        if (strategy === "replace") {
          formikBag.setValues(data as T, shouldValidate);
        } else if (strategy === "strict") {
          // Only set fields that already exist in formik values
          for (const key of Object.keys(data)) {
            if (key in formikBag.values) {
              formikBag.setFieldValue(key, data[key], shouldValidate);
            }
          }
        } else {
          // "merge" or "deep"
          const merged = mergeData(
            formikBag.values,
            data as Partial<T>,
            strategy,
          );
          formikBag.setValues(merged, shouldValidate);
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
    [formikBag],
  );

  const resetForm = useCallback(
    (values?: T) => {
      formikBag.resetForm(values ? { values } : undefined);
    },
    [formikBag],
  );

  return { processJson, resetForm };
}
