import { globSync } from 'glob'
import { parseMDXFile, MDXMetadata } from '../src/utils/mdx-parser.js'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MDXFrontmatter } from '../src/types.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateTypeDefinitions(metadataList: MDXMetadata[]): string {
  // Collect all unique types and their properties
  const typeDefinitions = new Map<string, Map<string, Set<string>>>();

  metadataList.forEach(metadata => {
    const type = metadata.type?.replace('https://mdx.org.ai/', '') || 'Unknown';
    if (!typeDefinitions.has(type)) {
      typeDefinitions.set(type, new Map());
    }

    const properties = typeDefinitions.get(type)!;
    Object.entries(metadata).forEach(([key, value]) => {
      if (!properties.has(key)) {
        properties.set(key, new Set());
      }
      properties.get(key)?.add(typeof value);
    });
  });

  // Generate interfaces for each type
  const interfaces = Array.from(typeDefinitions.entries())
    .filter(([type]) => type !== 'Unknown')
    .map(([type, properties]) => {
      const propertyDefinitions = Array.from(properties.entries())
        .map(([key, types]) => {
          const typeStr = Array.from(types).join(' | ') || 'any';
          // Handle JSON-LD properties
          if (key.startsWith('@')) {
            return `  ['${key}']?: ${typeStr};`;
          }
          // Handle $type property
          if (key === '$type') {
            return `  $type: 'https://mdx.org.ai/${type}';`;
          }
          // Handle other properties
          return `  ${key}?: ${typeStr};`;
        })
        .join('\n');

      return `
export interface ${type}Frontmatter extends MDXFrontmatter {
${propertyDefinitions}
}`;
    });

  return `import { MDXFrontmatter } from '../types.js';

${interfaces.join('\n')}

export type MDXType = ${interfaces.length > 0
  ? interfaces.map(i => i.match(/interface (\w+)/)![1]).join(' | ')
  : 'MDXFrontmatter'};
`;
}

function extractExamplesFromContent(content: string): string[] {
  const examples: string[] = [];
  const mdxCodeBlockRegex = /```mdx\n([\s\S]*?)```/g;
  let match;

  while ((match = mdxCodeBlockRegex.exec(content)) !== null) {
    examples.push(match[1].trim());
  }

  return examples;
}

function generateDocumentationExports(docs: { type: string; content: string; examples: string[] }[]): string {
  // Group documentation by type
  const typeMap = new Map<string, { content: string; examples: string[] }>();

  docs.forEach(doc => {
    const type = doc.type.replace('https://mdx.org.ai/', '');
    if (!typeMap.has(type)) {
      typeMap.set(type, { content: doc.content, examples: doc.examples });
    }
  });

  const exports = Array.from(typeMap.entries()).map(([type, doc]) => {
    const content = JSON.stringify(doc.content);
    const examples = JSON.stringify(doc.examples);
    return `export const ${type}_DOC = {
  content: ${content},
  examples: ${examples}
} as const;`;
  });

  return `// Auto-generated documentation exports
${exports.join('\n\n')}

export const documentation = {
  ${Array.from(typeMap.keys()).map(type => `${type}: ${type}_DOC`).join(',\n  ')}
} as const;

export const getDocumentationByType = (type: string): typeof documentation[keyof typeof documentation] | undefined => {
  const key = type.replace('https://mdx.org.ai/', '');
  return documentation[key as keyof typeof documentation];
};`;
}

async function generateTypes() {
  try {
    // Find all MDX files in content directories
    const mdxFiles = [
      ...globSync(join(__dirname, '../content/types/*.mdx')),
      ...globSync(join(__dirname, '../../../content/*.mdx')),
      ...globSync(join(__dirname, '../../../examples/*.mdx'))
    ];

    if (mdxFiles.length === 0) {
      console.warn('No MDX files found in content directories');
      return;
    }

    // Parse MDX files and extract metadata, content, and examples
    const parsedFiles = mdxFiles.map(file => {
      const { metadata, content } = parseMDXFile(file);
      const examples = extractExamplesFromContent(content);
      return {
        type: metadata.type || metadata['@type'] || 'Unknown',
        metadata,
        content,
        examples
      };
    });

    // Create generated directory if it doesn't exist
    const generatedDir = join(__dirname, '../src/generated');
    if (!existsSync(generatedDir)) {
      mkdirSync(generatedDir, { recursive: true });
    }

    // Generate type definitions
    const typeDefinitions = generateTypeDefinitions(parsedFiles.map(f => f.metadata));
    writeFileSync(
      join(generatedDir, 'types.ts'),
      typeDefinitions
    );

    // Generate documentation constants
    const documentationExports = generateDocumentationExports(
      parsedFiles.map(f => ({ type: f.type, content: f.content, examples: f.examples }))
    );
    writeFileSync(
      join(generatedDir, 'docs.ts'),
      documentationExports
    );

    console.log(`Successfully generated types and documentation from ${mdxFiles.length} MDX files`);
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();
