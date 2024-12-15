import { Plugin } from 'unified'
import { unified } from 'unified'
import { Root, Node } from 'mdast'
import { VFile } from 'vfile'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { parseYamlLd, type YamlLdData } from './yaml-ld'

interface RemarkMdxldOptions {
  preferDollarPrefix?: boolean
  gfm?: boolean
}

// Create a preset function that returns a configured processor
export function createProcessor(options: RemarkMdxldOptions = {}) {
  const { gfm = true } = options
  return unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkFrontmatter, ['yaml'])
    .use(gfm ? remarkGfm : () => (tree: Root) => tree)
    .use(remarkStringify)
}

const remarkMdxld: Plugin<[RemarkMdxldOptions?], Root> = (options = {}) => {
  const { preferDollarPrefix = true } = options

  return function transformer(tree: Root, file: VFile) {
    // Find and process YAML frontmatter
    const yamlNode = tree.children.find((node): node is Node & { type: 'yaml', value: string } =>
      node.type === 'yaml'
    )

    if (!yamlNode) {
      const error = new Error('Missing required frontmatter')
      file.message(error.message)
      throw error
    }

    try {
      const processedData = parseYamlLd(yamlNode.value, preferDollarPrefix)
      file.data.yamlLd = processedData
    } catch (error) {
      if (error instanceof Error) {
        file.message(error.message)
      }
      throw error
    }

    return tree
  }
}

export default remarkMdxld
export type { RemarkMdxldOptions, YamlLdData }
