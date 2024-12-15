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

import { join, resolve, isAbsolute, dirname } from 'path';
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
import { promises as fsPromises } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TypeGenerationError extends Error {
  code?: string;
  stack?: string;
}

const debug = true;
const log = (...args: any[]) => debug && console.log(...args);

async function generateTypeDefinitions(files: ValidMDXParseResult[]): Promise<string | null> {
  try {
    console.log('[Debug] Starting type definition generation...');

    // Input validation
    if (!Array.isArray(files)) {
      console.error('[Error] Invalid input: files is not an array');
      return null;
    }

    if (files.length === 0) {
      console.error('[Error] Invalid input: empty files array');
      return null;
    }

    // Base interface definition
    const baseInterface = `export interface MDXFrontmatter {
  $type: string;
  title: string;
  description: string;
  $context?: string;
  $id?: string;
  [key: string]: any;
}\n\n`;

    console.log('[Debug] Generating property definitions...');

    // Generate property definitions with better error handling
    const propertyDefinitions = await Promise.all(
      files.map(async (file) => {
        try {
          if (!file || !file.metadata) {
            console.warn('[Warning] Invalid file or metadata:', JSON.stringify(file, null, 2));
            return null;
          }

          const type = file.metadata.$type?.replace(/^https:\/\/mdx\.org\.ai\//, '');
          if (!type) {
            console.warn('[Warning] Missing or invalid $type in file:', JSON.stringify(file.metadata, null, 2));
            return null;
          }

          return `export interface ${type}Frontmatter extends MDXFrontmatter {
  $type: '${type}';
}`;
        } catch (error) {
          console.error('[Type Generation Error] Error processing file:', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error,
            file: JSON.stringify(file, null, 2)
          });
          return null;
        }
      })
    );

    // Filter out null values and join definitions
    const validDefinitions = propertyDefinitions.filter((def): def is string => def !== null);

    if (validDefinitions.length === 0) {
      console.error('[Error] No valid type definitions generated');
      return null;
    }

    console.log(`[Success] Generated ${validDefinitions.length} type definitions`);
    return baseInterface + validDefinitions.join('\n\n');

  } catch (error) {
    console.error('[Fatal Error] Error in generateTypeDefinitions:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      filesCount: files?.length
    });
    return null; // Return null instead of throwing to handle errors gracefully
  }
}

function isValidParseResult(result: MDXParseResult | null): result is ValidMDXParseResult {
  if (!result) return false;
  const metadata = result.metadata;
  return (
    metadata !== null &&
    typeof metadata === 'object' &&
    typeof metadata.$type === 'string' &&
    typeof metadata.title === 'string' &&
    typeof metadata.description === 'string'
  );
}

