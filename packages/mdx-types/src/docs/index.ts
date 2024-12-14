/**
 * Documentation strings for MDX types
 * These are bundled as const to preserve literal types
 */

export const API_DOC = `# API

You can build an API using MDX and web standards with the WHATWG Fetch API.

\`\`\`mdx
---
$type: https://mdx.org.ai/API
---

export const fetch = request => Response.json({ hello: 'world' })

\`\`\`

You can also export HTTP methods like \`GET\`, \`POST\`, \`PUT\`, \`DELETE\`, etc.

\`\`\`mdx
---
$id: 'https://api.example.com'
$type: 'https://mdx.org.ai/API'
---

export const POST = async request => {
  const body = await request.json()
  return Response.json({ success: true, body })
}
\`\`\`
` as const;

export const INDEX_DOC = `# Why MDX?

MDX brings together unstructured content via Markdown, typed schemas via JSON-LD, structured data via YAML frontmatter,
executable code via Javascript/Typescript, and UI components via JSX/React.

## JSON-LD Example

\`\`\`markdown
---
@id: https://example.com
@context: https://schema.org
@type: WebPage
title: Example Domain
---

# Example Domain

This domain is for use in illustrative examples in documents. You may use this
domain in literature without prior coordination or asking for permission.
\`\`\`

## MDX.org.ai Example

\`\`\`markdown
---
@id: https://example.com
@context: https://mdx.org.ai
@type: WebPage
title: Example Domain
---
\`\`\`
` as const;

export const AI_DOC = `---
$type: https://mdx.org.ai/AI
---

# AI

An AI component that can be used to create AI-powered applications.
` as const;

export const AGENT_DOC = `---
$type: https://mdx.org.ai/Agent
---

# Agent

An Agent component that can be used to create autonomous agents.
` as const;

export const APP_DOC = `---
$type: https://mdx.org.ai/App
---

# App

An application component that can be used to create MDX-powered applications.
` as const;

export const ASSISTANT_DOC = `---
$type: https://mdx.org.ai/Assistant
---

# Assistant

An assistant component that can be used to create AI assistants.
` as const;

export const BLOG_DOC = `---
$type: https://mdx.org.ai/Blog
---

# Blog

A blog component for creating MDX-powered blogs.
` as const;

export const BLOGPOST_DOC = `---
$type: https://mdx.org.ai/BlogPost
---

# BlogPost

A blog post component for MDX-powered blog content.
` as const;

export const CODE_DOC = `---
$type: https://mdx.org.ai/Code
---

# Code

A code component for MDX-powered code blocks and snippets.
` as const;

export const COMPONENT_DOC = `---
$type: https://mdx.org.ai/Component
---

# Component

A base component for creating reusable MDX components.
` as const;

export const CONTENT_DOC = `---
$type: https://mdx.org.ai/Content
---

# Content

A content component for managing MDX content.
` as const;

export const DATA_DOC = `---
$type: https://mdx.org.ai/Data
---

# Data

A data component for working with structured data in MDX.
` as const;

export const DIRECTORY_DOC = `---
$type: https://mdx.org.ai/Directory
---

# Directory

A directory component for organizing MDX content.
` as const;

export const EVAL_DOC = `---
$type: https://mdx.org.ai/Eval
---

# Eval

An evaluation component for MDX code execution.
` as const;

export const FUNCTION_DOC = `---
$type: https://mdx.org.ai/Function
---

# Function

A function component for creating reusable MDX functions.
` as const;

export const PACKAGE_DOC = `---
$type: https://mdx.org.ai/Package
---

# Package

A package component for creating MDX packages.
` as const;

export const PRODUCT_DOC = `---
$type: https://mdx.org.ai/Product
---

# Product

A product component for creating product documentation.
` as const;

export const PROMPT_DOC = `---
$type: https://mdx.org.ai/Prompt
---

# Prompt

A prompt component for AI interactions.
` as const;

export const STARTUP_DOC = `---
$type: https://mdx.org.ai/Startup
---

# Startup

A startup component for initializing MDX applications.
` as const;

export const STATEMACHINE_DOC = `---
$type: https://mdx.org.ai/StateMachine
---

# StateMachine

A state machine component for managing application state.
` as const;

export const TOOL_DOC = `---
$type: https://mdx.org.ai/Tool
---

# Tool

A tool component for creating MDX-powered tools.
` as const;

export const UI_DOC = `---
$type: https://mdx.org.ai/UI
---

# UI

A UI component for creating user interfaces.
` as const;

export const WEBPAGE_DOC = `---
$type: https://mdx.org.ai/WebPage
---

# WebPage

A web page component for creating MDX-powered pages.
` as const;

export const WORKER_DOC = `---
$type: https://mdx.org.ai/Worker
---

# Worker

A worker component for background processing.
` as const;

export const WORKFLOW_DOC = `---
$type: https://mdx.org.ai/Workflow
---

# Workflow

A workflow component for creating automated processes.
` as const;

export const MDXAI_DOC = `# mdxai

[mdxai](https://npmjs.com/mdxai) is a library for generating and editing MDX @context and @type from [mdxld](./mdxld).
` as const;

export const MDXE_DOC = `# mdxe

A library for editing MDX files with type safety.

## Features

## Installation

## Usage
` as const;

export const MDX_DOCS = {
  AI: AI_DOC,
  API: API_DOC,
  Agent: AGENT_DOC,
  App: APP_DOC,
  Assistant: ASSISTANT_DOC,
  Blog: BLOG_DOC,
  BlogPost: BLOGPOST_DOC,
  Code: CODE_DOC,
  Component: COMPONENT_DOC,
  Content: CONTENT_DOC,
  Data: DATA_DOC,
  Directory: DIRECTORY_DOC,
  Eval: EVAL_DOC,
  Function: FUNCTION_DOC,
  Package: PACKAGE_DOC,
  Product: PRODUCT_DOC,
  Prompt: PROMPT_DOC,
  Startup: STARTUP_DOC,
  StateMachine: STATEMACHINE_DOC,
  Tool: TOOL_DOC,
  UI: UI_DOC,
  WebPage: WEBPAGE_DOC,
  Worker: WORKER_DOC,
  Workflow: WORKFLOW_DOC
} as const;

export const getDocumentationByType = (type: string): string => {
  const key = type.replace('https://mdx.org.ai/', '');
  return MDX_DOCS[key as keyof typeof MDX_DOCS] || '';
};
