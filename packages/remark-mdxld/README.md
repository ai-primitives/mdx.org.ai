# remark-mdxld

[![npm version](https://badge.fury.io/js/remark-mdxld.svg)](https://badge.fury.io/js/remark-mdxld)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Remark plugin for MDX with integrated support for YAML and YAML-LD Frontmatter.

## Features

- Full YAML-LD support in frontmatter
- Support for both @ and $ property prefixes ($ preferred)
- Integrated with common remark plugins
- Type-safe frontmatter parsing

## Installation

```bash
npm install remark-mdxld
```

## Usage

### Basic Usage

```js
import remarkMdxld from 'remark-mdxld'

// Basic usage
const result = await remark()
  .use(remarkMdxld)
  .process(yourMarkdown)

// With options
const result = await remark()
  .use(remarkMdxld, {
    preferDollarPrefix: true, // Use $ instead of @ for YAML-LD properties
  })
  .process(yourMarkdown)
```

### Next.js

```js
// next.config.js
import remarkMdxld from 'remark-mdxld'

const withMDX = require('@next/mdx')({
  options: {
    remarkPlugins: [
      [remarkMdxld, { preferDollarPrefix: true }]
    ]
  }
})

export default withMDX({
  pageExtensions: ['js', 'jsx', 'mdx']
})
```

```jsx
// pages/example.mdx
---
$type: https://mdx.org.ai/BlogPost
title: My Blog Post
description: Example blog post with YAML-LD
---

# {frontmatter.title}

Your content here...
```

### Vite

```js
// vite.config.js
import { defineConfig } from 'vite'
import mdx from '@mdx-js/rollup'
import remarkMdxld from 'remark-mdxld'

export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [
        [remarkMdxld, { preferDollarPrefix: true }]
      ]
    })
  ]
})
```

### ESBuild

```js
// build.js
import * as esbuild from 'esbuild'
import mdx from '@mdx-js/esbuild'
import remarkMdxld from 'remark-mdxld'

await esbuild.build({
  entryPoints: ['src/index.mdx'],
  outfile: 'dist/index.js',
  plugins: [
    mdx({
      remarkPlugins: [
        [remarkMdxld, { preferDollarPrefix: true }]
      ]
    })
  ]
})
```

## Example

```mdx
---
$type: https://mdx.org.ai/Documentation
$id: https://mdx.org.ai/docs/example
title: Example Document
description: Shows YAML-LD usage in MDX
---

# My Document

Content goes here...
```

## Included Plugins

This plugin includes and configures:
- remark-mdx
- remark-gfm
- remark-frontmatter
- Other common remark plugins without side effects

## Dependencies

- remark-mdx
- remark-gfm
- remark-frontmatter
- unified
- yaml
