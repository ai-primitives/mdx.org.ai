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
})
