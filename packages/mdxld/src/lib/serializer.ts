import { stringify } from "yaml";

export function serializeMdxld(data: Record<string, any>, metadata: Record<string, any>, content: string): string {
  const frontmatter: Record<string, any> = { ...data };

  // Add metadata with $ prefix
  for (const [key, value] of Object.entries(metadata)) {
    frontmatter[`$${key}`] = value;
  }

  const yamlContent = stringify(frontmatter);
  return `---\n${yamlContent}---\n\n${content}`;
}
