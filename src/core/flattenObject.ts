// src/core/flattenObject.ts

/**
 * Flattens a nested object into a single-level object with dot-notation keys.
 * Arrays are preserved as values (not flattened into indexed keys).
 *
 * @example
 * flattenObject({ a: { b: 1 }, c: [1, 2] })
 * // => { "a.b": 1, "c": [1, 2] }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  parentKey = "",
  result: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const key of Object.keys(obj)) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const newKey = parentKey ? `${parentKey}.${key}` : key;
    const value = obj[key];

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      flattenObject(value as Record<string, unknown>, newKey, result);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}
