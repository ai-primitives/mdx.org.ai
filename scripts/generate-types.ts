#!/usr/bin/env node

process.on('unhandledRejection', (error: unknown) => {
  console.error('UnhandledPromiseRejection:', error);
  process.exit(1);
});

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { globSync } from 'glob';
import { parseMDXFile, type MDXParseResult, type MDXMetadata } from '../packages/mdx-types/src/utils/mdx-parser.js';
import { promises as fs, existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateTypeDefinitions(metadataList: MDXMetadata[]): string {
  const uniqueTypes = new Set(metadataList.map(m => m.$type).filter(Boolean));

  const interfaces = Array.from(uniqueTypes).map(type => {
    const typeMetadata = metadataList.find(m => m.$type === type);
    if (!typeMetadata) return '';

    const propertyDefinitions = Object.entries(typeMetadata)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => {
        const isOptional = metadataList.some(m => m.$type === type && !(key in m));
        const typeStr = typeof value === 'string' ? 'string'
          : typeof value === 'number' ? 'number'
          : typeof value === 'boolean' ? 'boolean'
          : Array.isArray(value) ? 'any[]'
          : 'any';

        return `  ${key}${isOptional ? '?' : ''}: ${typeStr};`;
      })
      .join('\n');

    return `
export interface ${type}MDX {
${propertyDefinitions}
}`;
  });

  return `// Auto-generated type definitions
// DO NOT EDIT DIRECTLY

${interfaces.join('\n')}

export type MDXType = ${Array.from(uniqueTypes).map(type => `'${type}'`).join(' | ')};

export interface MDXFrontmatter {
  $type: MDXType;
  title: string;
  description: string;
  $context?: string;
  $id?: string;
  [key: string]: any;
}
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
