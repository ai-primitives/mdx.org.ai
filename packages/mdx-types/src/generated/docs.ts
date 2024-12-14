// Auto-generated documentation exports
export const DOC_0 = {
  content: "import { Cards } from 'nextra/components'\nimport { SiMarkdown, SiYaml, SiJson, SiJavascript, SiReact } from 'react-icons/si'\nimport { HiOutlineSparkles } from 'react-icons/hi2'\n\n# Why MDX?\n\nMDX brings together unstructured content via Markdown, typed schemas via JSON-LD, structured data via YAML frontmatter, \nexecutable code via Javascript/Typescript, and UI components via JSX/React.\n\n<Cards num={5}>\n  <Cards.Card icon={<HiOutlineSparkles />} title='Generative AI' href='#generative-ai'/>\n  <Cards.Card icon={<SiMarkdown />} title='Markdown' href='#markdown'/>\n  <Cards.Card icon={<SiYaml />} title='YAML' href='#yaml'/>\n  <Cards.Card icon={<SiJson />} title='JSON-LD' href='#json-ld'/>\n  <Cards.Card icon={<SiJavascript />} title='Javascript / Typescript' href='#javascript-typescript'/>\n  <Cards.Card icon={<SiReact />} title='JSX / React' href='#jsx-react'/>\n</Cards>\n\n\n## Generative AI\n\nMost of the internet content that Large Language Models are trained on is in Markdown. Anytime you interact with ChatGPT or any other LLM,\nit responds using Markdown syntax to represent the rich formatting of the content.\n\n## Markdown\n\nMDX is fully-compatible extension to Markdown, and Markdown is the native language of Large Language Models. Anytime you interact with ChatGPT or any other LLM,\nit responds using Markdown to represent the rich formatting of the content.\n\n## JSON-LD\n\nJSON-LD is a lightweight linked data format that allows you to describe your data in a way that is both human-readable and machine-readable.\n\n```markdown\n---\n@id: https://example.com\n@context: https://schema.org\n@type: WebPage\ntitle: Example Domain\n---\n\n# Example Domain\n\nThis domain is for use in illustrative examples in documents. You may use this\ndomain in literature without prior coordination or asking for permission.\n\n[More information...](https://www.iana.org/domains/example)\n\n```\n\nWhile the most @context for JSON-LD is [schema.org](https://schema.org), you can use any @context that you want, and [mdx.org.ai](https://mdx.org.ai) \nwas created to extend [schema.org](https://schema.org) to provide a @context for MDX file types.  For example:\n\n```markdown\n---\n@id: https://\n@context: https://mdx.org.ai\n@type: WebPage\ntitle: Example Domain\n---\n```\n\n## YAML\n\nYAML is a human-friendly data serialization language that is fully compatible with JSON. YAML frontmatter is a simple way to add structured data to your Markdown files.\n\n```markdown\n---\n@type: https://mdx.org.ai/SlideDeck\ntitle: Example Domain\n---\n```\n\n## Javascript / Typescript\n\n\n## JSX / React",
  examples: []
} as const;

export const DOC_1 = {
  content: "",
  examples: []
} as const;

export const DOC_2 = {
  content: "",
  examples: []
} as const;

export const DOC_3 = {
  content: "",
  examples: []
} as const;

export const DOC_4 = {
  content: "",
  examples: []
} as const;

export const DOC_5 = {
  content: "",
  examples: []
} as const;

export const DOC_6 = {
  content: "",
  examples: []
} as const;

export const DOC_7 = {
  content: "",
  examples: []
} as const;

export const DOC_8 = {
  content: "",
  examples: []
} as const;

export const DOC_9 = {
  content: "",
  examples: []
} as const;

export const DOC_10 = {
  content: "",
  examples: []
} as const;

export const DOC_11 = {
  content: "",
  examples: []
} as const;

export const DOC_12 = {
  content: "",
  examples: []
} as const;

export const DOC_13 = {
  content: "",
  examples: []
} as const;

export const DOC_14 = {
  content: "",
  examples: []
} as const;

export const DOC_15 = {
  content: "",
  examples: []
} as const;

export const DOC_16 = {
  content: "",
  examples: []
} as const;

export const DOC_17 = {
  content: "",
  examples: []
} as const;

export const DOC_18 = {
  content: "",
  examples: []
} as const;

export const DOC_19 = {
  content: "",
  examples: []
} as const;

export const DOC_20 = {
  content: "",
  examples: []
} as const;

export const DOC_21 = {
  content: "",
  examples: []
} as const;

export const DOC_22 = {
  content: "",
  examples: []
} as const;

export const DOC_23 = {
  content: "# API\n\nYou can build an API using MDX and web standards with the WHATWG Fetch API.\n\n```mdx\n---\n$type: https://mdx.org.ai/API\n---\n\nexport const fetch = request => Response.json({ hello: 'world' })\n\n```\n\nYou can also export HTTP methods like `GET`, `POST`, `PUT`, `DELETE`, etc.\n\n```mdx\n---\n$id: 'https://api.example.com'\n$type: 'https://mdx.org.ai/API'\n---\n\nexport const POST = async request => {\n  const body = await request.json()\n  return Response.json({ success: true, body })\n}\n```",
  examples: ["---\n$type: https://mdx.org.ai/API\n---\n\nexport const fetch = request => Response.json({ hello: 'world' })\n","---\n$id: 'https://api.example.com'\n$type: 'https://mdx.org.ai/API'\n---\n\nexport const POST = async request => {\n  const body = await request.json()\n  return Response.json({ success: true, body })\n}"]
} as const;

export const DOC_24 = {
  content: "",
  examples: []
} as const;

export const documentation = {
  DOC_0,
  DOC_1,
  DOC_2,
  DOC_3,
  DOC_4,
  DOC_5,
  DOC_6,
  DOC_7,
  DOC_8,
  DOC_9,
  DOC_10,
  DOC_11,
  DOC_12,
  DOC_13,
  DOC_14,
  DOC_15,
  DOC_16,
  DOC_17,
  DOC_18,
  DOC_19,
  DOC_20,
  DOC_21,
  DOC_22,
  DOC_23,
  DOC_24
} as const;