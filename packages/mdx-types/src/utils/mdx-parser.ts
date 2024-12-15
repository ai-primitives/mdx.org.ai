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

function normalizeFrontmatter(frontmatter: Record<string, any>): MDXMetadata {
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
      throw new Error('Missing required field: $type or @type');
    }

    if (!title) {
      throw new Error('Missing required field: title');
    }

    if (!description) {
      throw new Error('Missing required field: description');
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
    throw error;
  }
}

export async function parseMDXFile(filePath: string): Promise<MDXParseResult> {
  try {
    console.log(`Reading file: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');

    if (!content.trim()) {
      throw new Error(`Empty file: ${filePath}`);
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
      throw new Error(`No frontmatter found in ${filePath}`);
    }

    console.log(`Parsing frontmatter for ${filePath}`);
    const frontmatter = parseYaml(frontmatterNode.value);
    const metadata = normalizeFrontmatter(frontmatter);

    if (!metadata.$type) {
      throw new Error(`No $type found in frontmatter of ${filePath}`);
    }

    if (!metadata.title) {
      throw new Error(`No title found in frontmatter of ${filePath}`);
    }

    if (!metadata.description) {
      throw new Error(`No description found in frontmatter of ${filePath}`);
    }

    const contentWithoutFrontmatter = content.replace(/---\n[\s\S]*?\n---/, '').trim();

    console.log(`Successfully parsed ${filePath}`);
    return {
      metadata,
      content: contentWithoutFrontmatter,
      examples
    };
  } catch (error: any) {
    console.error(`Error parsing MDX file ${filePath}:`, error);
    throw error;
  }
}
