# Form Generation System

Automatically generates RJSF-compatible form schemas from `schema/config.json`.

## 📁 Files

- **config.cjs** ✏️ - Edit this to add categories, patterns, exclusions
- **generator.cjs** ⚙️ - Core logic (rarely needs changes)
- **index.cjs** 🚀 - Entry point

## 🚀 Usage

```bash
yarn generate:schemas
```

Auto-runs before `yarn dev` and `yarn build`. Output: `ui/schema-forms/`

## ⚙️ How It Works

1. **Discovers types** by matching patterns (e.g., `['Policy']` finds `JWTPolicy`, `LocalPolicy`)
2. **Generates standalone schemas** with all `$ref` dependencies embedded
3. **Enhances schemas** with user-friendly titles and descriptions
4. **Creates indexes** for each category

## ✏️ Adding a Category

Edit `config.cjs`:

```javascript
middleware: {
  name: 'Middleware',
  description: 'Request/response transformation',
  typePatterns: ['Middleware', 'Transform'],
  exclude: ['InternalMiddleware'],
}
```

That's it! New types matching the pattern will auto-appear.

## 🔧 Configuration

**Pattern matching** (case-sensitive substring):

- `['Policy']` → matches `LocalPolicy`, `JWTPolicy`
- `['Route']` → matches `HTTPRoute`, `TCPRoute`

**Category options:**

```javascript
{
  name: 'Display Name',           // UI label
  description: 'Brief desc',      // User-facing text
  typePatterns: ['Pattern'],      // Types to include
  exclude: ['SpecificType'],      // Types to skip
}
```

## 🐛 Common Issues

**Type not showing?**

- Check pattern matches in `config.cjs`
- Verify not in `exclude` list

**Generation fails?**

- Validate `schema/config.json` is valid JSON
- Check all `$ref` references exist

**Changes not reflecting?**

- Run `yarn generate:schemas`
- Restart dev server

## 📚 Links

- [RJSF Docs](https://rjsf-team.github.io/react-jsonschema-form/)
- [JSON Schema Spec](https://json-schema.org/draft/2020-12/json-schema-core.html)
