// src/core/mergeStrategies.ts

import { MergeStrategy } from "../types";

/**
 * Merges incoming data into the current form data using the specified strategy.
 *
 * - `"merge"` (default): Shallow merge — incoming fields overwrite existing, others preserved.
 * - `"replace"`: Fully replace current data with incoming data.
 * - `"strict"`: Only overwrite fields that already exist in the current data.
 * - `"deep"`: Recursively merge nested objects instead of overwriting them.
 */
export function mergeData<T extends Record<string, unknown>>(
  current: T,
  incoming: Partial<T>,
  strategy: MergeStrategy = "merge",
): T {
  switch (strategy) {
    case "replace":
      return incoming as T;

    case "strict": {
      const filtered = Object.keys(current).reduce<Partial<T>>((acc, key) => {
        if (key in incoming) {
          (acc as Record<string, unknown>)[key] = (
            incoming as Record<string, unknown>
          )[key];
        }
        return acc;
      }, {});
      return { ...current, ...filtered };
    }

    case "deep":
      return deepMerge(current, incoming) as T;

    case "merge":
    default:
      return { ...current, ...incoming };
  }
}

/**
 * Recursively merges `source` into `target`.
 * - Plain objects are merged recursively.
 * - Arrays and primitives from `source` overwrite `target`.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];

    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      result[key] = sourceVal;
    }
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}
