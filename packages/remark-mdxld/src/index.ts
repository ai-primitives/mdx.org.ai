import { Plugin, unified } from 'unified'
import { Root, Node, Paragraph, ListItem, PhrasingContent } from 'mdast'
import { VFile } from 'vfile'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkStringify, { Options as StringifyOptions } from 'remark-stringify'
import { parseYamlLd, type YamlLdData } from './yaml-ld'
import { visit, type Visitor } from 'unist-util-visit'

interface RemarkMdxldOptions {
  gfm?: boolean
  preferDollarPrefix?: boolean
}

interface TextNode extends Node {
  type: 'text'
  value: string
}

const remarkStripGfm: Plugin<[], Root> = () => {
  return (tree: Root, file: VFile) => {
    const listItemVisitor: Visitor<ListItem> = (node) => {
      if ('checked' in node) {
        const textNode = node.children[0]
        if (textNode && textNode.type === 'paragraph') {
          const firstChild = textNode.children[0]
          if (firstChild && 'value' in firstChild) {
            firstChild.value = firstChild.value.replace(/^\[[ x]\]\s*/, '')
          }
        }
        delete node.checked
      }
    }

    visit(tree, 'listItem', listItemVisitor)
    return tree
  }
}

const remarkDisableGfm: Plugin<[], Root> = () => {
  return (tree: Root, file: VFile) => {
    const visitor: Visitor<TextNode> = (node, index, parent) => {
      if (!parent || typeof index !== 'number') return

      if (node.type === 'text' && node.value.includes('|')) {
        const lines = node.value.split('\n')
        const textContent = lines
          .map((line: string) =>
            line.split('|')
              .map((cell: string) => cell.trim())
              .filter(Boolean)
              .join(' ')
          )
          .join('\n')
          .trim()

        const paragraph: Paragraph = {
          type: 'paragraph',
          children: [{
            type: 'text',
            value: textContent
          }] as PhrasingContent[]
        }

        parent.children[index] = paragraph
        return [true, index]
      }
    }

    visit(tree, 'text', visitor)
    return tree
  }
}

const remarkMdxld: Plugin<[RemarkMdxldOptions?], Root> = (options = {}) => {
  const { preferDollarPrefix = true } = options

  return async (tree: Root, file: VFile) => {
    if (!file.data) {
      file.data = {}
    }

    const yamlNode = tree.children.find(node => node.type === 'yaml')
    if (!yamlNode || !('value' in yamlNode)) {
      const error = new Error('Missing required frontmatter')
      file.message(error.message)
      throw error
    }

    try {
      const yamlLd = parseYamlLd(yamlNode.value as string, preferDollarPrefix)
      file.data.yamlLd = yamlLd
    } catch (error) {
      if (error instanceof Error) {
        file.message(error.message)
        throw error
      }
      throw error
    }

    return tree
  }
}

export function createProcessor(options: RemarkMdxldOptions = {}) {
  const { gfm = true } = options

  const processor = unified()

  if (!gfm) {
    processor.use(remarkParse, {
      commonmark: true,
      gfm: false
    })
  } else {
    processor.use(remarkParse)
  }

  processor.use(remarkFrontmatter, ['yaml'])
  processor.use(remarkMdxld, options)

  if (!gfm) {
    processor
      .use(remarkDisableGfm)
      .use(remarkStripGfm)
  }

  processor.use(remarkMdx)

  if (gfm) {
    processor.use(remarkGfm)
  }

  const stringifyOptions: Partial<StringifyOptions> = {
    bullet: '-',
    listItemIndent: 'one',
    rule: '-',
    strong: '*',
    emphasis: '_',
    fences: true,
    setext: false,
    fence: '`',
    quote: "'",
    tightDefinitions: true,
    resourceLink: false,
    ruleSpaces: false,
    handlers: gfm ? undefined : {
      table: () => '',
      tableRow: () => '',
      tableCell: () => ''
    }
  }

  return processor.use(remarkStringify, stringifyOptions)
}

export default remarkMdxld
export type { RemarkMdxldOptions, YamlLdData }
