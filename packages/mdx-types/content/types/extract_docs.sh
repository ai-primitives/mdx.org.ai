#!/bin/bash

# Create MDX files for each type
declare -a types=("AI" "Agent" "App" "Assistant" "Blog" "BlogPost" "Code" "Component" "Content" "Data" "Directory" "Eval" "Function" "Package" "Product" "Prompt" "Startup" "StateMachine" "Tool" "UI" "WebPage" "Worker" "Workflow")

for type in "${types[@]}"; do
  # Extract content between backticks for each type, removing any existing frontmatter or headers
  content=$(awk -v type="$type" '/export const '"$type"'_DOC = `/ {p=1;next} /` as const;/ {p=0} p' ../../src/docs/index.ts | \
           sed -e '/^---$/,/^---$/d' | \
           sed -e '/^# '"$type"'$/d' | \
           sed -e '/^$/N;/^\n$/D')

  # Create MDX file with frontmatter and content
  cat > "${type}.mdx" << EOL
---
\$type: https://mdx.org.ai/${type}
---

# ${type}
${content}
EOL
done
