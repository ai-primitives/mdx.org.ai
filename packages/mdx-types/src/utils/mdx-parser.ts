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

interface MDXParseResult {
  metadata: MDXMetadata;
  content: string;
  examples: string[];
}

function normalizeFrontmatter(frontmatter: Record<string, any>): MDXMetadata {
  const type = frontmatter['$type'] || frontmatter['@type'] || '';
  const id = frontmatter['$id'] || frontmatter['@id'] || undefined;
  const context = frontmatter['$context'] || frontmatter['@context'] || 'https://mdx.org.ai';
  const title = frontmatter['title'];
  const description = frontmatter['description'];

  if (!type) throw new Error('$type is required in frontmatter');
  if (!title) throw new Error('title is required in frontmatter');
  if (!description) throw new Error('description is required in frontmatter');

  const {
    $type, '@type': atType,
    $id, '@id': atId,
    $context: dollarContext,
    '@context': atContext,
    ...rest
  } = frontmatter;

  return {
    $type: type.replace('https://mdx.org.ai/', ''),
    title,
    description,
    ...(id && { $id: id }),
    ...(context && { $context: context }),
    ...rest
  };
}

export async function parseMDXFile(filePath: string): Promise<MDXParseResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkMdx);

    const tree = await processor.parse(content);

    let frontmatter: Record<string, any> = {};
    visit(tree, 'yaml', (node: any) => {
      try {
        frontmatter = parseYaml(node.value) || {};
      } catch (e) {
        throw new Error(`Failed to parse frontmatter in ${filePath}: ${(e as Error).message}`);
      }
    });

    if (Object.keys(frontmatter).length === 0) {
      throw new Error(`No frontmatter found in ${filePath}`);
    }

    const examples: string[] = [];
    visit(tree, 'code', (node: any) => {
      if (node.meta === 'example') {
        examples.push(node.value);
      }
    });

    const contentWithoutFrontmatter = content
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      .trim();

    return {
      metadata: normalizeFrontmatter(frontmatter),
      content: contentWithoutFrontmatter,
      examples
    };
  } catch (e) {
    throw new Error(`Failed to parse MDX file ${filePath}: ${(e as Error).message}`);
  }
}
