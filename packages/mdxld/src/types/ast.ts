import type { Root } from 'mdast'
import type { MDXLD } from './index.js'

export interface MDXLDWithAST extends MDXLD {
  ast: Root
  [key: string]: Root | string | Record<string, unknown> | unknown[] | Set<unknown> | boolean | undefined
}
