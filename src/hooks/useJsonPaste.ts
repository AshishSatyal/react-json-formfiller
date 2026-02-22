// src/hooks/useJsonPaste.ts

import { useCallback, useEffect } from "react";
import { JsonAutoFillError, JsonPasteOptions } from "../types";

/**
 * React hook that listens for paste events and extracts JSON data from clipboard.
 * Useful for admin panels and developer tools where pasting JSON is common.
 *
 * @param options - Configuration for paste handling.
 *
 * @example
 * ```tsx
 * useJsonPaste({
 *   onJsonPasted: processJson,
 *   onError: (err) => console.warn("Not valid JSON:", err.message),
 * });
 * ```
 */
export function useJsonPaste(options: JsonPasteOptions): void {
  const { onJsonPasted, onError, enabled = true } = options;

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!enabled) return;

      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;

      // Quick check: does it look like JSON? (starts with { or [)
      if (!text.startsWith("{") && !text.startsWith("[")) return;

      try {
        // Validate it's parseable JSON before forwarding
        JSON.parse(text);
        onJsonPasted(text);
      } catch {
        onError?.(
          new JsonAutoFillError(
            "Pasted content is not valid JSON",
            "PARSE_ERROR",
          ),
        );
      }
    },
    [onJsonPasted, onError, enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste, enabled]);
}
