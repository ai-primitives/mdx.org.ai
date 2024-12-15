import { describe, it, expect } from 'vitest'
import { mdxldWithAst } from '../src/ast'
import type { MDXLDWithAST } from '../src/types/ast'
import type { Root } from 'mdast'

describe('mdxldWithAst', () => {
  it('should parse MDX content with AST', () => {
    const input = `---\n$type: Test\n---\n# Hello\n\nWorld`
    const result = mdxldWithAst(input)

    expect(result.type).toBe('Test')
    expect(result.content).toContain('Hello')
    expect(result.ast).toBeDefined()
    expect(result.ast.type).toBe('root')
    expect(result.ast.children).toHaveLength(3) // YAML + heading + paragraph
    expect(result.ast.children[0].type).toBe('yaml')
    expect(result.ast.children[1].type).toBe('heading')
    expect(result.ast.children[2].type).toBe('paragraph')
  })

  it('should maintain the same interface as core mdxld', () => {
    const input = `---\n$type: Test\n$id: test-123\n$language: en\n$base: https://example.com\n$vocab: https://schema.org\nkey: value\n---\n# Content`
    const result = mdxldWithAst(input)

    expect(result.type).toBe('Test')
    expect(result.id).toBe('test-123')
    expect(result.language).toBe('en')
    expect(result.base).toBe('https://example.com')
    expect(result.vocab).toBe('https://schema.org')
    expect(result.data).toEqual({ key: 'value' })
    expect(result.content).toContain('Content')
  })

  it('should correctly parse MDX AST structure', () => {
    const input = `---\n$type: Test\n---\n# Heading\n\nParagraph\n\n- List item 1\n- List item 2`
    const result = mdxldWithAst(input)

    const ast = result.ast as Root
    expect(ast.type).toBe('root')
    expect(ast.children[0].type).toBe('yaml')
    expect(ast.children[1].type).toBe('heading')
    expect(ast.children[2].type).toBe('paragraph')
    expect(ast.children[3].type).toBe('list')
  })

  it('should handle empty frontmatter with AST', () => {
    const input = '# Just content\n\nNo frontmatter'
    const result = mdxldWithAst(input)

    expect(result.data).toEqual({})
    expect(result.content).toContain('Just content')
    expect(result.ast).toBeDefined()
    expect(result.ast.type).toBe('root')
    expect(result.ast.children).toHaveLength(2) // heading + paragraph
  })

  describe('value type handling', () => {
    it('should handle various YAML-LD value types', () => {
      const input = `---
$type: Test
$id: 123
numberInt: 42
numberFloat: 42.5
boolTrue: true
boolFalse: false
nullValue: null
dateValue: 2024-01-01
objectValue:
  nested: value
  number: 123
  deep:
    level: 2
    value: nested
arrayValue: [1, "two", true, null]
mixedSet: !!set
  ? one
  ? 2
  ? true
  ? 2024-01-01
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.data.numberInt).toBe(42)
      expect(result.data.numberFloat).toBe(42.5)
      expect(result.data.boolTrue).toBe(true)
      expect(result.data.boolFalse).toBe(false)
      expect(result.data.nullValue).toBeNull()
      expect(result.data.dateValue).toBeInstanceOf(Date)
      const isoDate = (result.data.dateValue as Date).toISOString()
      expect(isoDate.startsWith('2024-01-01')).toBe(true)
      expect(result.data.objectValue).toEqual({
        nested: 'value',
        number: 123,
        deep: {
          level: 2,
          value: 'nested'
        }
      })
      expect(Array.isArray(result.data.arrayValue)).toBe(true)
      expect(result.data.arrayValue).toEqual([1, 'two', true, null])
      expect(result.data.mixedSet).toBeInstanceOf(Set)
      const mixedSet = result.data.mixedSet as Set<unknown>
      expect([...mixedSet]).toHaveLength(4)
      expect(mixedSet.has('one')).toBe(true)
      expect(mixedSet.has(2)).toBe(true)
      expect(mixedSet.has(true)).toBe(true)
    })

    it('should handle empty and sparse values', () => {
      const input = `---
$type: Test
emptyString: ""
emptyArray: []
emptyObject: {}
sparseArray: [1,,3]
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.data.emptyString).toBe('')
      expect(result.data.emptyArray).toEqual([])
      expect(result.data.emptyObject).toEqual({})
      expect(result.data.sparseArray).toEqual([1, undefined, 3])
    })
  })

  describe('nested property handling', () => {
    it('should handle nested YAML-LD properties', () => {
      const input = `---
$type: Test
$context:
  $base: https://example.com
  $vocab: https://schema.org
  $language: en
nested:
  $type: NestedType
  $id: nested-123
  value: test
deepNested:
  level1:
    $type: Level1Type
    level2:
      $id: deep-123
      value: nested
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.context).toEqual({
        base: 'https://example.com',
        vocab: 'https://schema.org',
        language: 'en'
      })
      expect(result.data.nested).toEqual({
        type: 'NestedType',
        id: 'nested-123',
        value: 'test'
      })
      const deepNested = result.data.deepNested as {
        level1: {
          type: string
          level2: {
            id: string
            value: string
          }
        }
      }
      expect(deepNested.level1).toEqual({
        type: 'Level1Type',
        level2: {
          id: 'deep-123',
          value: 'nested'
        }
      })
    })

    it('should handle mixed prefix handling in nested structures', () => {
      const input = `---
$type: Test
nested:
  @type: LegacyType
  $id: mixed-123
  @context:
    $base: https://legacy.com
  $list: [1, 2, 3]
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.data.nested).toEqual({
        type: 'LegacyType',
        id: 'mixed-123',
        context: {
          base: 'https://legacy.com'
        },
        list: [1, 2, 3]
      })
    })
  })

  describe('error handling', () => {
    it('should handle invalid YAML syntax', () => {
      const input = `---
$type: Test
invalid: : value
---
# Content`
      expect(() => mdxldWithAst(input)).toThrow('Invalid YAML syntax')
    })

    it('should handle invalid property names', () => {
      const input = `---
$type: Test
$invalid.name: value
---
# Content`
      expect(() => mdxldWithAst(input)).toThrow('Invalid property name')
    })

    it('should handle type coercion errors', () => {
      const input = `---
$type: Test
$id: [invalid, id]
---
# Content`
      expect(() => mdxldWithAst(input)).toThrow('Invalid $id value')
    })

    it('should handle missing required fields', () => {
      const input = `---
$type:
---
# Content`
      expect(() => mdxldWithAst(input)).toThrow('Missing required value for $type')
    })

    it('should handle duplicate properties', () => {
      const input = `---
$type: Test
$type: AnotherTest
---
# Content`
      expect(() => mdxldWithAst(input)).toThrow('Duplicate property $type')
    })
  })

  describe('special character handling', () => {
    it('should handle Unicode characters', () => {
      const input = `---
$type: Test
unicode: 你好世界
emoji: 👋🌍
mixed: Hello 世界
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.data.unicode).toBe('你好世界')
      expect(result.data.emoji).toBe('👋🌍')
      expect(result.data.mixed).toBe('Hello 世界')
    })

    it('should handle mixed quotes and escaping', () => {
      const input = `---
$type: Test
singleQuotes: 'string with "double" quotes'
doubleQuotes: "string with 'single' quotes"
escaped: "quotes \\"inside\\" string"
nested: 'outer ''inner'' quotes'
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.data.singleQuotes).toBe('string with "double" quotes')
      expect(result.data.doubleQuotes).toBe("string with 'single' quotes")
      expect(result.data.escaped).toBe('quotes "inside" string')
      expect(result.data.nested).toBe("outer 'inner' quotes")
    })

    it('should handle multiline strings', () => {
      const input = `---
$type: Test
literal: |
  Line 1
  Line 2
    Indented line
  Line 3
folded: >
  This is a long
  paragraph that will
  be folded into
  a single line
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.data.literal).toBe('Line 1\nLine 2\n  Indented line\nLine 3\n')
      expect(result.data.folded).toBe('This is a long paragraph that will be folded into a single line\n')
    })

    it('should handle special symbols and characters', () => {
      const input = `---
$type: Test
symbols: !@#$%^&*()_+-=[]{}\\|;:,.<>?/~\`
control: "Tab\\tNewline\\nCarriage\\rReturn"
spaces: "    leading and trailing    "
---
# Content`
      const result = mdxldWithAst(input)

      expect(result.data.symbols).toBe('!@#$%^&*()_+-=[]{}\\|;:,.<>?/~`')
      expect(result.data.control).toBe('Tab\tNewline\nCarriage\rReturn')
      expect(result.data.spaces).toBe('    leading and trailing    ')
    })
  })
})
