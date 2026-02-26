/**
 * Form Schema Generator (Core Logic)
 *
 * Converts the Rust-generated config.json schema into RJSF-compatible form
 * schemas. This is a "black box" — for configuration changes see config.cjs.
 *
 * Three categories of cleanup are applied automatically on every run so manual
 * post-processing is never needed:
 *
 *  1. Non-standard format values  — Rust types like uint16/uint32/double have
 *     no meaning in JSON Schema and trigger "unknown format" warnings in Ajv.
 *     They are stripped, leaving only the numeric bounds (min/max) for UI hints.
 *
 *  2. unevaluatedProperties: false — Causes RJSF/Ajv2020 to reject valid data
 *     when form state contains extra keys during a oneOf switch. Always removed.
 *
 *  3. additionalProperties: false inside oneOf/anyOf branches — RJSF validates
 *     against ALL branches simultaneously. A branch with additionalProperties:false
 *     rejects properties that belong to the currently-selected branch. Stripped
 *     from immediate oneOf/anyOf children only (top-level is preserved).
 *
 * Additionally, plain `enum` arrays on string fields are promoted to the
 * `oneOf: [{const, title}]` pattern, which RJSF renders as a labeled dropdown.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * JSON Schema formats that Ajv recognises. Any format value not in this set
 * (e.g. Rust-derived uint16, uint32, uint, double, float, int32 …) is stripped.
 */
const SAFE_FORMATS = new Set([
  'date', 'time', 'date-time', 'duration',
  'email', 'idn-email',
  'hostname', 'idn-hostname',
  'ipv4', 'ipv6',
  'uri', 'uri-reference', 'iri', 'iri-reference', 'uri-template',
  'uuid',
  'json-pointer', 'relative-json-pointer',
  'regex',
]);

/**
 * Human-readable descriptions for well-known property names.
 * Added automatically when the source schema has no description.
 */
