import type { MDXMetadata } from './mdx-parser.js';

/**
 * Validates MDX type format and required properties
 * Supports both $type and @type syntax in frontmatter
 * Ensures JSON-LD compatibility
 */
export function validateMDXType(metadata: MDXMetadata): boolean {
  // Validate type exists
  if (!metadata.type) {
    return false;
  }

  // Validate type format (URL or shorthand)
  const typePattern = /^(https:\/\/mdx\.org\.ai\/)?[A-Z][a-zA-Z]+$/;
  const type = metadata.type.replace('https://mdx.org.ai/', '');
  if (!typePattern.test(metadata.type) && !typePattern.test(`https://mdx.org.ai/${type}`)) {
    return false;
  }

  // Validate context if provided
  if (metadata.context && typeof metadata.context !== 'string') {
    return false;
  }

  // Validate id if provided
  if (metadata.id && typeof metadata.id !== 'string') {
    return false;
  }

  // List of valid MDX types
  const validTypes = [
    'AI', 'API', 'Agent', 'App', 'Assistant', 'Blog', 'BlogPost',
    'Code', 'Component', 'Content', 'Data', 'Directory', 'Eval',
    'Function', 'Package', 'Product', 'Prompt', 'Startup',
    'StateMachine', 'Tool', 'UI', 'WebPage', 'Worker', 'Workflow'
  ];

  // Check if type is valid
  return validTypes.includes(type);
}

/**
 * Validates JSON-LD compatibility of MDX metadata
 */
export function validateJSONLD(metadata: MDXMetadata): boolean {
  // Check required JSON-LD properties
  if (metadata.context && !metadata.context.startsWith('https://')) {
    return false;
  }

  // Validate id format if present
  if (metadata.id && !metadata.id.startsWith('https://')) {
    return false;
  }

  return true;
}

/**
 * Comprehensive MDX validation including type and JSON-LD compatibility
 */
export function validateMDX(metadata: MDXMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateMDXType(metadata)) {
    errors.push('Invalid MDX type');
  }

  if (!validateJSONLD(metadata)) {
    errors.push('Invalid JSON-LD format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
