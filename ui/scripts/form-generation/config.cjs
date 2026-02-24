/**
 * Form Generation Configuration
 * 
 * This file contains user-maintained configuration for the form schema generator.
 * Update these mappings as your schema evolves to control which types appear in the UI.
 */

module.exports = {
  /**
   * Path to the main config schema file (relative to this file)
   */
  SCHEMA_PATH: '../../../schema/config.json',

  /**
   * Output directory for generated schemas (relative to this file)
   */
  OUTPUT_DIR: '../../schema-forms',

  /**
   * Category mappings that define how types are organized in the UI.
   * 
   * Each category corresponds to a section in the UI where users can create/manage configurations.
   * The generator will automatically discover types based on naming patterns.
   * 
   * Configuration options:
   * - name: Display name for this category
   * - description: Brief description of what this category contains
   * - topLevelKey: (Optional) The key in the root schema for this category
   * - itemType: (Optional) The primary type definition for items in this category
   * - typePatterns: Array of strings to match against type names (e.g., ['Policy'] matches 'LocalPolicy', 'JWTPolicy')
   * - exclude: Array of type names to explicitly exclude from this category
   */
  CATEGORY_MAPPINGS: {
    policies: {
      name: 'Policies',
      description: 'Security, traffic management, and transformation rules',
      topLevelKey: 'policies',
      itemType: 'LocalPolicy',
      // Look for types containing these patterns
      typePatterns: ['Policy', 'Policies'],
      // Types to exclude (too generic or internal)
      exclude: ['FilterOrPolicy'],
    },
    listeners: {
      name: 'Listeners',
      description: 'Port bindings and protocol listeners',
      topLevelKey: 'binds',
      itemType: 'LocalBind',
      typePatterns: ['Listener', 'Bind'],
      exclude: [],
    },
    routes: {
      name: 'Routes',
      description: 'HTTP and TCP routing configurations',
      // Routes are nested in listeners
      typePatterns: ['Route'],
      exclude: [],
    },
    backends: {
      name: 'Backends',
      description: 'Backend service connections',
      topLevelKey: 'backends',
      itemType: 'FullLocalBackend',
      typePatterns: ['Backend'],
      exclude: [],
    },
  },
};
