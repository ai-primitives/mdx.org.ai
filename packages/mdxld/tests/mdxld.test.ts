import { describe, it, expect } from "vitest";
import { mdxld, stringify, isValidMDXLD } from "../src/index.js";

const exampleMdx = `---
$type: BlogPost
$id: https://example.com/post
$language: en
$base: https://example.com/
$vocab: https://schema.org/
title: My First Post
tags: ["mdx", "yaml-ld"]
authors: {
  $list: [
    "https://example.com/authors/1",
    "https://example.com/authors/2"
  ]
}
categories: {
  $set: ["tech", "documentation"]
}
---

# My First Post

Content goes here...
`;

describe("mdxld", () => {
  it("should parse MDX with YAML-LD frontmatter", () => {
    const result = mdxld(exampleMdx);
    expect(result.type).toBe("BlogPost");
    expect(result.id).toBe("https://example.com/post");
    expect(result.language).toBe("en");
    expect(result.base).toBe("https://example.com/");
    expect(result.vocab).toBe("https://schema.org/");
    expect(result.data.title).toBe("My First Post");
    expect(result.data.tags).toEqual(["mdx", "yaml-ld"]);
    expect(Array.isArray(result.list)).toBe(true);
    expect(result.list).toEqual([
      "https://example.com/authors/1",
      "https://example.com/authors/2"
    ]);
    expect(result.set instanceof Set).toBe(true);
    expect([...result.set]).toEqual(["tech", "documentation"]);
  });

  it("should handle empty frontmatter", () => {
    const result = mdxld("# Just content\n\nNo frontmatter");
    expect(result.data).toEqual({});
    expect(result.content).toBe("# Just content\n\nNo frontmatter");
  });

  it("should validate MDXLD objects", () => {
    const valid = {
      type: "Test",
      data: {},
      content: "test"
    };
    const invalid = {
      type: "Test",
      data: "not an object",
      content: "test"
    };

    expect(isValidMDXLD(valid)).toBe(true);
    expect(isValidMDXLD(invalid)).toBe(false);
  });

  it("should round-trip MDX content", () => {
    const parsed = mdxld(exampleMdx);
    const serialized = stringify(parsed);
    const reparsed = mdxld(serialized);

    expect(reparsed.type).toBe(parsed.type);
    expect(reparsed.id).toBe(parsed.id);
    expect(reparsed.language).toBe(parsed.language);
    expect(reparsed.base).toBe(parsed.base);
    expect(reparsed.vocab).toBe(parsed.vocab);
    expect(reparsed.data.title).toBe(parsed.data.title);
    expect(reparsed.data.tags).toEqual(parsed.data.tags);
    expect([...reparsed.set]).toEqual([...parsed.set]);
  });
});
