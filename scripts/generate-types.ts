#!/usr/bin/env node

const debug = true;
const log = (...args: any[]) => debug && console.log(...args);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { globSync } from 'glob';
import { parseMDXFile, type MDXParseResult, type MDXMetadata, isValidMetadata } from '../packages/mdx-types/src/utils/mdx-parser.js';
import { promises as fs, existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

log('Starting type generation script...');
log('Current directory:', __dirname);

function generateTypeDefinitions(metadataList: ValidMDXParseResult['metadata'][]): string {
  const normalizeType = (type: string) => type.replace(/^https:\/\/mdx\.org\.ai\//, '');

  const uniqueTypes = new Set(
    metadataList
      .map(m => normalizeType(m.$type))
      .filter(Boolean)
  );

  const interfaces = Array.from(uniqueTypes).map(type => {
    const typeMetadata = metadataList.find(m => normalizeType(m.$type) === type);
    if (!typeMetadata) return '';

    const propertyDefinitions = Object.entries(typeMetadata)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => {
        const isOptional = metadataList.some(m => normalizeType(m.$type) === type && !(key in m));
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

interface ValidMDXParseResult {
  metadata: {
    $type: string;
    title: string;
    description: string;
    $context?: string;
    $id?: string;
    [key: string]: any;
  };
  content: string;
  examples: string[];
}

function isValidParseResult(file: MDXParseResult | null): file is ValidMDXParseResult {
  return file !== null && file.metadata !== null && isValidMetadata(file.metadata);
}

async function main() {
  try {
    log('Starting main function...');

    const contentDirs = [
      join(__dirname, '../examples'),
      join(__dirname, '../content'),
      join(__dirname, '../package'),
      join(__dirname, '../packages/mdx-types/content/types')
    ];

    log('Content directories to process:', contentDirs);

    for (const dir of contentDirs) {
      try {
        if (!existsSync(dir)) {
          log(`Warning: Directory does not exist: ${dir}`);
          continue;
        }
        await fs.access(dir);
        log(`Directory verified: ${dir}`);
      } catch (error) {
        console.error(`Error accessing directory ${dir}:`, error);
      }
    }

    const mdxFiles = contentDirs.flatMap(dir => {
      try {
        if (!existsSync(dir)) {
          log(`Skipping non-existent directory: ${dir}`);
          return [];
        }
        const files = globSync('**/*.mdx', {
          cwd: dir,
          absolute: true
        });
        log(`Found ${files.length} MDX files in ${dir}`);
        return files;
      } catch (error) {
        console.error(`Error finding MDX files in ${dir}:`, error);
        return [];
      }
    });

    if (mdxFiles.length === 0) {
      log('No MDX files found in any of the content directories');
      process.exit(0);
    }

    log(`Total MDX files found: ${mdxFiles.length}`);
    log('MDX files:', mdxFiles);

    const parsedFiles = await Promise.all(
      mdxFiles.map(async (file) => {
        try {
          log(`Parsing file: ${file}`);
          const result = await parseMDXFile(file);
          log(`Successfully parsed ${file}`);
          return result;
        } catch (error) {
          console.error(`Error parsing ${file}:`, error);
          return null;
        }
      })
    ).catch(error => {
      console.error('Error in Promise.all while parsing files:', error);
      throw error;
    });

    const validParsedFiles = parsedFiles
      .filter((file: MDXParseResult | null): file is NonNullable<typeof file> => {
        if (!file) {
          log('Skipping null file result');
          return false;
        }
        if (!file.metadata) {
          log('Skipping file with null metadata');
          return false;
        }
        if (!isValidMetadata(file.metadata)) {
          log('Skipping file with invalid metadata structure');
          return false;
        }
        return true;
      }) as ValidMDXParseResult[];

    if (validParsedFiles.length === 0) {
      log('No valid MDX files were successfully parsed');
      process.exit(0);
    }

    log(`Successfully parsed ${validParsedFiles.length} MDX files`);

    try {
      const metadataList = validParsedFiles.map(file => ({
        ...file.metadata,
        $type: file.metadata.$type.replace(/^https:\/\/mdx\.org\.ai\//, '')
      }));

      const typeDefinitions = generateTypeDefinitions(metadataList);

      const generatedDir = join(__dirname, '../packages/mdx-types/src/generated');
      if (!existsSync(generatedDir)) {
        log(`Creating generated types directory: ${generatedDir}`);
        mkdirSync(generatedDir, { recursive: true });
      }

      const outputFile = join(generatedDir, 'types.ts');
      await fs.writeFile(outputFile, typeDefinitions);
      log(`Successfully wrote type definitions to ${outputFile}`);
    } catch (error) {
      console.error('Error generating type definitions:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in main function:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error in main:', error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});
