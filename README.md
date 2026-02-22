# react-json-form-autofill

Auto-fill React forms using uploaded JSON files — with field mapping, merge strategies, transforms, drag-and-drop, clipboard paste, schema validation, and error handling.

## Installation

```bash
npm install react-json-form-autofill
```

## Quick Start

```tsx
import { useState } from "react";
import { useJsonAutoFill, JsonFileUploader } from "react-json-form-autofill";

function MyForm() {
  const initial = { name: "", email: "", age: 0 };
  const [formData, setFormData] = useState(initial);

  const { processJson, reset } = useJsonAutoFill(
    setFormData,
    {
      mergeStrategy: "strict",
      transform: (data) => ({ ...data, name: String(data.name).trim() }),
      onError: (err) => console.error(err.code, err.message),
      onSuccess: (data) => console.log("Filled:", data),
    },
    initial, // enables reset()
  );

  return (
    <form>
      <JsonFileUploader
        onJsonLoaded={processJson}
        onError={(err) => alert(err.message)}
        maxFileSize={512_000}
      />
      <button type='button' onClick={reset}>
        Reset
      </button>
      <input
        value={formData.name}
        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
      />
      <input
        value={formData.email}
        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
      />
      <input
        type='number'
        value={formData.age}
        onChange={(e) => setFormData((p) => ({ ...p, age: +e.target.value }))}
      />
    </form>
  );
}
```

## API

### `useJsonAutoFill(setFormData, options?, initialData?)`

Returns `{ processJson, reset }`.

- **`processJson(jsonStringOrObject)`** — Parse, transform, validate, and merge data into form state. Returns `Promise<boolean>`.
- **`reset()`** — Restore form data to `initialData` (if provided as 3rd argument). Returns `boolean`.

#### Options

| Option          | Type                                         | Default     | Description                                           |
| --------------- | -------------------------------------------- | ----------- | ----------------------------------------------------- |
| `mergeStrategy` | `"merge" \| "replace" \| "strict" \| "deep"` | `"merge"`   | How incoming data is merged with existing form state  |
| `fieldMap`      | `Record<string, string>`                     | —           | Map JSON keys → form field names                      |
| `flatten`       | `boolean`                                    | `true`      | Flatten nested objects to dot-notation keys           |
| `maxFileSize`   | `number`                                     | `1_048_576` | Max file size in bytes                                |
| `transform`     | `(data) => T \| Promise<T>`                  | —           | Transform values after mapping, before validation     |
| `validate`      | `(data: T) => boolean \| Promise<boolean>`   | —           | Custom validation (return `false` to reject)          |
| `onBeforeFill`  | `(data: T) => boolean \| Promise<boolean>`   | —           | Called before applying data; return `false` to cancel |
| `onAfterFill`   | `(data: T) => void`                          | —           | Called after data is applied to form state            |
| `onError`       | `(error: JsonAutoFillError) => void`         | —           | Error callback                                        |
| `onSuccess`     | `(data: T) => void`                          | —           | Success callback                                      |

### Merge Strategies

- **`"merge"`** (default) — Shallow merge: incoming fields overwrite existing, others preserved.
- **`"replace"`** — Completely replace form data with incoming data.
- **`"strict"`** — Only fill fields that already exist in the current form data.
- **`"deep"`** — Recursively merge nested objects instead of overwriting them.

---

### `<JsonFileUploader />`

A file input component for uploading `.json` files.

| Prop           | Type                                 | Default                    | Description                         |
| -------------- | ------------------------------------ | -------------------------- | ----------------------------------- |
| `onJsonLoaded` | `(data: string) => void`             | _required_                 | Callback with raw file content      |
| `onError`      | `(error: JsonAutoFillError) => void` | —                          | Error callback                      |
| `maxFileSize`  | `number`                             | `1_048_576`                | Max file size in bytes              |
| `multiple`     | `boolean`                            | `false`                    | Allow selecting multiple JSON files |
| `accept`       | `string`                             | `"application/json,.json"` | File input accept attribute         |
| `disabled`     | `boolean`                            | `false`                    | Disable the input                   |
| `className`    | `string`                             | —                          | CSS class name                      |
| `id`           | `string`                             | —                          | HTML id                             |
| `aria-label`   | `string`                             | `"Upload JSON file"`       | Accessible label                    |

