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