const main = async () => {
  try {
    console.log('=== Starting MDX Type Generation ===');
    log('Current directory:', process.cwd());
    log('Script directory:', __dirname);

    console.log('[Debug] Starting directory checks...');
    const contentDirs = await Promise.all([
      'content',
      'packages/mdx-types/content/types'
    ].map(async (dir) => {
      let absolutePath: string;
      try {
        absolutePath = resolve(process.cwd(), dir);
        console.log(`[Directory Check] Checking directory: ${absolutePath}`);
        const exists = existsSync(absolutePath);
        if (!exists) {
          console.warn(`[Warning] Directory does not exist: ${absolutePath}`);
          return null;
        }
        await fsPromises.access(absolutePath, fsPromises.constants.R_OK);
        console.log(`[Directory Access] Directory exists and is readable: ${absolutePath}`);
        return absolutePath;
      } catch (error) {
        console.error(`[Directory Error] Directory not accessible: ${absolutePath!}`, {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : String(error)
        });
        return null;
      }
    })).catch(error => {
      console.error('[Directory Error] Error in Promise.all while checking directories:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      return [];
    });

    const validDirs = contentDirs.filter((dir): dir is string => dir !== null);

    if (validDirs.length === 0) {
      console.warn('[Warning] No valid content directories found');
      process.exit(1);
    }

    log('Found content directories:', validDirs);

    console.log('[Debug] Starting file search...');
    const mdxFilesPromises = validDirs
      .filter((dir): dir is string => typeof dir === 'string')
      .map(async (dir) => {
        try {
          console.log(`[File Search] Searching for MDX files in ${dir}...`);
          const pattern = join(dir, '**/*.mdx');
          console.log(`[File Search] Using glob pattern: ${pattern}`);

          const files = await glob(pattern).catch(error => {
            console.error(`[File Search Error] Error in glob for ${pattern}:`, {
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
              } : error
            });
            return [];
          });

          if (files.length === 0) {
            console.warn(`[Warning] No MDX files found in ${dir}`);
            return [];
          }

          console.log(`[File Search] Found ${files.length} files in ${dir}`);

          const validFiles = await Promise.all(
            files.map(async (file) => {
              try {
                await fsPromises.access(file, fsPromises.constants.R_OK);
                console.log(`[File Access] File ${file} is readable`);
                return file;
              } catch (error) {
                console.error(`[File Error] Error accessing file ${file}:`, {
                  error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                  } : error
                });
                return null;
              }
            })
          ).catch(error => {
            console.error('[File Access Error] Error in Promise.all while checking files:', error);
            return [];
          });

          return validFiles.filter((file): file is string => file !== null);
        } catch (error) {
          console.error('[Directory Error] Error searching for MDX files:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            directory: dir
          });
          return [];
        }
      });

    console.log('[Debug] Waiting for file search to complete...');
    const mdxFiles = await Promise.all(mdxFilesPromises).catch(error => {
      console.error('[Fatal Error] Error in Promise.all for file search:', error);
      return [];
    });
    const allMdxFiles = mdxFiles.flat().filter(Boolean);

    if (allMdxFiles.length === 0) {
      console.warn('[Warning] No MDX files found');
      process.exit(1);
    }

    log('Processing files:', allMdxFiles);
    console.log('[Debug] Starting file parsing...');
    let parsedFiles: (MDXParseResult | null)[] = [];
    const validMdxFiles = allMdxFiles.filter((file): file is string => typeof file === 'string');

    const parsePromises = validMdxFiles.map(async (filePath) => {
      try {
        const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
        console.log(`[Parse] Processing file: ${absolutePath}`);

        const result = await parseMDXFile(absolutePath, true).catch(error => {
          console.error(`[Parse Error] Error in parseMDXFile for ${absolutePath}:`, {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error,
            filePath: absolutePath
          });
          return null;
        });

        if (!result) {
          console.warn(`[Warning] No valid result from parseMDXFile for ${absolutePath}`);
          return null;
        }

        if (!result.metadata) {
          console.warn(`[Warning] No valid metadata found in ${absolutePath}`, {
            result
          });
          return null;
        }

        if (!isValidMetadata(result.metadata)) {
          console.warn(`[Warning] Invalid metadata structure in ${absolutePath}`, {
            metadata: result.metadata
          });
          return null;
        }

        return result;
      } catch (error) {
        console.error(`[Parse Error] Error processing file ${filePath}:`, {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          filePath
        });
        return null;
      }
    });

    console.log('[Debug] Waiting for parse operations to complete...');
    parsedFiles = await Promise.all(parsePromises).catch(error => {
      console.error('[Parse Error] Error in Promise.all for parse operations:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        filesCount: validMdxFiles.length
      });
      return [];
    });

    if (!Array.isArray(parsedFiles) || parsedFiles.length === 0) {
      console.warn('[Warning] No files were successfully parsed');
      process.exit(1);
    }

    const validFiles = parsedFiles
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .filter((result): result is ValidMDXParseResult => {
        try {
          return isValidParseResult(result) && isValidMetadata(result.metadata);
        } catch (error) {
          console.error('[Validation Error] Error validating parse result:', error);
          return false;
        }
      })
      .map((file: ValidMDXParseResult) => ({
        ...file,
        metadata: {
          ...file.metadata,
          $type: file.metadata.$type.replace(/^https:\/\/mdx\.org\.ai\//, '')
        }
      }));

    if (validFiles.length === 0) {
      console.warn('[Warning] No valid MDX files found with proper frontmatter');
      process.exit(1);
    }

    log(`Successfully parsed ${validFiles.length} valid MDX files`);
    console.log('[Progress] Generating type definitions...');
    try {
      const typeDefinitions = await generateTypeDefinitions(validFiles).catch(error => {
        console.error('[Fatal Error] Error generating type definitions:', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          filesCount: validFiles.length
        });
        return null;
      });

      if (!typeDefinitions) {
        console.error('[Error] Failed to generate type definitions');
        process.exit(1);
      }

      const outputDir = resolve(__dirname, '..', 'packages/mdx-types/src/generated');
      console.log('[Debug] Creating output directory...');
      try {
        await mkdir(outputDir, { recursive: true }).catch(error => {
          console.error('[Fatal Error] Error creating output directory:', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error,
            outputDir
          });
          throw error;
        });
        console.log(`[Progress] Created output directory: ${outputDir}`);

        const outputFile = join(outputDir, 'frontmatter.d.ts');
        console.log('[Debug] Writing type definitions to file...');
        await writeFile(outputFile, typeDefinitions, 'utf-8').catch(error => {
          console.error('[Fatal Error] Error writing type definitions:', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error,
            outputFile
          });
          throw error;
        });
        console.log(`[Success] Type definitions written to ${outputFile}`);
      } catch (error) {
        console.error('[Fatal Error] Error in file operations:', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          outputDir
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('[Fatal Error] Error in type generation:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('[Fatal Error] Error in main function:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    process.exit(1);
  }
};

// Wrap execution in IIFE for better error handling
(async () => {
  try {
    await main();
  } catch (error) {
    console.error('[Fatal Error] Error in async IIFE:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    process.exit(1);
  }
})();
