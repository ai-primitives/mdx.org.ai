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

export async function parseMDXFile(filePath: string): Promise<MDXParseResult> {
  try {
    console.log(`Reading file: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8').catch(error => {
      console.error(`Error reading file ${filePath}:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    });

    if (!content.trim()) {
      console.warn(`Empty file: ${filePath}`);
      return { metadata: null, content: '', examples: [] };
    }

    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkMdx);

    console.log(`Parsing MDX content for ${filePath}`);
    const tree = await processor.parse(content);

    let frontmatterNode: any = null;
    let examples: string[] = [];

    visit(tree, 'yaml', (node) => {
      frontmatterNode = node;
    });

    if (!frontmatterNode) {
      console.warn(`No frontmatter found in ${filePath}`);
      return { metadata: null, content, examples };
    }

    console.log(`Parsing frontmatter for ${filePath}`);
    const frontmatter = parseYaml(frontmatterNode.value);
    const metadata = normalizeFrontmatter(frontmatter);

    if (!metadata) {
      console.warn(`Invalid frontmatter in ${filePath}`);
      return { metadata: null, content, examples };
    }

    const contentWithoutFrontmatter = content.replace(/---\n[\s\S]*?\n---/, '').trim();

    console.log(`Successfully parsed ${filePath}`);
    return {
      metadata,
      content: contentWithoutFrontmatter,
      examples
    };
  } catch (error) {
    console.error(`Error parsing MDX file ${filePath}:`, error);
    return { metadata: null, content: '', examples: [] };
  }
}
