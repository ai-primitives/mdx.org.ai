import { Plugin } from 'unified'
import { Root, Node } from 'mdast'
import { VFile } from 'vfile'
import { parseYamlLd, type YamlLdData } from './yaml-ld'

interface RemarkMdxldOptions {
  preferDollarPrefix?: boolean
}

const remarkMdxld: Plugin<[RemarkMdxldOptions?], Root> = (options = {}) => {
  const { preferDollarPrefix = true } = options

  return function transformer(tree: Root, file: VFile) {
    // Find and process YAML frontmatter
    const yamlNode = tree.children.find((node: Node): node is Node & { type: 'yaml', value: string } =>
      node.type === 'yaml'
    )

    if (!yamlNode) {
      const error = new Error('Missing required frontmatter fields')
      file.message(error.message)
      throw error
    }

    try {
      const processedData = parseYamlLd(yamlNode.value, preferDollarPrefix)
      file.data.yamlLd = processedData
    } catch (error) {
      if (error instanceof Error) {
        file.message(error.message)
        throw error
      }
      throw new Error('Failed to parse YAML-LD frontmatter')
    }

    return tree
  }
}

export default remarkMdxld
export type { RemarkMdxldOptions, YamlLdData }
