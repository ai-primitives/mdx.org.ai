import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import { parse as parseYaml } from 'yaml'
import { promises as fs } from 'fs'
import { join } from 'path'
import { visit } from 'unist-util-visit'

export interface MDXMetadata {
  $type: string;
  title: string;
  description: string;
  $context?: string;
  $id?: string;
  [key: string]: any;
}

export interface MDXParseResult {
  metadata: MDXMetadata | null;
  content: string;
  examples: string[];
}

export interface ValidMDXParseResult extends MDXParseResult {
  metadata: MDXMetadata;
}

export function isValidMetadata(metadata: unknown): metadata is MDXMetadata {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as Record<string, unknown>;
  return (
    typeof m.$type === 'string' &&
    typeof m.title === 'string' &&
    typeof m.description === 'string'
  );
}

function normalizeFrontmatter(frontmatter: Record<string, any>): MDXMetadata | null {
  try {
    const {
      $type, '@type': atType,
      $id, '@id': atId,
      $context: dollarContext,
      '@context': atContext,
      title,
      description,
      ...rest
    } = frontmatter;

    const normalizedType = ($type || atType || '').replace(/^https:\/\/mdx\.org\.ai\//, '');

    if (!normalizedType) {
      console.warn('Missing required field: $type or @type');
      return null;
    }

    if (!title) {
      console.warn('Missing required field: title');
      return null;
    }

    if (!description) {
      console.warn('Missing required field: description');
      return null;
    }

    return {
      $type: normalizedType,
      title,
      description,
      $id: $id || atId,
      $context: dollarContext || atContext,
      ...rest
    };
  } catch (error) {
    console.error('Error normalizing frontmatter:', error);
    return null;
  }
}

export async function parseMDXFile(contentOrPath: string, isPath: boolean = false): Promise<MDXParseResult> {
  try {
    let content: string;
    if (isPath) {
      console.log(`Reading file: ${contentOrPath}`);
      try {
        content = await fs.readFile(contentOrPath, 'utf-8');
      } catch (error) {
        console.error(`Error reading file ${contentOrPath}:`, {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
          stack: error instanceof Error ? error.stack : undefined
        });
        return { metadata: null, content: '', examples: [] };
      }
    } else {
      content = contentOrPath;
    }

    if (!content.trim()) {
      console.warn(`Empty content${isPath ? ` in file: ${contentOrPath}` : ''}`);
      return { metadata: null, content: '', examples: [] };
    }

    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkMdx);

    console.log(`Parsing MDX content${isPath ? ` for ${contentOrPath}` : ''}`);
    let tree;
    try {
      tree = await processor.parse(content);
    } catch (error) {
      console.error(`Error parsing MDX${isPath ? ` in ${contentOrPath}` : ''}:`, error);
      return { metadata: null, content: '', examples: [] };
    }

    let frontmatterNode: any = null;
    let examples: string[] = [];

    visit(tree, 'yaml', (node) => {
      frontmatterNode = node;
    });

    if (!frontmatterNode) {
      console.warn(`No frontmatter found${isPath ? ` in ${contentOrPath}` : ''}`);
      return { metadata: null, content, examples };
    }

    console.log(`Parsing frontmatter${isPath ? ` for ${contentOrPath}` : ''}`);
    try {
      const frontmatter = parseYaml(frontmatterNode.value);
      if (!frontmatter || typeof frontmatter !== 'object') {
        console.warn('Invalid YAML: expected an object');
        return { metadata: null, content, examples };
      }

      const metadata = normalizeFrontmatter(frontmatter);

      if (!metadata) {
        console.warn(`Invalid frontmatter${isPath ? ` in ${contentOrPath}` : ''}: missing required fields`);
        return { metadata: null, content, examples };
      }

      const contentWithoutFrontmatter = content.replace(/---\n[\s\S]*?\n---/, '').trim();

      console.log(`Successfully parsed${isPath ? ` ${contentOrPath}` : ' content'}`);
      return {
        metadata,
        content: contentWithoutFrontmatter,
        examples
      };
    } catch (error) {
      console.error(`Error parsing frontmatter${isPath ? ` in ${contentOrPath}` : ''}:`, {
        error: error instanceof Error ? error.message : String(error),
        file: contentOrPath,
        frontmatter: frontmatterNode.value
      });
      return { metadata: null, content, examples };
    }
  } catch (error) {
    console.error(`Error in parseMDXFile${isPath ? ` for ${contentOrPath}` : ''}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return { metadata: null, content: '', examples: [] };
  }
}