const FIELD_DESCRIPTIONS = {
  name:          'Unique name for this resource',
  protocol:      'Communication protocol',
  hostname:      'Hostname or domain to match (wildcards like *.example.com are supported)',
  port:          'TCP port number (1–65535)',
  host:          'Upstream address in "host:port" format, e.g. "example.com:8080"',
  weight:        'Load-balancing weight — higher values receive proportionally more traffic',
  namespace:     'Kubernetes-style namespace prefix',
  phase:         'Lifecycle phase at which this policy takes effect',
  target:        'Resource this policy attaches to',
  tls:           'TLS/SSL configuration',
  policies:      'Policies to apply to this resource',
  backends:      'Backend destinations',
  routes:        'HTTP routes',
  tcpRoutes:     'TCP routes',
  listeners:     'Listeners attached to this bind',
  matches:       'Matching conditions — all conditions in a rule must match',
  hostnames:     'Hostnames this rule applies to (supports wildcards)',
  headers:       'HTTP header match conditions',
  method:        'HTTP method to match (GET, POST, PUT, DELETE, …)',
  path:          'URL path match condition',
  ruleName:      'Optional name for this rule',
  tunnelProtocol:'Tunnel protocol to encapsulate connections',
  statefulMode:  'Enable stateful connection tracking',
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Convert camelCase/PascalCase to Title Case with spaces.
 * Handles common acronyms (TCP, HTTP, LLM, MCP, TLS, …).
 */
function toTitleCase(str) {
  let result = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
  if (result.length > 0) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

/**
 * Generate a description from a type name when none is available in the schema.
 */
function generateDescription(typeName, schema) {
  if (schema.description) return schema.description;
  let desc = toTitleCase(typeName);
  if (typeName.includes('Policy'))   desc += ' configuration';
  if (typeName.includes('Backend'))  desc += ' connection';
  if (typeName.includes('Route'))    desc += ' with matching conditions';
  if (typeName.includes('Listener')) desc += ' for incoming connections';
  return desc;
}

// ---------------------------------------------------------------------------
// Cleanup passes
// ---------------------------------------------------------------------------

/**
 * Recursively strip keywords that cause problems in RJSF/Ajv:
 *  - `unevaluatedProperties` (always)
 *  - non-standard `format` values (Rust-specific numeric types)
 *  - `additionalProperties` *only when directly inside a oneOf/anyOf branch*
 *    (the caller sets insideOneOfBranch=true for immediate children of oneOf/anyOf)
 */
function stripProblematicKeywords(schema, insideOneOfBranch = false) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return schema;

  const result = { ...schema };

  // Always remove — causes Ajv2020 to reject valid data during oneOf evaluation.
  delete result.unevaluatedProperties;

  // Strip Rust-specific format values that Ajv does not recognise.
  if (result.format !== undefined && !SAFE_FORMATS.has(result.format)) {
    delete result.format;
  }

  // additionalProperties: false on a oneOf/anyOf branch causes RJSF to report
  // "must NOT have additional properties" when the user has properties from
  // the sibling branch in their form data. Strip only at branch level.
  if (insideOneOfBranch && result.additionalProperties === false) {
    delete result.additionalProperties;
  }

  // Remove Rust-generated sentinel branches that represent uninstantiable enum variants.
  // These appear as {type:"string", enum:["invalid"]} in the source, but by the time
  // stripProblematicKeywords runs, convertEnumsToOneOf has already transformed them into
  // {type:"string", oneOf:[{const:"invalid", ...}]}. Detect both forms.
  const isInvalidSentinel = b => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return false;
    if (b.type !== 'string') return false;
    // Pre-conversion form
    if (Array.isArray(b.enum) && b.enum.length === 1 && b.enum[0] === 'invalid') return true;
    // Post-conversion form (convertEnumsToOneOf already ran)
    if (Array.isArray(b.oneOf) && b.oneOf.length === 1 &&
        b.oneOf[0] && b.oneOf[0].const === 'invalid') return true;
    return false;
  };

  // Recurse into oneOf / anyOf branches (immediate children → insideOneOfBranch=true)
  if (Array.isArray(result.oneOf)) {
    result.oneOf = result.oneOf
      .filter(b => !isInvalidSentinel(b))
      .map(b => stripProblematicKeywords(b, true));
    if (result.oneOf.length === 0) delete result.oneOf;
  }
  if (Array.isArray(result.anyOf)) {
    result.anyOf = result.anyOf
      .filter(b => !isInvalidSentinel(b))
      .map(b => stripProblematicKeywords(b, true));
    if (result.anyOf.length === 0) delete result.anyOf;
  }
  if (Array.isArray(result.allOf)) {
    result.allOf = result.allOf.map(b => stripProblematicKeywords(b, false));
  }

  // Recurse into all schema keyword locations
  if (result.properties && typeof result.properties === 'object') {
    const props = {};
    for (const [k, v] of Object.entries(result.properties)) {
      props[k] = stripProblematicKeywords(v, false);
    }
    result.properties = props;
  }
  if (result.items)            result.items            = stripProblematicKeywords(result.items, false);
  // prefixItems is the JSON Schema 2020-12 tuple keyword (replaces old-style items array)
  if (Array.isArray(result.prefixItems)) {
    result.prefixItems = result.prefixItems.map(item => stripProblematicKeywords(item, false));
  }
  if (result.contains)         result.contains         = stripProblematicKeywords(result.contains, false);
  if (result.if)               result.if               = stripProblematicKeywords(result.if, false);
  if (result.then)             result.then             = stripProblematicKeywords(result.then, false);
  if (result.else)             result.else             = stripProblematicKeywords(result.else, false);
  if (result.not)              result.not              = stripProblematicKeywords(result.not, false);
  if (result.$defs && typeof result.$defs === 'object') {
    const defs = {};
    for (const [k, v] of Object.entries(result.$defs)) {
      defs[k] = stripProblematicKeywords(v, false);
    }
    result.$defs = defs;
  }

  return result;
}

