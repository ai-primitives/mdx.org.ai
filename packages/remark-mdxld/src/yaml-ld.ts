import { parse } from 'yaml'

export interface YamlLdData {
  [key: string]: any
  frontmatter: Record<string, any>
}

export function parseYamlLd(content: string, preferDollarPrefix: boolean = true): YamlLdData {
  const data = parse(content)
  const ldProperties: YamlLdData = {
    frontmatter: {}
  }
  const regularProperties: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('$') || key.startsWith('@')) {
      const normalizedKey = preferDollarPrefix
        ? key.startsWith('@')
          ? '$' + key.slice(1)
          : key
        : key.startsWith('$')
        ? '@' + key.slice(1)
        : key
      ldProperties[normalizedKey] = value
    } else {
      regularProperties[key] = value
    }
  }

  // Validate required fields
  const hasType = '$type' in ldProperties || '@type' in ldProperties
  const hasTitle = 'title' in regularProperties
  const hasDescription = 'description' in regularProperties

  if (!hasType || !hasTitle || !hasDescription) {
    const missing: string[] = []
    if (!hasType) missing.push('$type')
    if (!hasTitle) missing.push('title')
    if (!hasDescription) missing.push('description')
    throw new Error(`Missing required frontmatter fields: ${missing.join(', ')}`)
  }

  ldProperties.frontmatter = regularProperties
  return ldProperties
}
