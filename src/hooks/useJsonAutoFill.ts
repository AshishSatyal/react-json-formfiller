// src/hooks/useJsonAutoFill.ts

import { useCallback, useRef } from "react";
import { JsonAutoFillError, JsonAutoFillOptions } from "../types";
import { mergeData } from "../core/mergeStrategies";
import { processJsonData } from "../core/processJsonData";

/**
 * React hook for auto-filling form state from a JSON string or object.
 *
 * @param setFormData - State setter (e.g., from useState). Supports function updater form.
 * @param options - Configuration for merge strategy, field mapping, validation, etc.
 * @param initialData - Optional initial form data (enables the `reset` function).
 * @returns `{ processJson, reset }` — call `processJson` with a JSON string or object.
 *
 * @example
 * ```tsx
 * const initial = { name: "", email: "" };
 * const [form, setForm] = useState(initial);
 * const { processJson, reset } = useJsonAutoFill(setForm, {
 *   mergeStrategy: "strict",
 *   fieldMap: { full_name: "name" },
 *   transform: (data) => ({ ...data, name: String(data.name).trim() }),
 * }, initial);
 * ```
 */
export function useJsonAutoFill<T extends Record<string, unknown>>(
  setFormData: (data: T | ((prev: T) => T)) => void,
  options?: JsonAutoFillOptions<T>,
  initialData?: T,
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  const processJson = useCallback(
    async (jsonInput: string | Record<string, unknown>): Promise<boolean> => {
      const opts = optionsRef.current;

      try {
        const { data, cancelled } = await processJsonData(jsonInput, opts);
        if (cancelled) return false;

        // Merge using configured strategy
        const strategy = opts?.mergeStrategy ?? "merge";
        setFormData((prev) => mergeData(prev, data as Partial<T>, strategy));

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
    [setFormData],
  );

  const reset = useCallback((): boolean => {
    const data = initialDataRef.current;
    if (data === undefined) return false;
    setFormData(data);
    return true;
  }, [setFormData]);

  return { processJson, reset };
}
