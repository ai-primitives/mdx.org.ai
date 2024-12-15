import { parse } from "yaml";
import type { MDXLD } from "../types/index.js";

const YAML_LD_PREFIX_PATTERN = /^[@$]/;
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export function isValidMDXLD(obj: any): obj is MDXLD {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.content === "string" &&
    (!obj.id || typeof obj.id === "string") &&
    (!obj.type || typeof obj.type === "string") &&
    (!obj.context || typeof obj.context === "string") &&
    (!obj.language || typeof obj.language === "string") &&
    (!obj.base || typeof obj.base === "string") &&
    (!obj.vocab || typeof obj.vocab === "string") &&
    (!obj.list || Array.isArray(obj.list)) &&
    (!obj.set || obj.set instanceof Set) &&
    (!obj.reverse || typeof obj.reverse === "boolean") &&
    typeof obj.data === "object"
  );
}

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
    if (typeof value !== "object" || value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    const processed: Record<string, any> = {};
    let hasSetProperty = false;

    for (const [k, v] of Object.entries(value)) {
      if (YAML_LD_PREFIX_PATTERN.test(k)) {
        const key = k.slice(1);
        if (key === "set") {
          hasSetProperty = true;
          processed[key] = new Set(Array.isArray(v) ? v : [v]);
        } else {
          processed[key] = processValue(v);
        }
      } else {
        processed[k] = processValue(v);
      }
    }

    return hasSetProperty ? processed.set : processed;
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (YAML_LD_PREFIX_PATTERN.test(key)) {
      const cleanKey = key.slice(1);
      if (cleanKey === "set") {
        metadata[cleanKey] = new Set(Array.isArray(value) ? value : [value]);
      } else {
        metadata[cleanKey] = processValue(value);
      }
    } else {
      data[key] = processValue(value);
    }
  }

  return { data, metadata };
}
