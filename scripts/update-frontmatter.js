import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, stringify } from 'yaml';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDescription(filename) {
  const name = filename.replace(/\.mdx$/, '').split('/').pop() || '';
  const humanized = name
    .replace(/([A-Z])/g, ' $1')
    .trim();
  return `Type definition for ${humanized.toLowerCase()} in MDX`;
}

function updateFrontmatter(content, filename) {
  // Split content into frontmatter and body
  const parts = content.trim().split(/^---\s*$/m);

  // Initialize frontmatter
  let frontmatter = {};
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
  const newFrontmatter = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    const newKey = key.startsWith('@') ? key.replace('@', '$') : key;
    newFrontmatter[newKey] = value;
  }

  // Ensure required fields
  const name = filename.replace(/\.mdx$/, '').split('/').pop() || '';
  if (!newFrontmatter.$type) {
    newFrontmatter.$type = `https://mdx.org.ai/${name}`;
  }
  if (!newFrontmatter.title) {
    newFrontmatter.title = name;
  }
  if (!newFrontmatter.description) {
    newFrontmatter.description = getDescription(filename);
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
  const baseDir = process.argv[2] || 'content';
  const targetDir = path.join(__dirname, '..', baseDir);
  console.log(`Processing files in: ${targetDir}`);

  const mdxFiles = globSync('**/*.mdx', { cwd: targetDir });
  console.log('Found files:', mdxFiles);

  for (const file of mdxFiles) {
    const fullPath = path.join(targetDir, file);
    console.log(`Processing ${file}...`);

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const updatedContent = updateFrontmatter(content, fullPath);
      fs.writeFileSync(fullPath, updatedContent);
      console.log(`Updated ${file}`);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
}

// Run the script
main();
