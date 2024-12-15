import { parse } from "yaml";

const YAML_LD_PREFIX_PATTERN = /^[@$]/;
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export function extractFrontmatter(content: string) {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { frontmatter: "", content };
  }
  return {
    frontmatter: match[1],
    content: match[2]
  };
}

export function processYamlLd(yamlContent: string) {
  const parsed = parse(yamlContent);
  if (typeof parsed !== "object" || parsed === null) {
    return { data: {}, metadata: {} };
  }

  const data: Record<string, any> = {};
  const metadata: Record<string, any> = {};

  function processValue(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    const processed: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (YAML_LD_PREFIX_PATTERN.test(k)) {
        // Handle nested YAML-LD properties
        processed[k.slice(1)] = processValue(v);
      } else {
        processed[k] = processValue(v);
      }
    }
    return processed;
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (YAML_LD_PREFIX_PATTERN.test(key)) {
      // Remove @ or $ prefix and store in metadata
      metadata[key.slice(1)] = processValue(value);
    } else {
      data[key] = processValue(value);
    }
  }

  return { data, metadata };
}
