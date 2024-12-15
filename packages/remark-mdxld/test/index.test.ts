import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkMdxld from '../src'
import { parseYamlLd } from '../src/yaml-ld'

describe('remark-mdxld', () => {
  describe('YAML-LD Parsing', () => {
    it('should parse YAML-LD frontmatter with $ prefix', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld)
        .use(remarkStringify)

      const result = await processor.process(`---
$type: https://mdx.org.ai/Document
title: Test Document
description: A test document
---

# Content
`)
      expect(result.data.yamlLd).toEqual({
        $type: 'https://mdx.org.ai/Document',
        frontmatter: {
          title: 'Test Document',
          description: 'A test document'
        }
      })
    })

    it('should convert @ prefix to $ prefix when preferDollarPrefix is true', async () => {
      const result = await unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld, { preferDollarPrefix: true })
        .use(remarkStringify)
        .process(`---
"@type": https://mdx.org.ai/Document
title: Test Document
description: A test document
---

# Content
`)
      expect(result.data.yamlLd).toEqual({
        $type: 'https://mdx.org.ai/Document',
        frontmatter: {
          title: 'Test Document',
          description: 'A test document'
        }
      })
    })

    it('should throw error when required fields are missing', async () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkMdxld)
        .use(remarkStringify)

      await expect(processor.process(`---
title: Test Document
---

# Content
`)).rejects.toThrow('Missing required frontmatter fields')
    })
  })

  describe('Direct YAML-LD Parser', () => {
    it('should parse YAML content with mixed prefixes', () => {
      const yaml = `
$type: https://mdx.org.ai/Document
$context: https://schema.org
"@id": https://example.com/doc1
title: Test Document
description: Test description
keywords: [test, yaml]
`
      const result = parseYamlLd(yaml)
      expect(result).toEqual({
        $type: 'https://mdx.org.ai/Document',
        $context: 'https://schema.org',
        $id: 'https://example.com/doc1',
        frontmatter: {
          title: 'Test Document',
          description: 'Test description',
          keywords: ['test', 'yaml']
        }
      })
    })

    it('should validate required fields', () => {
      expect(() => parseYamlLd(`
title: Test
`)).toThrow('Missing required frontmatter fields')
    })
  })
})
