/**
 * Form Schema Generator (Core Logic)
 * 
 * This file contains the core generation logic for converting JSON schemas
 * into RJSF-compatible forms. This is intended to be a "black box" that
 * rarely needs modification.
 * 
 * DO NOT modify this file unless you're updating the generation algorithm itself.
 * For configuration changes, see config.cjs instead.
 */

const fs = require('fs');
const path = require('path');

/**
 * Convert camelCase/PascalCase to Title Case with spaces
 * Handles acronyms properly (TCP, HTTP, LLM, etc.)
 */
function toTitleCase(str) {
  // Handle common acronyms - they appear as consecutive capitals
  // E.g., "TCPRoute" -> "TCP Route", "LocalLLMPolicy" -> "Local LLM Policy"
  let result = str
    // Add space before a capital letter that follows a lowercase letter
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Add space before a capital letter that starts a word after consecutive capitals
    // E.g., "HTTPSProxy" -> "HTTPS Proxy"
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
  
  // Capitalize first letter if needed
  if (result.length > 0) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  
  return result;
}

/**
 * Generate description from type name if not available
 */
function generateDescription(typeName, schema) {
  if (schema.description) {
    return schema.description;
  }
  
  // Generate from name
  let desc = toTitleCase(typeName);
  
  // Add context based on naming patterns
  if (typeName.includes('Policy')) desc += ' configuration';
  if (typeName.includes('Backend')) desc += ' connection';
  if (typeName.includes('Route')) desc += ' with matching conditions';
  if (typeName.includes('Listener')) desc += ' for incoming connections';
  
  return desc;
}

/**
 * Enhance a schema object with better titles and descriptions
 */
function enhanceSchema(schema, key, defs) {
  if (!schema || typeof schema !== 'object') return schema;

  const enhanced = { ...schema };

  // Add title if missing
  if (!enhanced.title && key) {
    enhanced.title = toTitleCase(key);
  }

  // Enhance oneOf/anyOf branches with titles
  if (enhanced.oneOf && Array.isArray(enhanced.oneOf)) {
    enhanced.oneOf = enhanced.oneOf.map((branch, idx) => {
      const enhancedBranch = { ...branch };
      
      if (!enhancedBranch.title) {
        // Try to infer title from properties or const
        if (enhancedBranch.const) {
          enhancedBranch.title = toTitleCase(String(enhancedBranch.const));
        } else if (enhancedBranch.properties) {
          const keys = Object.keys(enhancedBranch.properties);
          if (keys.length === 1) {
            enhancedBranch.title = toTitleCase(keys[0]);
          } else if (keys.length > 0) {
            enhancedBranch.title = `Option ${idx + 1}`;
          }
        } else {
          enhancedBranch.title = `Option ${idx + 1}`;
        }
      }
      
      return enhancedBranch;
    });
  }

  if (enhanced.anyOf && Array.isArray(enhanced.anyOf)) {
    enhanced.anyOf = enhanced.anyOf.map((branch, idx) => {
      const enhancedBranch = { ...branch };
      
      if (!enhancedBranch.title && enhancedBranch.type !== 'null') {
        if (enhancedBranch.properties) {
          const keys = Object.keys(enhancedBranch.properties);
          if (keys.length > 0) {
            enhancedBranch.title = toTitleCase(keys[0]);
          }
        } else if (enhancedBranch.$ref) {
          const refKey = enhancedBranch.$ref.split('/').pop();
          enhancedBranch.title = toTitleCase(refKey);
        }
      }
      
      return enhancedBranch;
    });
  }

  // Recursively enhance properties
  if (enhanced.properties && typeof enhanced.properties === 'object') {
    const enhancedProps = {};
    for (const [propKey, propSchema] of Object.entries(enhanced.properties)) {
      enhancedProps[propKey] = enhanceSchema(propSchema, propKey, defs);
      
      // Add title to property if missing
      if (!enhancedProps[propKey].title) {
        enhancedProps[propKey].title = toTitleCase(propKey);
      }
    }
    enhanced.properties = enhancedProps;
  }

  return enhanced;
}

/**
 * Collect all referenced definitions recursively
 */
