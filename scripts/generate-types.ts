#!/usr/bin/env node

// Set up global error handlers with detailed logging
process.on('uncaughtException', (error) => {
  console.error('[Fatal Error] Uncaught Exception:', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    type: error instanceof Error ? error.constructor.name : typeof error
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Fatal Error] Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? {
      name: reason.name,
      message: reason.message,
      stack: reason.stack
    } : reason,
    type: reason instanceof Error ? reason.constructor.name : typeof reason,
    promise
  });
  process.exit(1);
});

import { promises as fsPromises, constants as fsConstants } from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'yaml';
import type { Root } from 'remark-parse';

// Type definitions
interface MDXMetadata {
  $type: string;
  title: string;
  description: string;
  [key: string]: unknown;
}

interface MDXParseResult {
  metadata: MDXMetadata | null;
  content: string;
  examples: string[];
}

interface ValidMDXParseResult {
  metadata: MDXMetadata;
  content: string;
  examples: string[];
}

interface TypeGenerationError extends Error {
  code?: string;
  stack?: string;
}

// Unified and remark types
interface Node {
  type: string;
  value?: string;
  [key: string]: unknown;
}

interface VFile {
  path: string;
  value: string;
}

interface UnifiedProcessor {
  use: (plugin: unknown, options?: unknown) => UnifiedProcessor;
  parse: (file: VFile) => Promise<Root>;
}

// Logging function
function log(message: string, error?: Error | unknown): void {
  if (error) {
    console.error(`[Error] ${message}:`, error);
  } else {
    console.log(`[Info] ${message}`);
  }
}

async function initializeParser() {
  const [
    { unified },
    { default: remarkParse },
    { default: remarkMDX },
    { default: remarkFrontmatter }
  ] = await Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-mdx'),
    import('remark-frontmatter')
  ]);

  return {
    unified,
    remarkParse,
    remarkMDX,
    remarkFrontmatter
  };
}

async function generateTypeDefinitions(files: readonly ValidMDXParseResult[]): Promise<string | null> {
  try {
    log('Starting type definition generation...');

    if (!Array.isArray(files) || files.length === 0) {
      log('Invalid input: files is not an array or is empty');
      return null;
    }

    const baseInterface = `export interface MDXFrontmatter {
  $type: string;
  title: string;
  description: string;
  [key: string]: unknown;
}`;

    const usedTypes = new Set<string>();
    const propertyDefinitions = await Promise.all(
      files.map(async (file) => {
        try {
          const { metadata } = file;
          if (!metadata || !metadata.$type) {
            log(`Invalid metadata in file: missing $type`);
            return null;
          }

          const type = metadata.$type.replace(/-/g, '_');
          if (usedTypes.has(type)) {
            log(`Skipping duplicate type: ${type}`);
            return null;
          }

          usedTypes.add(type);
          return `export interface ${type}Frontmatter extends MDXFrontmatter {
  $type: '${metadata.$type}';
}`;
        } catch (error) {
          log(`Failed to process file metadata`, error);
          return null;
        }
      })
    );

    const validDefinitions = propertyDefinitions.filter((def): def is string => def !== null);
    if (validDefinitions.length === 0) {
      log('No valid type definitions generated');
      return null;
    }

    return `${baseInterface}\n\n${validDefinitions.join('\n\n')}`;
  } catch (error) {
    log('Failed to generate type definitions', error);
    return null;
  }
}

function isValidParseResult(result: MDXParseResult | null): result is ValidMDXParseResult {
  if (!result) return false;
  const { metadata } = result;
  return (
    metadata !== null &&
    typeof metadata === 'object' &&
    typeof metadata.$type === 'string' &&
    typeof metadata.title === 'string' &&
    typeof metadata.description === 'string'
  );
}

async function main(): Promise<void> {
  try {
    log('=== Starting MDX Type Generation ===');

    const parser = await initializeParser();
    const { unified, remarkParse, remarkMDX, remarkFrontmatter } = parser;

    const contentDirs = [
      'content',
      'content/packages',
      'examples',
      'package'
    ];

    const mdxFilesPromises = contentDirs.map(async (dir) => {
      const pattern = path.join(process.cwd(), dir, '**/*.mdx');
      try {
        const files = await glob(pattern).catch((error: Error) => {
          log(`Failed to glob pattern ${pattern}`, error);
          return [];
        });

        log(`Found ${files.length} MDX files in ${dir}`);

        const validFiles = await Promise.all(
          files.map(async (file: string) => {
            try {
              await fsPromises.access(file, fsConstants.R_OK);
              log(`File ${file} is readable`);
              return file;
            } catch (error) {
              log(`File ${file} is not readable`, error);
              return null;
            }
          })
        );

        return validFiles.filter((file): file is string => file !== null);
      } catch (error) {
        log(`Failed to process directory ${dir}`, error);
        return [];
      }
    });

    const mdxFiles = (await Promise.all(mdxFilesPromises)).flat();
    log(`Processing ${mdxFiles.length} total MDX files`);

    const parsePromises = mdxFiles.map(async (absolutePath) => {
      try {
        const content = await fsPromises.readFile(absolutePath, 'utf-8');
        const processor = unified()
          .use(remarkParse)
          .use(remarkMDX)
          .use(remarkFrontmatter, ['yaml']) as unknown as UnifiedProcessor;

        const ast = await processor.parse({ path: absolutePath, value: content });
        let frontmatter: Record<string, unknown> = {};

        // Find YAML nodes in the AST
        const visit = (node: Node, callback: (node: Node) => void) => {
          if (node.type === 'yaml' && typeof node.value === 'string') {
            callback(node);
          }
          for (const key in node) {
            const value = node[key];
            if (Array.isArray(value)) {
              value.forEach(child => {
                if (child && typeof child === 'object') {
                  visit(child as Node, callback);
                }
              });
            } else if (value && typeof value === 'object') {
              visit(value as Node, callback);
            }
          }
        };

        visit(ast, (node) => {
          try {
            frontmatter = yaml.parse(node.value || '') || {};
          } catch (error) {
            log(`Failed to parse YAML in ${absolutePath}`, error);
          }
        });

        const result: MDXParseResult = {
          metadata: frontmatter as MDXMetadata | null,
          content: content,
          examples: []
        };

        return result;
      } catch (error) {
        log(`Failed to parse MDX file ${absolutePath}`, error);
        return null;
      }
    });

    const parsedFiles = (await Promise.all(parsePromises)).filter((result): result is MDXParseResult => result !== null);
    log(`Successfully parsed ${parsedFiles.length} MDX files`);

    const validFiles = parsedFiles.filter(isValidParseResult);
    log(`Found ${validFiles.length} valid MDX files`);

    const typeDefinitions = await generateTypeDefinitions(validFiles);
    if (!typeDefinitions) {
      throw new Error('Failed to generate type definitions');
    }

    const outputDir = path.join(process.cwd(), 'packages/mdx-types/src/generated');
    await fsPromises.mkdir(outputDir, { recursive: true });

    const outputFile = path.join(outputDir, 'frontmatter.d.ts');
    await fsPromises.writeFile(outputFile, typeDefinitions, 'utf-8');

    log(`Successfully generated type definitions at ${outputFile}`);
  } catch (error: unknown) {
    console.error('[Fatal Error] Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error: unknown) => {
  console.error('[Fatal Error] Unhandled error in main:', error);
  process.exit(1);
});
