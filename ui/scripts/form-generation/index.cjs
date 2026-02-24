#!/usr/bin/env node

/**
 * Form Schema Generator Entry Point
 * 
 * This script orchestrates the form schema generation process by loading
 * configuration and invoking the generator.
 * 
 * Usage: node index.cjs
 */

const config = require('./config.cjs');
const { generateSchemas } = require('./generator.cjs');

// Run the generator with the loaded configuration
try {
  generateSchemas(config);
} catch (error) {
  console.error('Error generating schemas:', error);
  process.exit(1);
}
