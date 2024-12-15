#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const { globSync } = require('glob');

// Use require.main to get the directory of the current script
const scriptDir = require.main?.filename ? path.dirname(require.main.filename) : __dirname;

/**
 * Extract description from content
 * @param {string} content - The MDX content
 * @returns {string} The extracted description
 */
function getDescription(content: string): string {
  // Find the first paragraph after the H1 heading
  const lines = content.split('\n');
  const headingIndex = lines.findIndex((line: string) => line.trim().startsWith('# '));
  if (headingIndex === -1) return '';

  const description = lines.slice(headingIndex + 1)
    .find((line: string) => line.trim() !== '')?.trim() || '';
  return description;
}

/**
 * Update frontmatter in MDX content
 * @param {string} content - The MDX content
 * @param {string} filename - The filename
 * @returns {string} The updated content
 */
function updateFrontmatter(content: string, filename: string): string {
  // Split content into frontmatter and body
  const parts = content.trim().split(/^---\s*$/m);

  // Initialize frontmatter
  /** @type {Record<string, any>} */
  let frontmatter: Record<string, any> = {};
  let body = '';

  if (parts.length >= 3) {
    // Existing frontmatter
    try {
      frontmatter = yaml.parse(parts[1].trim());
      body = parts.slice(2).join('---').trim();
    } catch (error: unknown) {
      console.error(`Error parsing frontmatter in ${filename}:`, error);
      return content;
    }
  } else {
    // No frontmatter, treat everything as body
    body = content.trim();
  }

  // Convert @ prefix to $ prefix
  /** @type {Record<string, any>} */
  const newFrontmatter: Record<string, any> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    const newKey = key.startsWith('@') ? key.replace('@', '$') : key;
    newFrontmatter[newKey] = value;
  }

  // Extract title from H1 heading
  const lines = body.split('\n');
  const titleMatch = lines.find(line => line.trim().startsWith('# '));
  const title = titleMatch ? titleMatch.replace(/^#\s+/, '').trim() : '';

  // Ensure required fields
  const name = filename.replace(/\.mdx$/, '').split('/').pop() || '';
  if (!newFrontmatter.$type) {
    newFrontmatter.$type = `https://mdx.org.ai/${name}`;
  }
  if (!newFrontmatter.title) {
    newFrontmatter.title = title || name;
  }
  if (!newFrontmatter.description) {
    newFrontmatter.description = getDescription(body);
  }

  // Optional schema.org fields
  if (newFrontmatter.$context || newFrontmatter['@context']) {
    newFrontmatter.$context = newFrontmatter.$context || newFrontmatter['@context'];
    delete newFrontmatter['@context'];
  }
  if (newFrontmatter.$id || newFrontmatter['@id']) {
    newFrontmatter.$id = newFrontmatter.$id || newFrontmatter['@id'];
    delete newFrontmatter['@id'];
  }

  // Generate new content
  const newContent = [
    '---',
    yaml.stringify(newFrontmatter),
    '---',
    '',
    body
  ].join('\n');

  return newContent;
}

// Main function
function main(): void {
  try {
    const contentDir = path.join(scriptDir, '..', 'packages/mdx-types/content/types');
    console.log(`[Info] Looking for MDX files in: ${contentDir}`);

    const mdxFiles = globSync('**/*.mdx', { cwd: contentDir });
    console.log(`[Info] Found ${mdxFiles.length} MDX files`);

    for (const file of mdxFiles) {
      const fullPath = path.join(contentDir, file);
      console.log(`[Info] Processing ${file}...`);

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const updatedContent = updateFrontmatter(content, file);
        fs.writeFileSync(fullPath, updatedContent);
        console.log(`[Success] Updated ${file}`);
      } catch (error: unknown) {
        console.error(`[Error] Failed to process ${file}:`, error);
      }
    }

    console.log('[Success] Completed frontmatter updates');
  } catch (error: unknown) {
    console.error('[Fatal Error] Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
