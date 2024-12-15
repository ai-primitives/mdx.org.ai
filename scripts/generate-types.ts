import { generateTypes } from '../packages/mdx-types/scripts/generate-types';

// Execute type generation for the main project
generateTypes().catch(error => {
  console.error('Failed to generate types:', {
    message: error.message,
    stack: error.stack,
    details: JSON.stringify(error, null, 2)
  });
  process.exit(1);
});