/**
 * Promote plain `enum` arrays on string-typed fields to the
 * `oneOf: [{const, title}]` pattern so RJSF renders labeled dropdowns.
 *
 * Before: { "type": "string", "enum": ["HTTP", "HTTPS", "TCP"] }
 * After:  { "type": "string", "oneOf": [
 *             { "const": "HTTP",  "title": "HTTP"  },
 *             { "const": "HTTPS", "title": "HTTPS" },
 *             { "const": "TCP",   "title": "TCP"   }
 *           ] }
 *
 * Null values in the enum become { "type": "null" } branches.
 * Mixed-type enums (non-string values other than null) are left unchanged.
 */
function convertEnumsToOneOf(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return schema;

  const result = { ...schema };

  if (
    result.enum &&
    Array.isArray(result.enum) &&
    result.enum.every(v => v === null || typeof v === 'string')
  ) {
    const hasNull     = result.enum.includes(null);
    const stringVals  = result.enum.filter(v => v !== null);

    if (stringVals.length > 0) {
      const branches = stringVals.map(val => ({
        const: val,
        title: toTitleCase(String(val)),
      }));
      if (hasNull) branches.push({ type: 'null', title: '(none)' });

      delete result.enum;
      // Keep `type` if it was plain "string" (not ["string","null"] etc.)
      result.oneOf = branches;
    }
  }

  // Recurse
  if (result.properties && typeof result.properties === 'object') {
    const props = {};
    for (const [k, v] of Object.entries(result.properties)) {
      props[k] = convertEnumsToOneOf(v);
    }
    result.properties = props;
  }
  if (Array.isArray(result.oneOf))      result.oneOf      = result.oneOf.map(convertEnumsToOneOf);
  if (Array.isArray(result.anyOf))      result.anyOf      = result.anyOf.map(convertEnumsToOneOf);
  if (Array.isArray(result.allOf))      result.allOf      = result.allOf.map(convertEnumsToOneOf);
  if (result.items)                     result.items      = convertEnumsToOneOf(result.items);
  if (Array.isArray(result.prefixItems)) result.prefixItems = result.prefixItems.map(convertEnumsToOneOf);
  if (result.$defs && typeof result.$defs === 'object') {
    const defs = {};
    for (const [k, v] of Object.entries(result.$defs)) {
      defs[k] = convertEnumsToOneOf(v);
    }
    result.$defs = defs;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Enhancement (titles, descriptions)
// ---------------------------------------------------------------------------

/**
 * Enhance a schema object with better titles and descriptions.
 * Also adds descriptions from FIELD_DESCRIPTIONS for known property names.
 */
function enhanceSchema(schema, key, defs) {
  if (!schema || typeof schema !== 'object') return schema;

  const enhanced = { ...schema };

  // Add title from key if missing
  if (!enhanced.title && key) {
    enhanced.title = toTitleCase(key);
  }

  // Enhance oneOf branches with titles derived from their structure
  if (Array.isArray(enhanced.oneOf)) {
    enhanced.oneOf = enhanced.oneOf.map((branch, idx) => {
      const b = { ...branch };
      if (!b.title) {
        if (b.const !== undefined) {
          b.title = toTitleCase(String(b.const));
        } else if (b.properties) {
          const keys = Object.keys(b.properties);
          b.title = keys.length === 1 ? toTitleCase(keys[0]) : `Option ${idx + 1}`;
        } else if (b.$ref) {
          b.title = toTitleCase(b.$ref.split('/').pop() || `Option ${idx + 1}`);
        } else if (b.type === 'null') {
          b.title = '(none)';
        } else {
          b.title = `Option ${idx + 1}`;
        }
      }
      return b;
    });
  }

  // Enhance anyOf branches
  if (Array.isArray(enhanced.anyOf)) {
    enhanced.anyOf = enhanced.anyOf.map((branch, idx) => {
      const b = { ...branch };
      if (!b.title && b.type !== 'null') {
        if (b.properties) {
          const keys = Object.keys(b.properties);
          b.title = keys.length > 0 ? toTitleCase(keys[0]) : `Option ${idx + 1}`;
        } else if (b.$ref) {
          b.title = toTitleCase(b.$ref.split('/').pop() || `Option ${idx + 1}`);
        }
      }
      return b;
    });
  }

  // Recursively enhance properties
  if (enhanced.properties && typeof enhanced.properties === 'object') {
    const enhancedProps = {};
    for (const [propKey, propSchema] of Object.entries(enhanced.properties)) {
      enhancedProps[propKey] = enhanceSchema(propSchema, propKey, defs);

      // Add title from property key if still missing
      if (!enhancedProps[propKey].title) {
        enhancedProps[propKey].title = toTitleCase(propKey);
      }

      // Add description from the well-known field map if not already set
      if (!enhancedProps[propKey].description && FIELD_DESCRIPTIONS[propKey]) {
        enhancedProps[propKey].description = FIELD_DESCRIPTIONS[propKey];
      }
    }
    enhanced.properties = enhancedProps;
  }

  return enhanced;
}

// ---------------------------------------------------------------------------
// Schema discovery and extraction
// ---------------------------------------------------------------------------

/**
 * Collect all $ref definitions referenced by a schema, transitively.
 */
function collectReferencedDefs(schema, allDefs, collected = new Set()) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.$ref && typeof schema.$ref === 'string') {
    const refKey = schema.$ref.replace('#/$defs/', '');
    if (!collected.has(refKey) && allDefs[refKey]) {
      collected.add(refKey);
      collectReferencedDefs(allDefs[refKey], allDefs, collected);
    }
  }

  for (const value of Object.values(schema)) {
    if (Array.isArray(value)) {
      value.forEach(item => collectReferencedDefs(item, allDefs, collected));
    } else if (value && typeof value === 'object') {
      collectReferencedDefs(value, allDefs, collected);
    }
  }

  return collected;
}

