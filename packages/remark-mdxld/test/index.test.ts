import { describe, it, expect } from 'vitest'
import { createProcessor } from '../src'
import { parseYamlLd } from '../src/yaml-ld'

describe('remark-mdxld', () => {
  describe('MDX Features', () => {
    it('should parse MDX with JSX components', async () => {
      const processor = createProcessor()
      const result = await processor.process(`---
title: Test Document
description: Test description
$type: Document
---
import { Button } from './components'

# Hello

<Button>Click me</Button>
`)
      const output = result.toString()
      expect(output).toContain('import { Button } from')
      expect(output).toContain('<Button>Click me</Button>')
    })

    it('should handle MDX exports', async () => {
      const processor = createProcessor()
      const result = await processor.process(`---
title: Test Document
description: Test description
$type: Document
---
export const meta = {
  author: 'Test Author'
}

# Content
`)
      const output = result.toString()
      expect(output).toContain('export const meta =')
    })
  })

  describe('GFM Features', () => {
    it('should parse GFM tables and task lists', async () => {
      const processor = createProcessor()
      const result = await processor.process(`---
title: Test Document
description: Test description
$type: Document
---
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |

- [x] Task 1
- [ ] Task 2
`)
      const output = result.toString()
      expect(output).toContain('| Header 1 |')
      expect(output).toContain('| Cell 1   |')
      expect(output).toContain('- [x] Task 1')
      expect(output).toContain('- [ ] Task 2')
    })

    it('should disable GFM features when gfm option is false', async () => {
      const processor = createProcessor({ gfm: false })
      const result = await processor.process(`---
title: Test Document
description: Test description
$type: Document
---
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`)
      const output = result.toString()
      expect(output).not.toContain('| Header 1 |')
      expect(output).not.toContain('| Cell 1   |')
      expect(output).toContain('Header 1 Header 2')
      expect(output).toContain('Cell 1 Cell 2')
    })
  })

  describe('YAML-LD Parsing', () => {
    it('should parse YAML-LD frontmatter with $ prefix', async () => {
      const processor = createProcessor()
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
      const result = await createProcessor({ preferDollarPrefix: true })
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
      const processor = createProcessor()

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

  describe('Plugin Integration', () => {
    it('should work as a single plugin without requiring individual remark plugins', async () => {
      const processor = createProcessor()
      const result = await processor.process(`---
title: Test Document
description: Test description
$type: Document
---
import { Component } from './components'

| Feature | Support |
| ------- | ------- |
| MDX     | ✅      |
| GFM     | ✅      |

<Component>
  - [x] Task complete
</Component>
`)
      const output = result.toString()

      expect(output).toContain('import { Component }')
      expect(output).toContain('<Component>')

      expect(output).toContain('| Feature |')
      expect(output).toContain('- [x] Task complete')

      expect(result.data.yamlLd).toEqual({
        $type: 'Document',
        frontmatter: {
          title: 'Test Document',
          description: 'Test description'
        }
      })
    })
  })
})
