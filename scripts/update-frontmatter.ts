import * as fs from 'fs';
import * as path from 'path';
import { parse, stringify } from 'yaml';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDescription(content: string): string {
  // Find the first paragraph after the H1 heading
  const lines = content.split('\n');
  const headingIndex = lines.findIndex(line => line.trim().startsWith('# '));
  if (headingIndex === -1) return '';

  const description = lines.slice(headingIndex + 1)
    .find(line => line.trim() !== '')?.trim() || '';
  return description;
}

function updateFrontmatter(content: string, filename: string): string {
  // Split content into frontmatter and body
  const parts = content.trim().split(/^---\s*$/m);

  // Initialize frontmatter
  let frontmatter: Record<string, any> = {};
  let body = '';

  if (parts.length >= 3) {
    // Existing frontmatter
    try {
      frontmatter = parse(parts[1].trim());
      body = parts.slice(2).join('---').trim();
    } catch (e) {
      console.error(`Error parsing frontmatter in ${filename}:`, e);
      return content;
    }
  } else {
    // No frontmatter, treat everything as body
    body = content.trim();
  }

  // Convert @ prefix to $ prefix
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
    stringify(newFrontmatter),
    '---',
    '',
    body
  ].join('\n');

  return newContent;
}

// Main function
function main() {
  try {
    const contentDir = path.join(__dirname, '..', 'packages/mdx-types/content/types');
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
      } catch (e) {
        console.error(`[Error] Failed to process ${file}:`, e);
      }
    }

    console.log('[Success] Completed frontmatter updates');
  } catch (error) {
    console.error('[Fatal Error] Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