/**
 * Discover types for a category by pattern matching against $defs keys.
 */
function discoverTypes(categoryKey, categoryConfig, baseSchema) {
  const defs = baseSchema.$defs || {};
  const types = [];

  if (categoryConfig.itemType && defs[categoryConfig.itemType]) {
    types.push({
      key: categoryConfig.itemType,
      displayName: toTitleCase(categoryConfig.itemType),
      description: generateDescription(categoryConfig.itemType, defs[categoryConfig.itemType]),
    });
  }

  for (const [typeName, typeSchema] of Object.entries(defs)) {
    if (types.some(t => t.key === typeName)) continue;
    if (categoryConfig.exclude.includes(typeName)) continue;

    const matchesPattern = categoryConfig.typePatterns.some(p => typeName.includes(p));
    if (matchesPattern) {
      types.push({
        key: typeName,
        displayName: toTitleCase(typeName),
        description: generateDescription(typeName, typeSchema),
      });
    }
  }

  return types;
}

/**
 * Build a standalone, RJSF-ready schema for a single type.
 *
 * Processing order:
 *   1. Copy raw schema from $defs
 *   2. Collect all transitive $ref dependencies
 *   3. Enhance titles/descriptions throughout
 *   4. Convert plain enums to oneOf with const+title
 *   5. Strip problematic Rust/Ajv keywords
 */
