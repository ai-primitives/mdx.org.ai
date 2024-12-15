import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { globSync } from 'glob';
import { parseMDXFile } from '../packages/mdx-types/src/utils/mdx-parser.js';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateTypeDefinitions(metadataList: any[]): string {
  const typeDefinitions = new Map<string, Map<string, Set<any>>>();

  metadataList.forEach(metadata => {
    const type = metadata.$type?.replace('https://mdx.org.ai/', '') || 'Unknown';
    if (!typeDefinitions.has(type)) {
      typeDefinitions.set(type, new Map());
    }

    const properties = typeDefinitions.get(type)!;
    Object.entries(metadata).forEach(([key, value]) => {
      if (!properties.has(key)) {
        properties.set(key, new Set());
      }
      properties.get(key)?.add(value);
    });
  });

  const interfaces = Array.from(typeDefinitions.entries())
    .filter(([type]) => type !== 'Unknown')
    .map(([type, properties]) => {
      const propertyDefinitions = Array.from(properties.entries())
        .map(([key, values]) => {
          const valueArray = Array.from(values);
          let typeStr: string;

          if (key === '$type') {
            return `  $type: 'https://mdx.org.ai/${type}';`;
          }

          if (valueArray.length === 1) {
            const value = valueArray[0];
            if (typeof value === 'string' && value.startsWith('https://')) {
              typeStr = `'${value}'`;
            } else if (Array.isArray(value)) {
              typeStr = `${typeof value[0]}[]`;
            } else {
              typeStr = typeof value;
            }
          } else {
            typeStr = valueArray
              .map(v => typeof v === 'string' && v.startsWith('https://') ? `'${v}'` : typeof v)
              .join(' | ');
          }

          const isRequired = key === 'title' || key === 'description';
          return `  ${key}${isRequired ? '' : '?'}: ${typeStr};`;
        })
        .join('\n');

      return `
export interface ${type}Frontmatter {
  $type: 'https://mdx.org.ai/${type}';
  title: string;
  description: string;
  $context?: 'https://schema.org' | 'https://mdx.org.ai';
  $id?: string;
${propertyDefinitions}
}`;
    });

  return `// Generated types for MDX frontmatter
${interfaces.join('\n\n')}

export type MDXType = ${interfaces.length > 0
    ? interfaces.map(i => i.match(/interface (\w+)/)![1]).join(' | ')
    : 'never'};
`;
}

// Execute type generation for the main project
async function main() {
  try {
    const contentDirs = [
      join(__dirname, '../packages/mdx-types/content/types'),
      join(__dirname, '../content'),
      join(__dirname, '../examples')
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
        return { metadata, content };
      } catch (error) {
        console.error(`Error parsing file ${file}:`, error);
        return null;
      }
    }).filter((file): file is NonNullable<typeof file> => file !== null);

    if (parsedFiles.length === 0) {
      console.error('No valid MDX files could be parsed');
      process.exit(1);
    }

    const generatedDir = join(__dirname, '../packages/mdx-types/src/generated');
    if (!existsSync(generatedDir)) {
      mkdirSync(generatedDir, { recursive: true });
    }

    const typeDefinitions = generateTypeDefinitions(parsedFiles.map(f => f.metadata));
    writeFileSync(
      join(generatedDir, 'types.ts'),
      typeDefinitions
    );

    console.log(`Successfully generated types from ${parsedFiles.length} MDX files`);
    console.log('Generated types directory:', generatedDir);
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.url === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Failed to generate types:', {
      message: error.message,
      stack: error.stack,
      details: JSON.stringify(error, null, 2)
    });
    process.exit(1);
  });
}
