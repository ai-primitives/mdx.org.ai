import { parse } from 'yaml'

export interface YamlLdData {
  [key: string]: any
  frontmatter: {
    title: string
    description: string
    [key: string]: any
  }
}

export function parseYamlLd(content: string, preferDollarPrefix: boolean = true): YamlLdData {
  const data = parse(content)
  const result: YamlLdData = {
    frontmatter: {
      title: '',
      description: ''
    }
  }

  // Process all properties
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('@') || key.startsWith('$')) {
      // Handle LD properties
      const normalizedKey = preferDollarPrefix
        ? key.startsWith('@')
          ? '$' + key.slice(1)
          : key
        : key.startsWith('$')
        ? '@' + key.slice(1)
        : key
      result[normalizedKey] = value
    } else {
      // Regular frontmatter properties
      result.frontmatter[key] = value
    }
  }

  // Validate required fields
  const missing: string[] = []
  if (!('$type' in result) && !('@type' in result)) {
    missing.push('$type')
  }
  if (!result.frontmatter.title) {
    missing.push('title')
  }
  if (!result.frontmatter.description) {
    missing.push('description')
  }

  if (missing.length > 0) {
    throw new Error(`Missing required frontmatter fields: ${missing.join(', ')}`)
  }

  return result
}
