import { extractFrontmatter, processYamlLd, isValidMDXLD } from "./lib/parser.js";
import { serializeMdxld } from "./lib/serializer.js";
import type { MDXLD } from "./types/index.js";

export type { MDXLD } from "./types/index.js";
export { isValidMDXLD } from "./lib/parser.js";

export function mdxld(input: string): MDXLD {
  const { frontmatter, content } = extractFrontmatter(input);
  const { data, metadata } = processYamlLd(frontmatter);

  const result = {
    ...metadata,
    data,
    content: content.trim()
  };

  if (!isValidMDXLD(result)) {
    throw new Error("Invalid MDXLD object structure");
  }

  return result;
}

export function stringify(mdxld: MDXLD): string {
  if (!isValidMDXLD(mdxld)) {
    throw new Error("Invalid MDXLD object structure");
  }

  const { data, content, ...metadata } = mdxld;
  return serializeMdxld(data, metadata, content);
}
