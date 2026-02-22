// src/components/JsonFileUploader.tsx

import React, { useCallback, useRef } from "react";
import { JsonAutoFillError, JsonFileUploaderProps } from "../types";

const DEFAULT_MAX_FILE_SIZE = 1_048_576; // 1 MB

/**
 * A file input component that reads JSON file(s) and passes the content to a callback.
 * Includes file size/type validation, multi-file support, error handling, and accessibility.
 */
export const JsonFileUploader: React.FC<JsonFileUploaderProps> = ({
  onJsonLoaded,
  onError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  multiple = false,
  accept = "application/json,.json",
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel = "Upload JSON file",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.name.endsWith(".json") && file.type !== "application/json") {
        onError?.(
          new JsonAutoFillError(
            `Invalid file type: "${file.type || file.name}". Expected a .json file.`,
            "INVALID_FILE_TYPE",
          ),
        );
        return;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        onError?.(
          new JsonAutoFillError(
            `File "${file.name}" too large (${formatBytes(file.size)}). Maximum allowed: ${formatBytes(maxFileSize)}.`,
            "FILE_TOO_LARGE",
          ),
        );
        return;
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
            `Failed to read file "${file.name}"`,
            "FILE_READ_ERROR",
          ),
        );
      };

      reader.readAsText(file);
    },
    [onJsonLoaded, onError, maxFileSize],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileList = Array.from(files);
      for (const file of fileList) {
        processFile(file);
      }

      resetInput();
    },
    [processFile],
  );

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <input
      ref={inputRef}
      type='file'
      accept={accept}
      onChange={handleChange}
      disabled={disabled}
      multiple={multiple}
      className={className}
      id={id}
      aria-label={ariaLabel}
    />
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
