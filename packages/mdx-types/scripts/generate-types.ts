import { globSync } from 'glob'
import { parseMDXFile, MDXMetadata } from '../src/utils/mdx-parser.js'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MDXFrontmatter } from '../src/types.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateTypeDefinitions(metadataList: MDXMetadata[]): string {
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

  const interfaces = Array.from(typeDefinitions.entries())
    .filter(([type]) => type !== 'Unknown')
    .map(([type, properties]) => {
      const propertyDefinitions = Array.from(properties.entries())
        .map(([key, types]) => {
          const typeStr = Array.from(types).join(' | ') || 'any';
          if (key.startsWith('@')) {
            return `  ['${key}']?: ${typeStr};`;
          }
          if (key === '$type') {
            return `  $type: 'https://mdx.org.ai/${type}';`;
          }
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

  return `${exports.join('\n\n')}

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
    const contentDirs = [
      join(__dirname, '../content/types'),
      join(__dirname, '../../../content'),
      join(__dirname, '../../../examples')
    ];

    const mdxFiles = contentDirs.reduce((files: string[], dir) => {
      if (existsSync(dir)) {
        const dirFiles = globSync(join(dir, '*.mdx'));
        return [...files, ...dirFiles];
      }
      console.warn(`Directory not found: ${dir}`);
      return files;
    }, []);

    if (mdxFiles.length === 0) {
      console.error('No MDX files found in any content directories');
      process.exit(1);
    }

    console.log(`Found ${mdxFiles.length} MDX files`);

    const parsedFiles = mdxFiles.map(file => {
      try {
        const { metadata, content } = parseMDXFile(file);
        const examples = extractExamplesFromContent(content);
        return {
          type: metadata.type || metadata['@type'] || 'Unknown',
          metadata,
          content,
          examples
        };
      } catch (error) {
        console.error(`Error parsing file ${file}:`, error);
        return null;
      }
    }).filter((file): file is NonNullable<typeof file> => file !== null);

    if (parsedFiles.length === 0) {
      console.error('No valid MDX files could be parsed');
      process.exit(1);
    }

    const generatedDir = join(__dirname, '../src/generated');
    if (!existsSync(generatedDir)) {
      mkdirSync(generatedDir, { recursive: true });
    }

    const typeDefinitions = generateTypeDefinitions(parsedFiles.map(f => f.metadata));
    writeFileSync(
      join(generatedDir, 'types.ts'),
      typeDefinitions
    );

    const documentationExports = generateDocumentationExports(
      parsedFiles.map(f => ({ type: f.type, content: f.content, examples: f.examples }))
    );
    writeFileSync(
      join(generatedDir, 'docs.ts'),
      documentationExports
    );

    console.log(`Successfully generated types and documentation from ${parsedFiles.length} MDX files`);
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

// Execute the async function with proper error handling
generateTypes().catch(error => {
  console.error('Failed to generate types:', {
    message: error.message,
    stack: error.stack,
    details: JSON.stringify(error, null, 2)
  });
  process.exit(1);
});
