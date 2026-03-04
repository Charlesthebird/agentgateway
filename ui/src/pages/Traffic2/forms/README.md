# Forms

TypeScript forms typed with `config.d.ts`. See [RJSF docs](https://rjsf-team.github.io/react-jsonschema-form/) for details.

## Add a Form

**1. Create `myForm.ts`:**
```typescript
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { MyType } from "../../../config";

export const schema: RJSFSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", title: "Name" },
    port: { type: "integer", minimum: 1, maximum: 65535 },
  },
};

export const uiSchema: UiSchema = {
  name: { "ui:placeholder": "my-resource" },
  port: { "ui:widget": "updown" },
};

export const defaultValues: Partial<MyType> = {};
```

**2. Export in `index.ts`:**
```typescript
import * as myForm from "./myForm";
export const forms = { ...existing, my: myForm };
export const resourceLabels = { my: { singular: "My", plural: "Mys" } };
```

## Quick Reference

**Types**: `string`, `integer`, `boolean`, `array`, `object`
**Validation**: `required`, `minLength`, `minimum`, `pattern`, `enum`
**UI**: `"ui:placeholder"`, `"ui:widget"`, `"ui:help"`, `"ui:order"`
**Widgets**: `textarea`, `select`, `radio`, `updown`, `hidden`
