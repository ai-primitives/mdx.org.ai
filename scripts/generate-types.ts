#!/usr/bin/env node

const debug = true;
const log = (...args: any[]) => debug && console.log(...args);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  if (reason instanceof Error) {
    console.error('Error:', {
      name: reason.name,
      message: reason.message,
      stack: reason.stack
    });
  } else {
    console.error('Non-Error reason:', reason);
  }
  process.exit(1);
});

import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { glob } from 'glob';
import {
  parseMDXFile,
  type MDXParseResult,
  type ValidMDXParseResult,
  type MDXMetadata,
  isValidMetadata
} from '../packages/mdx-types/src/utils/mdx-parser.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TypeGenerationError extends Error {
  code?: string;
  stack?: string;
}

async function generateTypeDefinitions(files: ValidMDXParseResult[]): Promise<string> {
  try {
    log('Starting type definition generation...');

    const file = (metadata: MDXMetadata) => {
      log(`Processing type definition for ${metadata.$type}`);
      return `export interface ${metadata.$type}Frontmatter extends MDXFrontmatter {
  $type: '${metadata.$type}';
}`;
    };

    const interfaces = files.reduce((acc: string[], { metadata }) => {
      try {
        log(`Generating interface for type: ${metadata.$type}`);
        const type = metadata.$type.replace(/^https:\/\/mdx\.org\.ai\//, '');

        if (acc.some(i => i.includes(`interface ${type}Frontmatter`))) {
          log(`Skipping duplicate type: ${type}`);
          return acc;
        }

        const typeStr = file({ ...metadata, $type: type });
        log(`Generated interface: ${typeStr}`);
        return [...acc, typeStr];
      } catch (error) {
        console.error(`Error generating interface for ${metadata.$type}:`, error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error);
        return acc;
      }
    }, []);

    if (interfaces.length === 0) {
      throw new Error('No valid interfaces generated from MDX files');
    }

    const properties = [
      '$type: string;',
      'title: string;',
      'description: string;',
      '$context?: string;',
      '$id?: string;',
      '[key: string]: any;'
    ];

    const baseInterface = `export interface MDXFrontmatter {
  ${properties.join('\n  ')}
}`;

    log('Generated base interface and type definitions');
    return `// Generated by generate-types.ts
${baseInterface}

${interfaces.join('\n\n')}
`;
  } catch (error) {
    console.error('Error in generateTypeDefinitions:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error);
    throw error;
  }
}

function isValidParseResult(result: MDXParseResult | null): result is ValidMDXParseResult {
  if (!result) return false;
  const metadata = result.metadata;
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    typeof metadata.$type === 'string' &&
    typeof metadata.title === 'string' &&
    typeof metadata.description === 'string'
  );
}

async function main() {
  try {
    log('Starting type generation...');
    log('Current directory:', process.cwd());
    log('Script directory:', __dirname);

    const contentDirs = [
      'examples',
      'content',
      'package',
      'packages/mdx-types/content/types'
    ].map(dir => {
      const fullPath = join(__dirname, '..', dir);
      log(`Checking directory: ${fullPath}`);
      if (!existsSync(fullPath)) {
        log(`Warning: Directory ${fullPath} does not exist`);
        return null;
      }
      log(`Directory exists: ${fullPath}`);
      return fullPath;
    }).filter(Boolean) as string[];

    if (contentDirs.length === 0) {
      throw new Error('No valid content directories found');
    }

    log('Content directories:', contentDirs);

    const mdxFilesPromises = contentDirs.map(async dir => {
      try {
        log(`Searching for MDX files in ${dir}...`);
        const pattern = join(dir, '**/*.mdx');
        log(`Using glob pattern: ${pattern}`);
        const files = await glob(pattern);
        log(`Found ${files.length} files in ${dir}:`, files);
        return files;
      } catch (error) {
        console.error(`Error searching for MDX files in ${dir}:`, error);
        return [];
      }
    });

    const mdxFiles = await Promise.all(mdxFilesPromises).catch(error => {
      console.error('Error in Promise.all while searching for MDX files:', error);
      throw error;
    });

    const allMdxFiles = mdxFiles.flat();
    log(`Total MDX files found: ${allMdxFiles.length}`);

    if (allMdxFiles.length === 0) {
      throw new Error('No MDX files found in any content directory');
    }

    log('Processing files:', allMdxFiles);

    const parsePromises = allMdxFiles.map(async (filePath: string) => {
      try {
        log(`Parsing ${filePath}...`);
        const result = await parseMDXFile(filePath, true);
        if (!result || !result.metadata) {
          console.warn(`No valid metadata found in ${filePath}`);
          return null;
        }
        if (!isValidMetadata(result.metadata)) {
          console.warn(`Invalid metadata in ${filePath}:`, result.metadata);
          return null;
        }
        log(`Successfully parsed ${filePath}`);
        return result;
      } catch (error) {
        console.error(`Error parsing ${filePath}:`, error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error);
        return null;
      }
    });

    const parsedFiles = await Promise.all(parsePromises).catch(error => {
      console.error('Error in Promise.all while parsing files:', error);
      throw error;
    });

    const validParsedFiles = parsedFiles.filter(isValidParseResult);
    log(`Successfully parsed ${validParsedFiles.length} valid MDX files out of ${parsedFiles.length} total files`);

    if (validParsedFiles.length === 0) {
      throw new Error('No valid MDX files found after parsing');
    }

    try {
      const validFiles = validParsedFiles.map((file: ValidMDXParseResult) => ({
        ...file,
        metadata: {
          ...file.metadata,
          $type: file.metadata.$type.replace(/^https:\/\/mdx\.org\.ai\//, '')
        }
      }));

      log('Generating type definitions for files:', validFiles);
      const typeDefinitions = await generateTypeDefinitions(validFiles);

      const generatedDir = join(__dirname, '../packages/mdx-types/src/generated');
      log(`Creating generated directory: ${generatedDir}`);
      await mkdir(generatedDir, { recursive: true }).catch((error: TypeGenerationError) => {
        console.error('Error creating generated directory:', error);
        throw error;
      });

      const outputPath = join(generatedDir, 'frontmatter.d.ts');
      log(`Writing type definitions to: ${outputPath}`);
      await writeFile(outputPath, typeDefinitions, 'utf-8').catch((error: TypeGenerationError) => {
        console.error('Error writing type definitions:', error);
        throw error;
      });

      log('Successfully generated type definitions at:', outputPath);
    } catch (error) {
      console.error('Error in type generation:', error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error);
      throw error;
    }
  } catch (error) {
    console.error('Error in main function:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error in main:');
  if (error instanceof Error) {
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  } else {
    console.error('Non-Error object thrown:', JSON.stringify(error, null, 2));
  }
  process.exit(1);
});
