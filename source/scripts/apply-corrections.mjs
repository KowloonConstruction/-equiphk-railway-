/**
 * Apply Audit Corrections to Database
 * 
 * Takes the LLM audit corrections (which used 20% markup baseline)
 * and adjusts pricing with tiered category markups:
 * 
 * - Power Tools: 40% above UK
 * - Scaffolding & Access: 40%
 * - Safety Equipment: 40%
 * - Hand Tools & Accessories: 40%
 * - Chainsaws & Outdoor: 40%
 * - Batteries & Power (excl generators): 40%
 * - Compressors & Air: 40%
 * - Measuring & Leveling: 40%
 * - Welding & Cutting: 40%
 * - Pneumatic Tools: 35%
 * - Hydraulic Equipment: 35% (heavy plant)
 * - Pumps & Fluid Handling: 35% (heavy plant)
 * - Generators (sub-cat 54): 30% (heavy plant, high daily rate)
 * - Specialized Equipment: 50% (marine/specialist, limited competition)
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const LOG_FILE = '/home/ubuntu/equiphk/scripts/apply-log.txt';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

// Category ID -> markup multiplier
// The LLM audit used 1.20 (20% markup). We need to adjust to the tiered rates.
// To convert: newRate = auditRate / 1.20 * newMultiplier
const CATEGORY_MARKUP = {
  1:  1.40,  // Power Tools
  2:  1.40,  // Scaffolding & Access
  3:  1.40,  // Safety Equipment
  4:  1.40,  // Measuring & Leveling
  5:  1.40,  // Welding & Cutting
  6:  1.35,  // Pneumatic Tools
  7:  1.35,  // Hydraulic Equipment (heavy plant)
  8:  1.35,  // Pumps & Fluid Handling (heavy plant)
  9:  1.40,  // Chainsaws & Outdoor
  10: 1.40,  // Batteries & Power
  11: 1.40,  // Hand Tools & Accessories
  12: 1.40,  // Compressors & Air
  13: 1.50,  // Specialized Equipment (marine/specialist)
};

// Sub-category overrides
const SUBCATEGORY_MARKUP = {
  54: 1.30,  // Generators (heavy plant, high daily rate items)
};

// The LLM used 1.20 as baseline
const LLM_BASELINE = 1.20;

function adjustRate(rate, categoryId, subCategoryId) {
  if (!rate || rate <= 0) return rate;
  
  // Check sub-category override first
  const subMarkup = SUBCATEGORY_MARKUP[subCategoryId];
  const catMarkup = CATEGORY_MARKUP[categoryId] || 1.40;
  const markup = subMarkup || catMarkup;
  
  // Convert from LLM's 20% markup to the tiered markup
  const ukBaseRate = rate / LLM_BASELINE;
  const adjustedRate = Math.round(ukBaseRate * markup);
  
  return adjustedRate;
}

async function main() {
  const corrections = JSON.parse(readFileSync('/home/ubuntu/equiphk/scripts/audit-corrections.json', 'utf8'));
  const items = JSON.parse(readFileSync('/home/ubuntu/equiphk/scripts/all-items.json', 'utf8'));
  const itemMap = Object.fromEntries(items.map(i => [i.id, i]));

  log(`Loaded ${corrections.length} corrections and ${items.length} items`);

  const conn = await mysql.createConnection(DATABASE_URL);
  
  let brandUpdates = 0;
  let modelUpdates = 0;
  let rateUpdates = 0;
  let errors = 0;
  const changeLog = [];

  for (const c of corrections) {
    const orig = itemMap[c.id];
    if (!orig) {
      log(`  SKIP: ID ${c.id} not found in original data`);
      continue;
    }

    const categoryId = parseInt(orig.categoryId);
    const subCategoryId = orig.subCategoryId ? parseInt(orig.subCategoryId) : null;

    // Adjust rates with tiered markup
    const adjustedDaily = adjustRate(c.dailyRate, categoryId, subCategoryId);
    const adjustedWeekly = adjustedDaily ? adjustedDaily * 5 : null;
    const adjustedMonthly = adjustedDaily ? adjustedDaily * 20 : null;

    // Build SET clauses
    const sets = [];
    const params = [];

    // Brand
    if (c.brand !== orig.brand && c.brand !== undefined) {
      sets.push('brand = ?');
      params.push(c.brand);
      brandUpdates++;
    }

    // Model
    if (c.model !== orig.model && c.model !== undefined && c.modelConfidence !== 'low') {
      sets.push('model = ?');
      params.push(c.model);
      modelUpdates++;
    }

    // Rates — only update if we have a valid adjusted rate
    if (adjustedDaily && adjustedDaily > 0) {
      const origDaily = orig.dailyRate ? parseFloat(orig.dailyRate) : 0;
      if (Math.abs(adjustedDaily - origDaily) > 1) {
        sets.push('dailyRate = ?');
        params.push(adjustedDaily.toFixed(2));
        sets.push('weeklyRate = ?');
        params.push(adjustedWeekly.toFixed(2));
        sets.push('monthlyRate = ?');
        params.push(adjustedMonthly.toFixed(2));
        rateUpdates++;
      }
    }

    if (sets.length === 0) continue;

    params.push(c.id);
    const sql = `UPDATE equipment_items SET ${sets.join(', ')} WHERE id = ?`;

    try {
      await conn.execute(sql, params);
      
      const catMarkup = SUBCATEGORY_MARKUP[subCategoryId] || CATEGORY_MARKUP[categoryId] || 1.40;
      changeLog.push({
        id: c.id,
        name: orig.name,
        category: orig.categoryName,
        markup: `${Math.round((catMarkup - 1) * 100)}%`,
        brandChange: c.brand !== orig.brand ? `${orig.brand} → ${c.brand}` : null,
        modelChange: c.model !== orig.model && c.modelConfidence !== 'low' ? `${orig.model} → ${c.model}` : null,
        dailyRate: adjustedDaily ? `${orig.dailyRate || 0} → ${adjustedDaily}` : null,
        changes: c.changes,
      });
    } catch (err) {
      log(`  ERROR updating ID ${c.id}: ${err.message}`);
      errors++;
    }
  }

  await conn.end();

  log(`\n=== SUMMARY ===`);
  log(`Brand updates: ${brandUpdates}`);
  log(`Model updates: ${modelUpdates} (skipped low-confidence)`);
  log(`Rate updates: ${rateUpdates}`);
  log(`Errors: ${errors}`);
  log(`Total items modified: ${changeLog.length}`);

  // Save change log
  writeFileSync('/home/ubuntu/equiphk/scripts/change-log.json', JSON.stringify(changeLog, null, 2));
  log(`Change log saved to change-log.json`);

  // Print markup distribution
  const markupDist = {};
  for (const cl of changeLog) {
    markupDist[cl.markup] = (markupDist[cl.markup] || 0) + 1;
  }
  log(`\nMarkup distribution:`);
  for (const [m, count] of Object.entries(markupDist).sort()) {
    log(`  ${m}: ${count} items`);
  }
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
