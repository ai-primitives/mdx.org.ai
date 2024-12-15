import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkMdxld from '../src'
import type { YamlLdData } from '../src'

// Extend VFile to include our custom data
declare module 'vfile' {
  interface DataMap {
    yamlLd: YamlLdData
  }
}

describe('framework integration', () => {
  const mdxContent = `---
$type: https://mdx.org.ai/Document
title: Test Document
description: A test document
---

# Content
`

  describe('NextJS (@next/mdx)', () => {
    it('should work with NextJS MDX configuration', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld)
        .use(remarkStringify)

      const result = await processor.process(mdxContent)
      const yamlLd = result.data.yamlLd as YamlLdData
      expect(yamlLd).toEqual({
        $type: 'https://mdx.org.ai/Document',
        frontmatter: {
          title: 'Test Document',
          description: 'A test document'
        }
      })
    })

    it('should handle NextJS specific options', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld, { preferDollarPrefix: true })
        .use(remarkStringify)

      const result = await processor.process(mdxContent)
      const yamlLd = result.data.yamlLd as YamlLdData
      expect(yamlLd.$type).toBe('https://mdx.org.ai/Document')
    })
  })

  describe('Vite (@mdx-js/rollup)', () => {
    it('should work with Vite MDX configuration', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld)
        .use(remarkStringify)

      const result = await processor.process(mdxContent)
      const yamlLd = result.data.yamlLd as YamlLdData
      expect(yamlLd).toBeDefined()
      expect(yamlLd.frontmatter.title).toBe('Test Document')
    })

    it('should handle Vite specific options', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld)
        .use(remarkStringify)

      const result = await processor.process(mdxContent)
      const yamlLd = result.data.yamlLd as YamlLdData
      expect(yamlLd.frontmatter.description).toBe('A test document')
    })
  })

  describe('ESBuild (@mdx-js/esbuild)', () => {
    it('should work with ESBuild MDX configuration', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld)
        .use(remarkStringify)

      const result = await processor.process(mdxContent)
      const yamlLd = result.data.yamlLd as YamlLdData
      expect(yamlLd).toBeDefined()
      expect(yamlLd.$type).toBe('https://mdx.org.ai/Document')
    })

    it('should handle ESBuild specific options', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld)
        .use(remarkStringify)

      const result = await processor.process(mdxContent)
      const yamlLd = result.data.yamlLd as YamlLdData
      expect(yamlLd.frontmatter).toEqual({
        title: 'Test Document',
        description: 'A test document'
      })
    })
  })
})
