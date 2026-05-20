import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('server/routers.ts', 'utf8');

// Find the problematic lines and replace them
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Fix double-escaped \s\S in regex literals
  if (lines[i].includes('ESCALATE') && lines[i].includes('\\\\s\\\\S')) {
    lines[i] = lines[i]
      .replace(/\[\\\\s\\\\S\]/g, '[\\s\\S]')
      .replace(/<\\\\\//g, '<\\/');
    console.log(`Fixed line ${i + 1}:`, lines[i]);
  }
}

content = lines.join('\n');
writeFileSync('server/routers.ts', content);
console.log('Done');
