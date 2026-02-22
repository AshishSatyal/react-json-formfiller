// src/core/applyMapping.ts

/**
 * Remaps object keys according to a field mapping.
 * Keys not in the fieldMap are passed through unchanged.
 *
 * @param data - The source data object.
 * @param fieldMap - A mapping of source keys to destination keys.
 * @returns A new object with remapped keys.
 */
export function applyMapping(
  data: Record<string, unknown>,
  fieldMap?: Record<string, string>,
): Record<string, unknown> {
  if (!fieldMap) return data;

  const mapped: Record<string, unknown> = {};

  for (const key of Object.keys(data)) {
    const mappedKey = fieldMap[key] ?? key;
    mapped[mappedKey] = data[key];
  }

  return mapped;
}
