import { parse } from 'yaml';

/**
 * Parse YAML content safely
 * @param {string} content - YAML content to parse
 * @returns {object|null} Parsed YAML object or null if parsing fails
 */
export function parseYaml(content) {
  try {
    if (!content || typeof content !== 'string') {
      console.warn('Invalid YAML content:', content);
      return null;
    }

    const parsed = parse(content);
    if (!parsed || typeof parsed !== 'object') {
      console.warn('YAML parsing resulted in invalid object:', parsed);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    return null;
  }
}