function collectReferencedDefs(schema, allDefs, collected = new Set()) {
  if (!schema || typeof schema !== 'object') return;

  // Check for $ref
  if (schema.$ref && typeof schema.$ref === 'string') {
    const refKey = schema.$ref.replace('#/$defs/', '');
    if (!collected.has(refKey) && allDefs[refKey]) {
      collected.add(refKey);
      // Recursively collect refs in the referenced schema
      collectReferencedDefs(allDefs[refKey], allDefs, collected);
    }
  }

  // Recursively check nested objects and arrays
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
 * Discover types for a category by analyzing schema structure and naming patterns
 */
function discoverTypes(categoryKey, categoryConfig, baseSchema) {
  const defs = baseSchema.$defs || {};
  const types = [];
  
  // Start with the item type if specified
  if (categoryConfig.itemType && defs[categoryConfig.itemType]) {
    types.push({
      key: categoryConfig.itemType,
      displayName: toTitleCase(categoryConfig.itemType),
      description: generateDescription(categoryConfig.itemType, defs[categoryConfig.itemType]),
    });
  }
  
  // Discover additional types by pattern matching
  for (const [typeName, typeSchema] of Object.entries(defs)) {
    // Skip if already added
    if (types.some(t => t.key === typeName)) continue;
    
    // Skip if in exclude list
    if (categoryConfig.exclude.includes(typeName)) continue;
    
    // Check if matches any pattern
    const matchesPattern = categoryConfig.typePatterns.some(pattern => 
      typeName.includes(pattern)
    );
    
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
 * Extract and generate schema for a specific type
 */
function extractSchema(typeKey, baseSchema) {
  const defs = baseSchema.$defs || {};
  
  if (!defs[typeKey]) {
    console.warn(`Warning: Type ${typeKey} not found in schema definitions`);
    return null;
  }

  // Get the main schema (keep refs as references)
  let schema = JSON.parse(JSON.stringify(defs[typeKey]));
  
  // Collect all referenced definitions
  const referencedDefs = collectReferencedDefs(schema, defs);
  
  // Build $defs object with all referenced schemas
  const schemaDefsObject = {};
  for (const refKey of referencedDefs) {
    schemaDefsObject[refKey] = JSON.parse(JSON.stringify(defs[refKey]));
  }
  
  // Enhance with titles and descriptions
  schema = enhanceSchema(schema, typeKey, defs);
  
  // Enhance referenced definitions too
  for (const [defKey, defSchema] of Object.entries(schemaDefsObject)) {
    schemaDefsObject[defKey] = enhanceSchema(defSchema, defKey, defs);
  }
  
  // Create a standalone schema with embedded definitions
  const standaloneSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...schema,
  };

  // Add $defs if we collected any
  if (Object.keys(schemaDefsObject).length > 0) {
    standaloneSchema.$defs = schemaDefsObject;
  }

  return standaloneSchema;
}

/**
 * Main generation function
 * 
 * @param {Object} config - Configuration object with SCHEMA_PATH, OUTPUT_DIR, and CATEGORY_MAPPINGS
 */
function generateSchemas(config) {
  const { SCHEMA_PATH, OUTPUT_DIR, CATEGORY_MAPPINGS } = config;
  
  // Resolve paths relative to the config file location
  const configDir = path.dirname(require.main.filename);
  const schemaPath = path.resolve(configDir, SCHEMA_PATH);
  const outputDir = path.resolve(configDir, OUTPUT_DIR);

  console.log('Reading base schema from:', schemaPath);
  const baseSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  // Ensure output directories exist
  for (const [categoryKey] of Object.entries(CATEGORY_MAPPINGS)) {
    const categoryDir = path.join(outputDir, categoryKey);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  }

  // Generate schemas for each category
  for (const [categoryKey, categoryConfig] of Object.entries(CATEGORY_MAPPINGS)) {
    console.log(`\nProcessing ${categoryConfig.name}...`);
    const categoryDir = path.join(outputDir, categoryKey);
    
    // Discover types for this category
    const types = discoverTypes(categoryKey, categoryConfig, baseSchema);
    console.log(`  Found ${types.length} types`);
    
    const index = [];

    for (const type of types) {
      console.log(`  - Generating ${type.displayName}...`);
      const schema = extractSchema(type.key, baseSchema);
      
      if (schema) {
        // Add metadata
        schema.title = type.displayName;
        if (type.description) {
          schema.description = type.description;
        }

        // Write schema file
        const filename = `${type.key}.json`;
        const filepath = path.join(categoryDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(schema, null, 2));
        
        // Add to index
        index.push({
          key: type.key,
          displayName: type.displayName,
          description: type.description,
          schemaFile: filename
        });
      }
    }

    // Write category index
    const indexPath = path.join(categoryDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify({
      category: categoryConfig.name,
      description: categoryConfig.description,
      types: index
    }, null, 2));
    
    console.log(`  ✓ Generated ${index.length} schemas for ${categoryConfig.name}`);
  }

  console.log('\n✅ Schema generation complete!');
  console.log(`\nOutput directory: ${outputDir}`);
  console.log('\nGenerated categories:');
  for (const [categoryKey, categoryConfig] of Object.entries(CATEGORY_MAPPINGS)) {
    const indexPath = path.join(outputDir, categoryKey, 'index.json');
    if (fs.existsSync(indexPath)) {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      console.log(`  - ${categoryConfig.name}: ${index.types.length} types`);
    }
  }
}

module.exports = { generateSchemas };
