# mdxld

ESM-native library for parsing and serializing MDX with YAML-LD frontmatter.

## Installation

```bash
npm install mdxld
```

## Usage

```typescript
import { mdxld, stringify } from "mdxld";

// Parse MDX with YAML-LD frontmatter
const result = mdxld(`---
$type: BlogPost
$id: https://example.com/post
title: My Post
---

# Content here
`);

console.log(result.type); // "BlogPost"
console.log(result.id); // "https://example.com/post"
console.log(result.data.title); // "My Post"

// Serialize back to MDX
const mdxString = stringify(result);
```

## Features

- ESM-native implementation
- TypeScript support
- YAML-LD property handling with @ and $ prefix support
- Automatic Set conversion for `$set` properties
- Full JSON-LD compatibility

## Edge Cases and Limitations

- Empty frontmatter is treated as an empty object
- Non-object frontmatter throws an error
- `$set` values are always converted to JavaScript Sets
- Nested YAML-LD properties use $ prefix in serialization
- Binary data in frontmatter is not supported

## API Documentation

See [API Documentation](./docs/index.html) for detailed API reference.

## License

MIT

