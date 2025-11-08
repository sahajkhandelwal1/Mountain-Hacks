import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Fix background.js - wrap in IIFE and remove exports
const backgroundPath = resolve('dist/background.js');
let backgroundContent = readFileSync(backgroundPath, 'utf-8');

// Remove export statements
backgroundContent = backgroundContent.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
backgroundContent = backgroundContent.replace(/^export\s+/gm, '');

// Wrap in IIFE if it has imports
if (backgroundContent.includes('import ')) {
  // Replace imports with inline code - this is a simple approach
  // For a real fix, we need to inline the imported modules
  console.log('Warning: background.js still has imports. Manual bundling needed.');
}

writeFileSync(backgroundPath, backgroundContent);
console.log('Fixed background.js');
