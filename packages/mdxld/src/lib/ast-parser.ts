import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import remarkMdxld from 'remark-mdxld'
import remarkStringify from 'remark-stringify'
import type { Root } from 'mdast'
import { mdxld } from './parser.js'
import type { MDXLD } from '../types/index.js'
import type { MDXLDWithAST } from '../types/ast.js'

export function mdxldWithAst(input: string): MDXLDWithAST {
  const base = mdxld(input)

  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkMdx)
      .use(remarkMdxld)
      .use(remarkStringify)

    const ast = processor.parse(input)
    const vfile = processor.processSync(input)
    const transformedAst = processor.runSync(ast, vfile) as Root

    const result: MDXLDWithAST = {
      ...base,
      ast: transformedAst
    }

    if (vfile.data.yamlld) {
      for (const [key, value] of Object.entries(vfile.data.yamlld)) {
        if (key.startsWith('$') || key.startsWith('@')) {
          const cleanKey = key.slice(1)
          if (cleanKey === 'list') {
            result[cleanKey] = Array.isArray(value) ? value : [value]
          } else if (cleanKey === 'set') {
            result[cleanKey] = value instanceof Set ? value : new Set(Array.isArray(value) ? value : [value])
          } else {
            result[cleanKey] = value
          }
        }
      }
    }

    return result
  } catch (error) {
    throw new Error(`Failed to parse MDX AST: ${error instanceof Error ? error.message : String(error)}`)
  }
}
