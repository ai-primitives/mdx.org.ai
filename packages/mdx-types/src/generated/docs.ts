// Auto-generated documentation exports
export const Workflow_DOC = {
  content: "# Workflow",
  examples: []
} as const;

export const Worker_DOC = {
  content: "# Worker",
  examples: []
} as const;

export const WebPage_DOC = {
  content: "# WebPage",
  examples: []
} as const;

export const UI_DOC = {
  content: "# UI",
  examples: []
} as const;

export const Tool_DOC = {
  content: "# Tool",
  examples: []
} as const;

export const StateMachine_DOC = {
  content: "# StateMachine",
  examples: []
} as const;

export const Startup_DOC = {
  content: "# Startup",
  examples: []
} as const;

export const Prompt_DOC = {
  content: "# Prompt",
  examples: []
} as const;

export const Product_DOC = {
  content: "# Product",
  examples: []
} as const;

export const Package_DOC = {
  content: "# Package",
  examples: []
} as const;

export const Function_DOC = {
  content: "# Function",
  examples: []
} as const;

export const Eval_DOC = {
  content: "# Eval",
  examples: []
} as const;

export const Directory_DOC = {
  content: "# Directory",
  examples: []
} as const;

export const Data_DOC = {
  content: "# Data",
  examples: []
} as const;

export const Content_DOC = {
  content: "# Content",
  examples: []
} as const;

export const Component_DOC = {
  content: "# Component",
  examples: []
} as const;

export const Code_DOC = {
  content: "# Code",
  examples: []
} as const;

export const BlogPost_DOC = {
  content: "# BlogPost",
  examples: []
} as const;

export const Blog_DOC = {
  content: "# Blog",
  examples: []
} as const;

export const Assistant_DOC = {
  content: "# Assistant",
  examples: []
} as const;

export const App_DOC = {
  content: "# App",
  examples: []
} as const;

export const Agent_DOC = {
  content: "# Agent",
  examples: []
} as const;

export const AI_DOC = {
  content: "# AI",
  examples: []
} as const;

export const Unknown_DOC = {
  content: "import { Cards } from 'nextra/components'\nimport { SiMarkdown, SiYaml, SiJson, SiJavascript, SiReact } from 'react-icons/si'\nimport { HiOutlineSparkles } from 'react-icons/hi2'\n\n# Why MDX?\n\nMDX brings together unstructured content via Markdown, typed schemas via JSON-LD, structured data via YAML frontmatter, \nexecutable code via Javascript/Typescript, and UI components via JSX/React.\n\n<Cards num={5}>\n  <Cards.Card icon={<HiOutlineSparkles />} title='Generative AI' href='#generative-ai'/>\n  <Cards.Card icon={<SiMarkdown />} title='Markdown' href='#markdown'/>\n  <Cards.Card icon={<SiYaml />} title='YAML' href='#yaml'/>\n  <Cards.Card icon={<SiJson />} title='JSON-LD' href='#json-ld'/>\n  <Cards.Card icon={<SiJavascript />} title='Javascript / Typescript' href='#javascript-typescript'/>\n  <Cards.Card icon={<SiReact />} title='JSX / React' href='#jsx-react'/>\n</Cards>\n\n\n## Generative AI\n\nMost of the internet content that Large Language Models are trained on is in Markdown. Anytime you interact with ChatGPT or any other LLM,\nit responds using Markdown syntax to represent the rich formatting of the content.\n\n## Markdown\n\nMDX is fully-compatible extension to Markdown, and Markdown is the native language of Large Language Models. Anytime you interact with ChatGPT or any other LLM,\nit responds using Markdown to represent the rich formatting of the content.\n\n## JSON-LD\n\nJSON-LD is a lightweight linked data format that allows you to describe your data in a way that is both human-readable and machine-readable.\n\n```markdown\n---\n@id: https://example.com\n@context: https://schema.org\n@type: WebPage\ntitle: Example Domain\n---\n\n# Example Domain\n\nThis domain is for use in illustrative examples in documents. You may use this\ndomain in literature without prior coordination or asking for permission.\n\n[More information...](https://www.iana.org/domains/example)\n\n```\n\nWhile the most @context for JSON-LD is [schema.org](https://schema.org), you can use any @context that you want, and [mdx.org.ai](https://mdx.org.ai) \nwas created to extend [schema.org](https://schema.org) to provide a @context for MDX file types.  For example:\n\n```markdown\n---\n@id: https://\n@context: https://mdx.org.ai\n@type: WebPage\ntitle: Example Domain\n---\n```\n\n## YAML\n\nYAML is a human-friendly data serialization language that is fully compatible with JSON. YAML frontmatter is a simple way to add structured data to your Markdown files.\n\n```markdown\n---\n@type: https://mdx.org.ai/SlideDeck\ntitle: Example Domain\n---\n```\n\n## Javascript / Typescript\n\n\n## JSX / React",
  examples: []
} as const;

export const API_DOC = {
  content: "export const fetch = request => Response.json({ hello: 'world' })",
  examples: []
} as const;

export const documentation = {
  Workflow: Workflow_DOC,
  Worker: Worker_DOC,
  WebPage: WebPage_DOC,
  UI: UI_DOC,
  Tool: Tool_DOC,
  StateMachine: StateMachine_DOC,
  Startup: Startup_DOC,
  Prompt: Prompt_DOC,
  Product: Product_DOC,
  Package: Package_DOC,
  Function: Function_DOC,
  Eval: Eval_DOC,
  Directory: Directory_DOC,
  Data: Data_DOC,
  Content: Content_DOC,
  Component: Component_DOC,
  Code: Code_DOC,
  BlogPost: BlogPost_DOC,
  Blog: Blog_DOC,
  Assistant: Assistant_DOC,
  App: App_DOC,
  Agent: Agent_DOC,
  AI: AI_DOC,
  Unknown: Unknown_DOC,
  API: API_DOC
} as const;

export const getDocumentationByType = (type: string): typeof documentation[keyof typeof documentation] | undefined => {
  const key = type.replace('https://mdx.org.ai/', '');
  return documentation[key as keyof typeof documentation];
};