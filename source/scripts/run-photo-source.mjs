/**
 * Bulk Photo Source Script
 * 
 * Calls the productImageScraper directly for all items without photos,
 * processing in batches of 5 with progress tracking.
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { appendFileSync, writeFileSync, existsSync, readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const BATCH_SIZE = 5;
const LOG_FILE = '/home/ubuntu/equiphk/scripts/photo-source-log.txt';
const PROGRESS_FILE = '/home/ubuntu/equiphk/scripts/photo-source-progress.json';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

async function main() {
  // Dynamic import of the scraper (it's TypeScript, need tsx)
  const { fetchProductImageFromWeb } = await import('../server/productImageScraper.ts');

  const conn = await mysql.createConnection(DATABASE_URL);

  // Get all items that need photos (no imageUrl or placeholder)
  const [rows] = await conn.execute(`
    SELECT id, name, brand, model 
    FROM equipment_items 
    WHERE (imageUrl IS NULL OR imageUrl = '' OR imageUrl LIKE '%placeholder%')
    AND isActive = 1
    ORDER BY id
  `);

  log(`Found ${rows.length} items needing photos`);

  // Load progress if resuming
  let startIdx = 0;
  let stats = { succeeded: 0, failed: 0, skipped: 0, total: rows.length };
  if (existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    startIdx = progress.nextIndex || 0;
    stats = progress.stats || stats;
    log(`Resuming from index ${startIdx}`);
  }

  const totalBatches = Math.ceil((rows.length - startIdx) / BATCH_SIZE);
  let batchNum = 0;

  for (let i = startIdx; i < rows.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = rows.slice(i, i + BATCH_SIZE);
    log(`Batch ${batchNum}/${totalBatches} — processing ${batch.length} items`);

    for (const item of batch) {
      const brand = item.brand || '';
      const model = item.model || '';
      const itemName = item.name || '';

      if (!brand && !model && !itemName) {
        log(`  SKIP ID ${item.id}: no brand/model/name`);
        stats.skipped++;
        continue;
      }

      try {
        const cdnUrl = await fetchProductImageFromWeb(brand, model, itemName);
        if (cdnUrl) {
          await conn.execute(
            'UPDATE equipment_items SET pendingImageUrl = ?, imageApprovalStatus = ? WHERE id = ?',
            [cdnUrl, 'pending', item.id]
          );
          log(`  ✓ ID ${item.id}: ${itemName} — queued for approval`);
          stats.succeeded++;
        } else {
          log(`  ✗ ID ${item.id}: ${itemName} — no image found`);
          stats.failed++;
        }
      } catch (err) {
        log(`  ✗ ID ${item.id}: ${itemName} — ${err.message}`);
        stats.failed++;
      }
    }

    // Save progress
    writeFileSync(PROGRESS_FILE, JSON.stringify({
      nextIndex: i + BATCH_SIZE,
      stats,
      timestamp: new Date().toISOString(),
    }));

    // Small delay between batches
    await new Promise(r => setTimeout(r, 500));
  }

  await conn.end();

  log(`\n=== PHOTO SOURCE COMPLETE ===`);
  log(`Total items: ${stats.total}`);
  log(`Succeeded (queued for approval): ${stats.succeeded}`);
  log(`Failed (no image found): ${stats.failed}`);
  log(`Skipped: ${stats.skipped}`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
