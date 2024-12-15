import { Plugin } from 'unified'
import { Root } from 'mdast'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import { unified } from 'unified'
import { parseYamlLd, type YamlLdData } from './yaml-ld'

interface RemarkMdxldOptions {
  preferDollarPrefix?: boolean
}

const remarkMdxld: Plugin<[RemarkMdxldOptions?], Root> = (options = {}) => {
  const { preferDollarPrefix = true } = options as RemarkMdxldOptions

  return async (tree, file) => {
    const processor = unified()
      .use(remarkMdx)
      .use(remarkGfm)
      .use(remarkFrontmatter)

    await processor.run(tree, file)

    if (tree.children[0]?.type === 'yaml') {
      const yamlContent = tree.children[0].value
      try {
        const processedData = parseYamlLd(yamlContent, preferDollarPrefix)
        file.data.yamlLd = processedData
      } catch (error) {
        file.fail(error instanceof Error ? error.message : 'Failed to parse YAML-LD frontmatter')
      }
    }

    return tree
  }
}

export default remarkMdxld
export type { RemarkMdxldOptions, YamlLdData }
