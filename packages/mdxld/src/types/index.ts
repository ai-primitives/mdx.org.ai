/**
 * Core MDXLD type definitions
 */

/**
 * Represents the core MDXLD interface with YAML-LD support
 * @property id - Optional identifier for the document
 * @property type - Optional type identifier
 * @property context - Optional JSON-LD context
 * @property language - Optional BCP47 language tag
 * @property base - Optional base IRI for resolving relative IRIs
 * @property vocab - Optional default vocabulary IRI
 * @property list - Optional ordered collection
 * @property set - Optional unique collection
 * @property reverse - Optional reverse relationships flag
 * @property data - Parsed YAML frontmatter data
 * @property content - MDX content without frontmatter
 */
export interface MDXLD {
  id?: string
  type?: string
  context?: {
    base?: string
    vocab?: string
    language?: string
    [key: string]: unknown
  }
  language?: string
  base?: string
  vocab?: string
  list?: unknown[]
  set?: Set<unknown>
  reverse?: boolean
  data: {
    [key: string]: unknown | {
      type?: string
      id?: string
      context?: Record<string, unknown>
      list?: unknown[]
      set?: Set<unknown>
      [key: string]: unknown
    }
  }
  content: string
}

/**
 * Type guard for MDXLD objects
 */
export function isValidMDXLD(obj: unknown): obj is MDXLD {
  if (typeof obj !== 'object' || obj === null) return false
  const mdxld = obj as MDXLD
  return typeof mdxld.content === 'string' && typeof mdxld.data === 'object' && mdxld.data !== null
}