function extractSchema(typeKey, baseSchema, typeOverrides = {}) {
  const defs = baseSchema.$defs || {};

  if (!defs[typeKey]) {
    console.warn(`Warning: Type ${typeKey} not found in schema definitions`);
    return null;
  }

  // 1. Deep-copy raw schema
  let schema = JSON.parse(JSON.stringify(defs[typeKey]));

  // 2. Collect transitive dependencies
  const referencedDefs = collectReferencedDefs(schema, defs);
  const schemaDefsObject = {};
  for (const refKey of referencedDefs) {
    schemaDefsObject[refKey] = JSON.parse(JSON.stringify(defs[refKey]));
  }

  // 2b. Apply TYPE_OVERRIDES from config — replaces $defs entries whose auto-generated
  // schema is structurally wrong (e.g. Rust newtypes that serialise differently).
  for (const [overrideKey, overrideSchema] of Object.entries(typeOverrides)) {
    if (overrideKey in schemaDefsObject) {
      schemaDefsObject[overrideKey] = { ...overrideSchema };
    }
    if (typeKey === overrideKey) {
      schema = { ...overrideSchema };
    }
  }

  // 3. Enhance titles/descriptions (skip overridden defs — their schema is intentional)
  schema = enhanceSchema(schema, typeKey, defs);
  for (const [defKey, defSchema] of Object.entries(schemaDefsObject)) {
    if (defKey in typeOverrides) continue;
    schemaDefsObject[defKey] = enhanceSchema(defSchema, defKey, defs);
  }

  // 4–5. Build standalone schema, then apply cleanup passes
  let standaloneSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...schema,
    ...(Object.keys(schemaDefsObject).length > 0 ? { $defs: schemaDefsObject } : {}),
  };

  standaloneSchema = convertEnumsToOneOf(standaloneSchema);
  standaloneSchema = stripProblematicKeywords(standaloneSchema, false);

  return standaloneSchema;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Generate RJSF-compatible form schemas for all configured categories.
 *
 * @param {object} config - { SCHEMA_PATH, OUTPUT_DIR, CATEGORY_MAPPINGS }
 */
function generateSchemas(config) {
  const { SCHEMA_PATH, OUTPUT_DIR, CATEGORY_MAPPINGS, TYPE_OVERRIDES = {} } = config;

  const configDir = path.dirname(require.main.filename);
  const schemaPath = path.resolve(configDir, SCHEMA_PATH);
  const outputDir  = path.resolve(configDir, OUTPUT_DIR);

  console.log('Reading base schema from:', schemaPath);
  const baseSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  // Ensure output directories exist
  for (const [categoryKey] of Object.entries(CATEGORY_MAPPINGS)) {
    const categoryDir = path.join(outputDir, categoryKey);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  }

  for (const [categoryKey, categoryConfig] of Object.entries(CATEGORY_MAPPINGS)) {
    console.log(`\nProcessing ${categoryConfig.name}...`);
    const categoryDir = path.join(outputDir, categoryKey);

    const types = discoverTypes(categoryKey, categoryConfig, baseSchema);
    console.log(`  Found ${types.length} types`);

    const index = [];

    for (const type of types) {
      console.log(`  - Generating ${type.displayName}...`);
      const schema = extractSchema(type.key, baseSchema, TYPE_OVERRIDES);

      if (schema) {
        schema.title = type.displayName;
        if (type.description) schema.description = type.description;

        const filename = `${type.key}.json`;
        fs.writeFileSync(
          path.join(categoryDir, filename),
          JSON.stringify(schema, null, 2),
        );

        index.push({
          key: type.key,
          displayName: type.displayName,
          description: type.description,
          schemaFile: filename,
        });
      }
    }

    // Write index
    fs.writeFileSync(
      path.join(categoryDir, 'index.json'),
      JSON.stringify({
        category: categoryConfig.name,
        description: categoryConfig.description,
        types: index,
      }, null, 2),
    );

    // Remove stale JSON files that are no longer generated for this category
    const generatedFiles = new Set([...index.map(t => t.schemaFile), 'index.json']);
    for (const existing of fs.readdirSync(categoryDir)) {
      if (existing.endsWith('.json') && !generatedFiles.has(existing)) {
        fs.unlinkSync(path.join(categoryDir, existing));
        console.log(`  ✗ Removed stale file: ${existing}`);
      }
    }

    console.log(`  ✓ Generated ${index.length} schemas for ${categoryConfig.name}`);
  }

  console.log('\n✅ Schema generation complete!');
  console.log(`Output directory: ${outputDir}`);
  for (const [categoryKey, categoryConfig] of Object.entries(CATEGORY_MAPPINGS)) {
    const indexPath = path.join(outputDir, categoryKey, 'index.json');
    if (fs.existsSync(indexPath)) {
      const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      console.log(`  - ${categoryConfig.name}: ${idx.types.length} types`);
    }
  }
}

module.exports = { generateSchemas };
