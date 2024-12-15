# remark-mdxld

[![npm version](https://img.shields.io/npm/v/remark-mdxld.svg)](https://www.npmjs.com/package/remark-mdxld)
[![License](https://img.shields.io/npm/l/remark-mdxld.svg)](https://github.com/ai-primitives/mdx.org.ai/blob/main/LICENSE)

A remark plugin for MDX that adds integrated support for YAML-LD frontmatter, enabling seamless integration of linked data in your MDX documents. Supports both `@` and `$` prefixes for YAML-LD properties, with a preference for the `$` prefix.

## Features

- Full YAML-LD support in frontmatter with type-safe parsing
- Support for both `@` and `$` property prefixes (preferring `$`)
- Integrated with common remark plugins:
  - remark-mdx for JSX support
  - remark-gfm for GitHub Flavored Markdown
  - remark-frontmatter for YAML parsing
- Framework integrations for Next.js, Vite, and ESBuild
- Comprehensive error handling and validation
- Required frontmatter field validation (title, description, $type)

## Installation

```bash
npm install remark-mdxld
# or
yarn add remark-mdxld
# or
pnpm add remark-mdxld
```

## Usage

### Basic Usage

```js
import remarkMdxld from 'remark-mdxld'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkFrontmatter from 'remark-frontmatter'

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkMdx)
  .use(remarkMdxld, {
    preferDollarPrefix: true // Default: true
  })

const result = await processor.process(`---
$type: 'https://mdx.org.ai/Document'
title: 'My Document'
description: 'A sample document'
author: 'John Doe'
---

# Hello World
`)

console.log(result.data.yamlLd)
// Output:
// {
//   $type: 'https://mdx.org.ai/Document',
//   frontmatter: {
//     title: 'My Document',
//     description: 'A sample document',
//     author: 'John Doe'
//   }
// }
```

### Next.js Integration

```js
// next.config.mjs
import remarkMdxld from 'remark-mdxld'
import remarkFrontmatter from 'remark-frontmatter'

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      [remarkFrontmatter, ['yaml']],
      [remarkMdxld, { preferDollarPrefix: true }]
    ]
  }
})

export default withMDX({
  // Your Next.js config
})
```

### Vite Integration

```js
// vite.config.js
import { defineConfig } from 'vite'
import mdx from '@mdx-js/rollup'
import remarkMdxld from 'remark-mdxld'
import remarkFrontmatter from 'remark-frontmatter'

export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [
        [remarkFrontmatter, ['yaml']],
        [remarkMdxld, { preferDollarPrefix: true }]
      ]
    })
  ]
})
```

### ESBuild Integration

```js
// esbuild.config.js
import * as esbuild from 'esbuild'
import mdx from '@mdx-js/esbuild'
import remarkMdxld from 'remark-mdxld'
import remarkFrontmatter from 'remark-frontmatter'

await esbuild.build({
  entryPoints: ['src/index.mdx'],
  outfile: 'dist/index.js',
  plugins: [
    mdx({
      remarkPlugins: [
        [remarkFrontmatter, ['yaml']],
        [remarkMdxld, { preferDollarPrefix: true }]
      ]
    })
  ]
})
```

## Configuration Options

The plugin accepts the following options:

```js
{
  preferDollarPrefix: true, // Use $ prefix instead of @ for YAML-LD properties (default: true)
  validateRequired: true,   // Validate required frontmatter fields (default: true)
  requiredFields: ['$type', 'title', 'description'] // Custom required fields (default: shown)
}
```

## Required Frontmatter Fields

The following fields are required in your MDX frontmatter:

- `$type` (or `@type`): The type of the document (e.g., 'https://mdx.org.ai/Document')
- `title`: The document title
- `description`: A brief description of the document

## Example MDX File

```mdx
---
$type: 'https://mdx.org.ai/Documentation'
$id: 'https://mdx.org.ai/docs/example'
title: 'Example Document'
description: 'Shows YAML-LD usage in MDX'
author: 'John Doe'
tags: ['documentation', 'yaml-ld', 'mdx']
---

# {frontmatter.title}

Content with access to frontmatter data...
```

## Dependencies

This plugin includes and depends on:
- unified
- remark-parse
- remark-mdx
- remark-gfm
- remark-frontmatter
- yaml