---

### `useJsonDragAndDrop(options)`

Returns `{ dragProps, isDragging }` for drag-and-drop JSON file upload.

```tsx
import { useJsonDragAndDrop } from "react-json-form-autofill";

const { dragProps, isDragging } = useJsonDragAndDrop({
  onJsonLoaded: processJson,
  onError: (err) => console.error(err.message),
  maxFileSize: 512_000,
});

return (
  <div
    {...dragProps}
    style={{
      border: isDragging ? "2px dashed blue" : "2px dashed gray",
      padding: 32,
      textAlign: "center",
    }}
  >
    {isDragging ? "Drop it!" : "Drag a JSON file here"}
  </div>
);
```

| Option         | Type                                 | Default     | Description                |
| -------------- | ------------------------------------ | ----------- | -------------------------- |
| `onJsonLoaded` | `(data: string) => void`             | _required_  | Callback with file content |
| `onError`      | `(error: JsonAutoFillError) => void` | —           | Error callback             |
| `maxFileSize`  | `number`                             | `1_048_576` | Max file size in bytes     |
| `disabled`     | `boolean`                            | `false`     | Disable drag-and-drop      |

---

### `useJsonPaste(options)`

Listens for `Ctrl+V` / `Cmd+V` paste events containing JSON text.

```tsx
import { useJsonPaste } from "react-json-form-autofill";

useJsonPaste({
  onJsonPasted: processJson,
  onError: (err) => console.warn("Not valid JSON:", err.message),
});
```

| Option         | Type                                 | Default    | Description                    |
| -------------- | ------------------------------------ | ---------- | ------------------------------ |
| `onJsonPasted` | `(data: string) => void`             | _required_ | Callback with pasted JSON text |
| `onError`      | `(error: JsonAutoFillError) => void` | —          | Error callback                 |
| `enabled`      | `boolean`                            | `true`     | Enable/disable paste detection |

---

### Schema Validation Helpers

Zero-dependency helpers that wrap Zod or Yup schemas into a `validate` function:

```tsx
import { z } from "zod";
import { withZodSchema } from "react-json-form-autofill";

const schema = z.object({ name: z.string(), age: z.number() });

const { processJson } = useJsonAutoFill(setForm, {
  validate: withZodSchema(schema),
});
```

```tsx
import * as yup from "yup";
import { withYupSchema } from "react-json-form-autofill";

const schema = yup.object({
  name: yup.string().required(),
  age: yup.number().required(),
});

const { processJson } = useJsonAutoFill(setForm, {
  validate: withYupSchema(schema),
});
```

> **Note:** `zod` and `yup` are **not** bundled — install them separately if you use these helpers.

---

### Transform Example

Coerce and reshape values after field mapping:

```tsx
const { processJson } = useJsonAutoFill(setFormData, {
  fieldMap: { "user.age": "age", "user.name": "name" },
  transform: (data) => ({
    ...data,
    age: Number(data.age),
    name: String(data.name ?? "").trim(),
    createdAt: new Date().toISOString(),
  }),
});
```

---

### Lifecycle Hooks Example

Run side effects before and after filling:

```tsx
const { processJson } = useJsonAutoFill(setFormData, {
  onBeforeFill: (data) => {
    // Return false to cancel the fill
    return window.confirm(`Fill form with data for "${data.name}"?`);
  },
  onAfterFill: (data) => {
    analytics.track("form_autofilled", { fields: Object.keys(data) });
    toast.success("Form filled successfully!");
  },
});
```

---

### `JsonAutoFillError`

Custom error class with a `code` property for programmatic error handling:

```ts
type JsonAutoFillErrorCode =
  | "PARSE_ERROR" // Invalid JSON
  | "VALIDATION_ERROR" // Validation function returned false
  | "FILE_READ_ERROR" // FileReader failure
  | "FILE_TOO_LARGE" // Exceeds maxFileSize
  | "INVALID_FILE_TYPE"; // Not a .json file
```

---

## Form Library Adapters

### React Hook Form — `useJsonAutoFillRHF`

