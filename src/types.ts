export type MergeStrategy = "merge" | "replace" | "strict" | "deep";

export class JsonAutoFillError extends Error {
  public readonly code: JsonAutoFillErrorCode;

  constructor(message: string, code: JsonAutoFillErrorCode) {
    super(message);
    this.name = "JsonAutoFillError";
    this.code = code;
  }
}

export type JsonAutoFillErrorCode =
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "FILE_READ_ERROR"
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE";

export interface JsonAutoFillOptions<T> {
  /** Strategy for merging incoming data with existing form data. Default: "merge" */
  mergeStrategy?: MergeStrategy;
  /** Map JSON keys to form field names. Keys are JSON paths, values are form field names. */
  fieldMap?: Record<string, string>;
  /** Whether to flatten nested JSON objects into dot-notation keys. Default: true */
  flatten?: boolean;
  /** Maximum allowed JSON file size in bytes. Default: 1MB (1_048_576) */
  maxFileSize?: number;
  /**
   * Transform values after mapping but before validation.
   * Receives the mapped data and should return the transformed data.
   *
   * @example
   * ```ts
   * transform: (data) => ({
   *   ...data,
   *   age: Number(data.age),
   *   name: String(data.name).trim(),
   * })
   * ```
   */
  transform?: (data: Record<string, unknown>) => T | Promise<T>;
  /** Custom validation function. Return false or throw to reject the data. */
  validate?: (data: T) => boolean | Promise<boolean>;
  /** Called before data is applied to the form. Return false to cancel. */
  onBeforeFill?: (data: T) => boolean | Promise<boolean>;
  /** Called after data has been applied to the form state. */
  onAfterFill?: (data: T) => void;
  /** Called when an error occurs during processing. */
  onError?: (error: JsonAutoFillError) => void;
  /** Called after data is successfully processed and applied. */
  onSuccess?: (data: T) => void;
}

export interface JsonFileUploaderProps {
  /** Called when a JSON file is successfully read. Receives the raw file content. */
  onJsonLoaded: (data: string) => void;
  /** Called when a file read error occurs. */
  onError?: (error: JsonAutoFillError) => void;
  /** Maximum file size in bytes. Default: 1MB (1_048_576) */
  maxFileSize?: number;
  /** Allow selecting multiple JSON files. When true, onJsonLoaded is called for each file. Default: false */
  multiple?: boolean;
  /** Custom accept attribute. Default: "application/json,.json" */
  accept?: string;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Custom class name for the input element. */
  className?: string;
  /** Custom id for the input element. */
  id?: string;
  /** Accessible label for screen readers. */
  "aria-label"?: string;
}

export interface DragAndDropOptions {
  /** Called when a JSON file is successfully read from a drop event. */
  onJsonLoaded: (data: string) => void;
  /** Called when a file read error occurs. */
  onError?: (error: JsonAutoFillError) => void;
  /** Maximum file size in bytes. Default: 1MB (1_048_576) */
  maxFileSize?: number;
  /** Whether drag and drop is disabled. Default: false */
  disabled?: boolean;
}

export interface DragAndDropResult {
  /** Props to spread onto the drop target element. */
  dragProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Whether a file is currently being dragged over the target. */
  isDragging: boolean;
}

export interface JsonPasteOptions {
  /** Called when JSON is successfully parsed from a paste event. */
  onJsonPasted: (data: string) => void;
  /** Called when paste content is not valid JSON. */
  onError?: (error: JsonAutoFillError) => void;
  /** Whether paste detection is enabled. Default: true */
  enabled?: boolean;
}

/**
 * Options shared across all adapter hooks (React Hook Form, Formik, etc.)
 */
interface BaseAdapterOptions<T> {
  mergeStrategy?: MergeStrategy;
  fieldMap?: Record<string, string>;
  flatten?: boolean;
  transform?: (data: Record<string, unknown>) => T | Promise<T>;
  validate?: (data: T) => boolean | Promise<boolean>;
  onBeforeFill?: (data: T) => boolean | Promise<boolean>;
  onAfterFill?: (data: T) => void;
  onError?: (error: JsonAutoFillError) => void;
  onSuccess?: (data: T) => void;
}

/**
 * Options for `useJsonAutoFillRHF` (React Hook Form adapter).
 */
export interface RHFAutoFillOptions<T> extends BaseAdapterOptions<T> {
  /** Options passed to `setValue()` calls. Default: `{ shouldValidate: true, shouldDirty: true, shouldTouch: true }` */
  setValueOptions?: Record<string, unknown>;
  /** Options passed to `reset()` when using `"replace"` strategy or `resetForm()`. */
  resetOptions?: Record<string, unknown>;
}

/**
 * Options for `useJsonAutoFillFormik` (Formik adapter).
 */
export interface FormikAutoFillOptions<T> extends BaseAdapterOptions<T> {
  /** Whether to trigger Formik validation after setting values. Default: true */
  shouldValidate?: boolean;
}
