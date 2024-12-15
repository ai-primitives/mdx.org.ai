import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import { parse as parseYaml } from 'yaml'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Root, Code, Yaml } from 'mdast'
import { Node } from 'unist'

export interface MDXMetadata {
  type: string;
  id?: string;
  context?: string;
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
  const context = frontmatter['@context'] || 'https://mdx.org.ai';

  const { $type, '@type': atType, $id, '@id': atId, '@context': atContext, ...rest } = frontmatter;

  return {
    type,
    ...(id && { id }),
    context,
    ...rest
  };
}

function extractExamples(tree: Root): string[] {
  const examples: string[] = [];

  function visit(node: Node): void {
    if (node.type === 'code' && (node as Code).lang === 'mdx') {
      examples.push((node as Code).value);
    }

    if ('children' in node) {
      (node.children as Node[]).forEach(visit);
    }
  }

  visit(tree);
  return examples;
}

export function parseMDXFile(filePath: string): MDXParseResult {
  try {
    const content = readFileSync(filePath, 'utf-8');

    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml']);

    const tree = processor.parse(content) as Root;

    let frontmatter: Record<string, any> = {};
    const firstNode = tree.children[0];

    if (firstNode?.type === 'yaml') {
      try {
        frontmatter = parseYaml((firstNode as Yaml).value);
        if (!frontmatter || typeof frontmatter !== 'object') {
          throw new Error('Frontmatter must be a valid YAML object');
        }
      } catch (e) {
        throw new Error(`Failed to parse frontmatter in ${filePath}: ${e}`);
      }
    }

    const examples = extractExamples(tree);

    const contentWithoutFrontmatter = content
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      .trim();

    return {
      metadata: normalizeFrontmatter(frontmatter),
      content: contentWithoutFrontmatter,
      examples
    };
  } catch (e) {
    throw new Error(`Failed to parse MDX file ${filePath}: ${e}`);
  }
}
