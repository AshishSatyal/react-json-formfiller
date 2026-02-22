// src/hooks/useJsonDragAndDrop.ts

import { useCallback, useState } from "react";
import {
  DragAndDropOptions,
  DragAndDropResult,
  JsonAutoFillError,
} from "../types";

const DEFAULT_MAX_FILE_SIZE = 1_048_576; // 1 MB

/**
 * React hook that provides drag-and-drop JSON file upload functionality.
 * Returns `dragProps` to spread onto any container element and an `isDragging` state.
 *
 * @example
 * ```tsx
 * const { dragProps, isDragging } = useJsonDragAndDrop({
 *   onJsonLoaded: processJson,
 *   onError: (err) => console.error(err.message),
 * });
 *
 * return (
 *   <div {...dragProps} style={{ border: isDragging ? "2px dashed blue" : "2px dashed gray" }}>
 *     Drop a JSON file here
 *   </div>
 * );
 * ```
 */
export function useJsonDragAndDrop(
  options: DragAndDropOptions,
): DragAndDropResult {
  const [isDragging, setIsDragging] = useState(false);
  const {
    onJsonLoaded,
    onError,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    disabled = false,
  } = options;

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [disabled],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      // Only set isDragging to false when actually leaving the container
      // (not when entering a child element)
      const relatedTarget = e.relatedTarget as Node | null;
      if (!e.currentTarget.contains(relatedTarget)) {
        setIsDragging(false);
      }
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const jsonFiles = files.filter(
        (f) => f.name.endsWith(".json") || f.type === "application/json",
      );

      if (jsonFiles.length === 0) {
        onError?.(
          new JsonAutoFillError(
            "No JSON files found in the dropped items.",
            "INVALID_FILE_TYPE",
          ),
        );
        return;
      }

      for (const file of jsonFiles) {
        if (file.size > maxFileSize) {
          onError?.(
            new JsonAutoFillError(
              `File "${file.name}" is too large (${formatBytes(file.size)}). Maximum: ${formatBytes(maxFileSize)}.`,
              "FILE_TOO_LARGE",
            ),
          );
          continue;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === "string") {
            onJsonLoaded(result);
          }
        };

        reader.onerror = () => {
          onError?.(
            new JsonAutoFillError(
              `Failed to read file "${file.name}".`,
              "FILE_READ_ERROR",
            ),
          );
        };

        reader.readAsText(file);
      }
    },
    [disabled, maxFileSize, onJsonLoaded, onError],
  );

  return {
    dragProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    isDragging,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
