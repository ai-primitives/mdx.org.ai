/**
 * MDX.org.ai TypeScript Types Package
 * Provides TypeScript types and documentation for MDX.org.ai file types
 */

// Import types and utilities
import type { MDXMetadata } from './utils/mdx-parser.js';
import { validateMDXType } from './utils/validation.js';

// Export base types and interfaces
export * from './types.js';
export * from './generated/types.js';

// Export MDX type interfaces
export * from './mdx-types/index.js';

// Export documentation strings and helpers
export * from './generated/docs.js';

// Export MDX parser utilities
export { MDXMetadata, parseMDXFile } from './utils/mdx-parser.js';

// Export validation utilities
export { validateMDXType, validateJSONLD, validateMDX } from './utils/validation.js';

// Utility functions for MDX type generation
export const generateMDXType = (type: string): string => {
  const metadata: MDXMetadata = {
    type: `https://mdx.org.ai/${type}`,
    context: 'https://mdx.org.ai'
  };

  if (!validateMDXType(metadata)) {
    throw new Error(`Invalid MDX type: ${type}`);
  }
  return `---\n$type: https://mdx.org.ai/${type}\n---\n`;
};