Drop-in adapter that uses RHF's `setValue` and `reset`, so validation, dirty tracking, and touched state all work automatically.

```tsx
import { useForm } from "react-hook-form";
import { useJsonAutoFillRHF, JsonFileUploader } from "react-json-form-autofill";

function MyForm() {
  const { register, handleSubmit, setValue, reset, getValues } = useForm({
    defaultValues: { name: "", email: "", age: 0 },
  });

  const { processJson, resetForm } = useJsonAutoFillRHF(
    { setValue, reset, getValues },
    {
      mergeStrategy: "strict",
      fieldMap: { full_name: "name" },
      setValueOptions: { shouldValidate: true, shouldDirty: true },
      onError: (err) => console.error(err.message),
    },
  );

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <JsonFileUploader onJsonLoaded={processJson} />
      <button type='button' onClick={() => resetForm()}>
        Reset
      </button>
      <input {...register("name")} />
      <input {...register("email")} />
      <input type='number' {...register("age", { valueAsNumber: true })} />
      <button type='submit'>Submit</button>
    </form>
  );
}
```

| Option            | Type                      | Default                                                          | Description                                             |
| ----------------- | ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| `setValueOptions` | `Record<string, unknown>` | `{ shouldValidate: true, shouldDirty: true, shouldTouch: true }` | Options passed to RHF's `setValue()`                    |
| `resetOptions`    | `Record<string, unknown>` | —                                                                | Options passed to RHF's `reset()` on "replace" strategy |

Plus all shared options: `mergeStrategy`, `fieldMap`, `flatten`, `transform`, `validate`, `onBeforeFill`, `onAfterFill`, `onError`, `onSuccess`.

---

### Formik — `useJsonAutoFillFormik`

Adapter that uses Formik's `setValues`, `setFieldValue`, and `resetForm`.

```tsx
import { useFormik } from "formik";
import {
  useJsonAutoFillFormik,
  JsonFileUploader,
} from "react-json-form-autofill";

function MyForm() {
  const formik = useFormik({
    initialValues: { name: "", email: "", age: 0 },
    onSubmit: (values) => console.log(values),
  });

  const { processJson, resetForm } = useJsonAutoFillFormik(
    {
      setValues: formik.setValues,
      setFieldValue: formik.setFieldValue,
      values: formik.values,
      resetForm: formik.resetForm,
    },
    {
      mergeStrategy: "strict",
      fieldMap: { full_name: "name" },
      onError: (err) => console.error(err.message),
    },
  );

  return (
    <form onSubmit={formik.handleSubmit}>
      <JsonFileUploader onJsonLoaded={processJson} />
      <button type='button' onClick={() => resetForm()}>
        Reset
      </button>
      <input
        name='name'
        value={formik.values.name}
        onChange={formik.handleChange}
      />
      <input
        name='email'
        value={formik.values.email}
        onChange={formik.handleChange}
      />
      <input
        name='age'
        type='number'
        value={formik.values.age}
        onChange={formik.handleChange}
      />
      <button type='submit'>Submit</button>
    </form>
  );
}
```

| Option           | Type      | Default | Description                                    |
| ---------------- | --------- | ------- | ---------------------------------------------- |
| `shouldValidate` | `boolean` | `true`  | Trigger Formik validation after setting values |

Plus all shared options: `mergeStrategy`, `fieldMap`, `flatten`, `transform`, `validate`, `onBeforeFill`, `onAfterFill`, `onError`, `onSuccess`.

---

### Field Mapping Example

```tsx
const { processJson } = useJsonAutoFill(setFormData, {
  fieldMap: {
    "user.first_name": "firstName",
    "user.last_name": "lastName",
    "user.contact.email": "email",
  },
});
```

Given this JSON:

```json
{
  "user": {
    "first_name": "Jane",
    "last_name": "Doe",
    "contact": { "email": "jane@example.com" }
  }
}
```

The form receives: `{ firstName: "Jane", lastName: "Doe", email: "jane@example.com" }`.

---

### Utility Exports

For advanced usage, core functions are also exported:

```ts
import {
  parseJson,
  flattenObject,
  applyMapping,
  mergeData,
} from "react-json-form-autofill";
```

## License

MIT
