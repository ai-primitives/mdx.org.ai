#!/usr/bin/env node

process.on('unhandledRejection', (error: unknown) => {
  console.error('UnhandledPromiseRejection:', error);
  process.exit(1);
});

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { globSync } from 'glob';
import { parseMDXFile, type MDXParseResult } from '../packages/mdx-types/src/utils/mdx-parser.js';
import { promises as fs, existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MDXMetadata {
  $type: string;
  title: string;
  description: string;
  $context?: string;
  $id?: string;
  [key: string]: any;
}

function generateTypeDefinitions(metadataList: MDXMetadata[]): string {
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

async function main() {
  try {
    console.log('Starting type generation process...');
    const contentDirs = [
      join(__dirname, '../packages/mdx-types/content/types'),
      join(__dirname, '../content'),
      join(__dirname, '../examples')
    ];

    console.log('Searching for MDX files in directories:');
    contentDirs.forEach(dir => console.log(`- ${dir}`));

    console.log('\nCollecting MDX files...');
    const mdxFiles = await Promise.all(contentDirs.map(async (dir) => {
      if (existsSync(dir)) {
        try {
          console.log(`Searching directory: ${dir}`);
          const dirFiles = globSync(join(dir, '*.mdx'));
          console.log(`Found ${dirFiles.length} MDX files in ${dir}`);
          return dirFiles;
        } catch (error) {
          console.error(`Error searching directory ${dir}:`, error);
          return [];
        }
      }
      console.warn(`Directory not found: ${dir}`);
      return [];
    })).then(files => {
      const flatFiles = files.flat();
      console.log(`Total MDX files found: ${flatFiles.length}`);
      return flatFiles;
    });

    if (mdxFiles.length === 0) {
      throw new Error('No MDX files found in any content directories');
    }

    console.log('\nProcessing MDX files...');
    const parsedFiles = await Promise.all(mdxFiles.map(async (filePath: string) => {
      try {
        console.log(`Parsing ${filePath}...`);
        const result = await parseMDXFile(filePath);
        console.log(`Successfully parsed ${filePath}`);
        if (!result.metadata.$type || !result.metadata.title || !result.metadata.description) {
          console.warn(`Warning: File ${filePath} is missing required frontmatter fields ($type, title, description)`);
        }
        return result;
      } catch (error) {
        console.error(`Error parsing file ${filePath}:`, error);
        return null;
      }
    })).then((files: (MDXParseResult | null)[]) => {
      const validFiles = files.filter((file): file is MDXParseResult => file !== null);
      console.log(`Successfully parsed ${validFiles.length} out of ${files.length} files`);
      return validFiles;
    });

    if (parsedFiles.length === 0) {
      throw new Error('No valid MDX files could be parsed');
    }

    console.log('\nGenerating type definitions...');
    const generatedDir = join(__dirname, '../packages/mdx-types/src/generated');
    if (!existsSync(generatedDir)) {
      console.log(`Creating generated types directory: ${generatedDir}`);
      mkdirSync(generatedDir, { recursive: true });
    }

    const typeDefinitions = generateTypeDefinitions(parsedFiles.map((f: MDXParseResult) => f.metadata));
    const typesPath = join(generatedDir, 'types.ts');
    console.log(`\nWriting generated types to ${typesPath}`);
    await fs.writeFile(typesPath, typeDefinitions);

    console.log(`\nSuccessfully generated types from ${parsedFiles.length} MDX files`);
    console.log('Generated types directory:', generatedDir);
  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('\nError generating types:', {
      message: errorObj?.message || 'Unknown error occurred',
      stack: errorObj?.stack || 'No stack trace available',
      details: error instanceof Error
        ? JSON.stringify(error, Object.getOwnPropertyNames(error))
        : JSON.stringify(error)
    });
    process.exit(1);
  }
}

(async () => {
  try {
    await main();
  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Fatal error:', {
      message: errorObj?.message || 'Unknown error occurred',
      stack: errorObj?.stack || 'No stack trace available',
      details: error instanceof Error
        ? JSON.stringify(error, Object.getOwnPropertyNames(error))
        : JSON.stringify(error)
    });
    process.exit(1);
  }
})();
