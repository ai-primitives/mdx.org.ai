import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a temporary docs file with the original content
const originalDocs = `
export const AI_DOC = \`
# AI
An AI component that can be used to generate content using language models.
\` as const;

export const Agent_DOC = \`
# Agent
An autonomous agent that can perform tasks and make decisions.
\` as const;

export const App_DOC = \`
# App
A full application with routing and state management.
\` as const;

export const Assistant_DOC = \`
# Assistant
An AI assistant that can help users with tasks.
\` as const;

export const Blog_DOC = \`
# Blog
A collection of blog posts and articles.
\` as const;

export const BlogPost_DOC = \`
# BlogPost
An individual blog post with content and metadata.
\` as const;

export const Code_DOC = \`
# Code
A code block or snippet with syntax highlighting.
\` as const;

export const Component_DOC = \`
# Component
A reusable UI component with props and styling.
\` as const;

export const Content_DOC = \`
# Content
Generic content that can be rendered in MDX.
\` as const;

export const Data_DOC = \`
# Data
A data structure or collection.
\` as const;

export const Directory_DOC = \`
# Directory
A collection of files and subdirectories.
\` as const;

export const Eval_DOC = \`
# Eval
A component that evaluates and executes code.
\` as const;

export const Function_DOC = \`
# Function
A reusable function or utility.
\` as const;

export const Package_DOC = \`
# Package
A software package with dependencies and scripts.
\` as const;

export const Product_DOC = \`
# Product
A product or service with pricing and features.
\` as const;

export const Prompt_DOC = \`
# Prompt
A prompt for generating AI content.
\` as const;

export const Startup_DOC = \`
# Startup
A startup company or project.
\` as const;

export const StateMachine_DOC = \`
# StateMachine
A state machine with transitions and actions.
\` as const;

export const Tool_DOC = \`
# Tool
A tool or utility for specific tasks.
\` as const;

export const UI_DOC = \`
# UI
A user interface component or layout.
\` as const;

export const WebPage_DOC = \`
# WebPage
A web page with content and metadata.
\` as const;

export const Worker_DOC = \`
# Worker
A background worker or process.
\` as const;

export const Workflow_DOC = \`
# Workflow
A sequence of steps or actions.
\` as const;
`

const types = [
  'AI',
  'Agent',
  'App',
  'Assistant',
  'Blog',
  'BlogPost',
  'Code',
  'Component',
  'Content',
  'Data',
  'Directory',
  'Eval',
  'Function',
  'Package',
  'Product',
  'Prompt',
  'Startup',
  'StateMachine',
  'Tool',
  'UI',
  'WebPage',
  'Worker',
  'Workflow'
]

function extractDocContent(content: string, type: string): string {
  const regex = new RegExp(`export const ${type}_DOC = \`([\\s\\S]*?)\` as const;`)
  const match = content.match(regex)
  if (!match) return ''

  const docContent = match[1]
  return docContent
    .split('\n')
    .filter(line => !line.match(/^---$/)) // Remove frontmatter markers
    .filter(line => !line.match(new RegExp(`^# ${type}$`))) // Remove type headers
    .filter((line, index, arr) => !(line === '' && arr[index + 1] === '')) // Remove double empty lines
    .join('\n')
    .trim()
}

async function extractDocs() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../content/types')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Process each type
    for (const type of types) {
      const docContent = extractDocContent(originalDocs, type)
      if (!docContent) {
        console.warn(`No documentation found for type: ${type}`)
        continue
      }

      // Create MDX file with frontmatter
      const mdxContent = `---
$type: https://mdx.org.ai/${type}
---

# ${type}
${docContent}
`
      const outputPath = path.join(outputDir, `${type}.mdx`)
      fs.writeFileSync(outputPath, mdxContent)
      console.log(`Created ${type}.mdx`)
    }

    console.log('Documentation extraction complete')
  } catch (error) {
    console.error('Error extracting documentation:', error)
    process.exit(1)
  }
}

extractDocs()
