/**
 * Base types for MDX.org.ai TypeScript definitions
 */

/**
 * Represents the frontmatter fields in an MDX file
 * Supports both $ prefix and @ prefix (schema.org compatibility) patterns
 */
export interface MDXFrontmatter {
  $type?: `https://mdx.org.ai/${string}`;
  $id?: string;
  '@context'?: 'https://schema.org' | 'https://mdx.org.ai';
  '@type'?: string;
  '@id'?: string;
  [key: string]: unknown;
}

/**
 * Represents an MDX request object for API-like MDX files
 */
export interface MDXRequest {
  json(): Promise<unknown>;
  [key: string]: unknown;
}

/**
 * Represents an MDX response object for API-like MDX files
 */
export interface MDXResponse {
  json(data: unknown): MDXResponse;
  [key: string]: unknown;
}
