// src/index.ts

// React hooks
export { useJsonAutoFill } from "./hooks/useJsonAutoFill";
export { useJsonAutoFillRHF } from "./hooks/useJsonAutoFillRHF";
export { useJsonAutoFillFormik } from "./hooks/useJsonAutoFillFormik";
export { useJsonDragAndDrop } from "./hooks/useJsonDragAndDrop";
export { useJsonPaste } from "./hooks/useJsonPaste";

// React component
export { JsonFileUploader } from "./components/JsonFileUploader";

// Core utilities
export { applyMapping } from "./core/applyMapping";
export { flattenObject } from "./core/flattenObject";
export { mergeData } from "./core/mergeStrategies";
export { parseJson } from "./core/parseJson";
export { processJsonData } from "./core/processJsonData";

// Schema validation helpers
export { withZodSchema, withYupSchema } from "./core/schemaHelpers";

// Types and error class
export {
  JsonAutoFillError,
  type JsonAutoFillErrorCode,
  type JsonAutoFillOptions,
  type RHFAutoFillOptions,
  type FormikAutoFillOptions,
  type JsonFileUploaderProps,
  type DragAndDropOptions,
  type DragAndDropResult,
  type JsonPasteOptions,
  type MergeStrategy,
} from "./types";
