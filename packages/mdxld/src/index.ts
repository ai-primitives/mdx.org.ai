import { extractFrontmatter, processYamlLd } from "./lib/parser.js";
import type { MDXLD } from "./types/index.js";

export type { MDXLD } from "./types/index.js";

export function mdxld(input: string): MDXLD {
  const { frontmatter, content } = extractFrontmatter(input);
  const { data, metadata } = processYamlLd(frontmatter);

  return {
    ...metadata,
    data,
    content: content.trim()
  };
}
