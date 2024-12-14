/**
 * Type definitions for specific MDX types
 */
import type { MDXFrontmatter } from '../types.js';

export interface AIMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/AI';
}

export interface APIMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/API';
}

export interface AgentMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Agent';
}

export interface AppMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/App';
}

export interface AssistantMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Assistant';
}

export interface BlogMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Blog';
}

export interface BlogPostMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/BlogPost';
}

export interface CodeMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Code';
}

export interface ComponentMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Component';
}

export interface ContentMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Content';
}

export interface DataMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Data';
}

export interface DirectoryMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Directory';
}

export interface EvalMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Eval';
}

export interface FunctionMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Function';
}

export interface PackageMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Package';
}

export interface ProductMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Product';
}

export interface PromptMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Prompt';
}

export interface StartupMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Startup';
}

export interface StateMachineMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/StateMachine';
}

export interface ToolMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Tool';
}

export interface UIMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/UI';
}

export interface WebPageMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/WebPage';
}

export interface WorkerMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Worker';
}

export interface WorkflowMatter extends MDXFrontmatter {
  $type: 'https://mdx.org.ai/Workflow';
}

// Type guard to check if a frontmatter matches a specific MDX type
export function isMDXType<T extends MDXFrontmatter>(
  matter: MDXFrontmatter,
  type: string
): matter is T {
  return matter.$type === `https://mdx.org.ai/${type}`;
}
