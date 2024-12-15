import { Plugin } from 'unified'
import { Root } from 'mdast'
import { parse } from 'yaml'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import { unified } from 'unified'

interface YamlLdData {
  [key: string]: any
  frontmatter?: Record<string, any>
}

interface RemarkMdxldOptions {
  preferDollarPrefix?: boolean
}

function processYamlLd(data: Record<string, any>, preferDollarPrefix: boolean): YamlLdData {
  const ldProperties: YamlLdData = {}
  const regularProperties: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('$') || key.startsWith('@')) {
      const normalizedKey = preferDollarPrefix
        ? key.startsWith('@')
          ? '$' + key.slice(1)
          : key
        : key.startsWith('$')
        ? '@' + key.slice(1)
        : key
      ldProperties[normalizedKey] = value
    } else {
      regularProperties[key] = value
    }
  }

  const hasType = '$type' in ldProperties || '@type' in ldProperties
  const hasTitle = 'title' in regularProperties
  const hasDescription = 'description' in regularProperties

  if (!hasType || !hasTitle || !hasDescription) {
    const missing: string[] = []
    if (!hasType) missing.push('$type')
    if (!hasTitle) missing.push('title')
    if (!hasDescription) missing.push('description')
    throw new Error(`Missing required frontmatter fields: ${missing.join(', ')}`)
  }

  return {
    ...ldProperties,
    frontmatter: regularProperties
  }
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
        const parsedData = parse(yamlContent)
        const processedData = processYamlLd(parsedData, preferDollarPrefix)

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
