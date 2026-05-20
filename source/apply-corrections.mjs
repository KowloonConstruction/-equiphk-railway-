import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const db = await createConnection(process.env.DATABASE_URL);

const sql = readFileSync('/home/ubuntu/category_corrections_v3.sql', 'utf8');
const statements = sql.split('\n').filter(l => l.trim().startsWith('UPDATE'));

console.log(`Applying ${statements.length} corrections...`);

let success = 0, failed = 0;
for (const stmt of statements) {
  try {
    await db.query(stmt);
    success++;
  } catch (e) {
    console.error(`FAILED: ${stmt}`);
    console.error(e.message);
    failed++;
  }
}

console.log(`Done: ${success} succeeded, ${failed} failed`);
await db.end();
