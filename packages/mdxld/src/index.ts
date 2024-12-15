import { parse } from "yaml";

export type { MDXLD } from "./types/index.js";

export function mdxld(input: string) {
  // Implementation coming in next step
  return {
    content: input,
    data: {}
  };
}
