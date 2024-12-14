/**
 * MDX.org.ai TypeScript Types Package
 * Provides TypeScript types and documentation for MDX.org.ai file types
 */

// Export base types
export * from './types';

// Export MDX type interfaces
export * from './mdx-types';

// Export documentation strings
export * from './docs';

// Utility functions (placeholders for future implementation)
export const validateMDXType = (type: string): boolean => {
  const validTypes = [
    'AI', 'API', 'Agent', 'App', 'Assistant', 'Blog', 'BlogPost',
    'Code', 'Component', 'Content', 'Data', 'Directory', 'Eval',
    'Function', 'Package', 'Product', 'Prompt', 'Startup',
    'StateMachine', 'Tool', 'UI', 'WebPage', 'Worker', 'Workflow'
  ];
  return validTypes.includes(type.replace('https://mdx.org.ai/', ''));
};

export const parseMDXFrontmatter = (content: string) => {
  // TODO: Implement frontmatter parsing
  return {};
};

export const generateMDXType = (type: string) => {
  // TODO: Implement MDX type generation
  return `---\n$type: https://mdx.org.ai/${type}\n---\n`;
};
