// src/core/parseJson.ts

import { JsonAutoFillError } from "../types";

/**
 * Safely parses a JSON string into an object.
 * Rejects prototype pollution attempts (__proto__, constructor, prototype keys).
 */
export function parseJson(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text, (_key, value) => {
      // Prototype pollution protection: reviver runs bottom-up on values,
      // but we check parsed keys in a second pass below.
      return value;
    });

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new JsonAutoFillError(
        "JSON must be a top-level object (not an array or primitive)",
        "PARSE_ERROR",
      );
    }

    assertNoPrototypePollution(parsed);
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof JsonAutoFillError) throw error;
    throw new JsonAutoFillError("Invalid JSON file", "PARSE_ERROR");
  }
}

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function assertNoPrototypePollution(obj: unknown): void {
  if (typeof obj !== "object" || obj === null) return;

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) {
      throw new JsonAutoFillError(
        `Potentially dangerous key "${key}" found in JSON`,
        "PARSE_ERROR",
      );
    }
    assertNoPrototypePollution((obj as Record<string, unknown>)[key]);
  }
}
