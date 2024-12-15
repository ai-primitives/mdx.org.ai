#!/usr/bin/env node

// Enable detailed logging
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
import { parseMDXFile } from '../packages/mdx-types/src/utils/mdx-parser.js';
import type { MDXParseResult, MDXMetadata } from '../packages/mdx-types/src/utils/mdx-parser.js';
import { promises as fs, existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

log('Starting type generation script...');
log('Current directory:', __dirname);

function generateTypeDefinitions(metadataList: MDXMetadata[]): string {
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

interface ValidMDXParseResult extends MDXParseResult {
  metadata: {
    $type: string;
    title: string;
    description: string;
    [key: string]: unknown;
  };
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

    // Verify directories exist
    for (const dir of contentDirs) {
      if (!existsSync(dir)) {
        log(`Warning: Directory does not exist: ${dir}`);
      }
    }

    // Find all MDX files
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
      throw new Error('No MDX files found in any of the content directories');
    }

    log(`Total MDX files found: ${mdxFiles.length}`);
    log('MDX files:', mdxFiles);

    // Parse all MDX files
    const parsedFiles = await Promise.all(
      mdxFiles.map(async (file) => {
        try {
          log(`Parsing file: ${file}`);
          const content = await fs.readFile(file, 'utf-8');
          log(`File content length: ${content.length} bytes`);
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
      return [];
    });

    const validParsedFiles = parsedFiles.filter((file): file is ValidMDXParseResult => {
      if (!file) return false;
      if (!file.metadata) return false;

      const metadata = file.metadata;
      const hasRequiredFields =
        typeof metadata.$type === 'string' &&
        typeof metadata.title === 'string' &&
        typeof metadata.description === 'string';

      if (!hasRequiredFields) {
        log(`Invalid metadata in file: missing required fields`);
        return false;
      }
      return true;
    });

    if (validParsedFiles.length === 0) {
      throw new Error('No valid MDX files were successfully parsed');
    }

    log(`Successfully parsed ${validParsedFiles.length} MDX files`);

    // Generate type definitions
    const metadataList = validParsedFiles.map(file => {
      const metadata = file.metadata;
      // Create a new object with validated fields
      return {
        ...metadata,
        $type: metadata.$type.replace(/^https:\/\/mdx\.org\.ai\//, ''),
        title: metadata.title,
        description: metadata.description
      };
    });
    const typeDefinitions = generateTypeDefinitions(metadataList);

    // Ensure the generated directory exists
    const generatedDir = join(__dirname, '../packages/mdx-types/src/generated');
    if (!existsSync(generatedDir)) {
      log(`Creating generated types directory: ${generatedDir}`);
      mkdirSync(generatedDir, { recursive: true });
    }

    // Write the generated types
    const outputFile = join(generatedDir, 'types.ts');
    await fs.writeFile(outputFile, typeDefinitions);
    log(`Successfully wrote type definitions to ${outputFile}`);

  } catch (error) {
    console.error('Error in main function:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Execute main function with proper error handling
main().catch(error => {
  console.error('Unhandled error in main:', error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});
