import { MDXFrontmatter } from '../types.js';


export interface WorkflowFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface WorkerFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface WebPageFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface UIFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface ToolFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface StateMachineFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface StartupFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface PromptFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface ProductFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface PackageFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface FunctionFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface EvalFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface DirectoryFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface DataFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface ContentFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface ComponentFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface CodeFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface BlogPostFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface BlogFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface AssistantFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface AppFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface AgentFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface AIFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export interface APIFrontmatter extends MDXFrontmatter {
  type?: string;
  context?: string;
}

export type MDXType = WorkflowFrontmatter | WorkerFrontmatter | WebPageFrontmatter | UIFrontmatter | ToolFrontmatter | StateMachineFrontmatter | StartupFrontmatter | PromptFrontmatter | ProductFrontmatter | PackageFrontmatter | FunctionFrontmatter | EvalFrontmatter | DirectoryFrontmatter | DataFrontmatter | ContentFrontmatter | ComponentFrontmatter | CodeFrontmatter | BlogPostFrontmatter | BlogFrontmatter | AssistantFrontmatter | AppFrontmatter | AgentFrontmatter | AIFrontmatter | APIFrontmatter;
