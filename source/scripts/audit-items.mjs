/**
 * Equipment Data Quality Audit Script
 * 
 * Reviews each item using LLM for:
 * 1. Brand name accuracy (correct spelling, proper casing)
 * 2. Model number verification against description/name
 * 3. Voltage accuracy (12v/18v/20v/36v/40v/80v/110v/220v/380v)
 * 4. Rental rates — UK/US market rate + 20% markup for HK
 * 
 * Processes items in batches of 5 to avoid timeouts.
 * Outputs corrections as SQL UPDATE statements.
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL || !FORGE_API_KEY) {
  console.error('Missing DATABASE_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

const BATCH_SIZE = 3;
const OUTPUT_FILE = '/home/ubuntu/equiphk/scripts/audit-corrections.json';
const LOG_FILE = '/home/ubuntu/equiphk/scripts/audit-log.txt';
const PROGRESS_FILE = '/home/ubuntu/equiphk/scripts/audit-progress.json';

// Known brand corrections
const BRAND_CORRECTIONS = {
  'Milwaukie': 'Milwaukee',
  'Milwaukie Drain Cleaner': 'Milwaukee',
  'N/A': null,
  'Unknown': null,
  'Bosch Tools': 'Bosch',
  'Dewalt': 'DeWalt',
  'Jiangsu Dongcheng tools co. Ltd': 'Dongcheng',
  'Sanco manufacturing co. Ltd Osaka Japan': 'Sanco',
  'IMC motor Japan co. Ltd': 'IMC',
  'Tsurumi Manufacturing co. ltd Japan': 'Tsurumi',
  'AG Switzerland - Von Arx': 'Von Arx',
  'AG Switzerland -Von Arx': 'Von Arx',
  'Elephant Chain Block Company': 'Elephant',
  'Elephant Company Japan': 'Elephant',
  'Cadillac Products USA': 'Cadillac',
  'Toku Corp Japan': 'Toku',
  'Viraj VSPL group': 'Viraj',
  'Viraj VSPL Group': 'Viraj',
  'Haru Co.': 'Haru',
  'Haru Co': 'Haru',
  'Crawcon UK': 'Crowcon',
  'Crawcon': 'Crowcon',
  'Cheetah Battery': 'Cheetah',
  'Guangdong Lingxiao pump industry': 'Lingxiao',
  'Zhengzhou Feiyu Machinery Equipment Co., LTD.': 'Feiyu',
  'Anhui Runbang Heavy Industry Machinery': 'Anhui Runbang',
  'Firefly MSA Company': 'MSA',
  'Piusi/Fleetwood/Bada': 'Piusi',
};

async function invokeLLM(messages, responseFormat) {
  const payload = {
    model: 'gemini-2.5-flash',
    messages,
    max_tokens: 32768,
    thinking: { budget_tokens: 8192 },
  };
  if (responseFormat) payload.response_format = responseFormat;

  const resp = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM error: ${resp.status} ${errText.slice(0, 200)}`);
  }

  return await resp.json();
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

async function auditBatch(items) {
  const itemSummaries = items.map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    model: item.model,
    description: item.description ? item.description.slice(0, 300) : null,
    specs: item.specs,
    dailyRate: item.dailyRate,
    weeklyRate: item.weeklyRate,
    monthlyRate: item.monthlyRate,
    categoryName: item.categoryName,
    subCategoryName: item.subCategoryName,
  }));

  const systemPrompt = `You are an expert equipment rental industry analyst specializing in construction, industrial, and marine equipment. You are auditing an equipment rental database for EquipHK, a Hong Kong-based equipment rental company.

For each item, you must:

1. **Brand**: Fix spelling/casing. Use the official brand name (e.g., "Milwaukee" not "Milwaukie", "DeWalt" not "Dewalt"). If brand is "Unknown" or "N/A", try to identify it from the item name/description. If truly unidentifiable, set to null.

2. **Model Number**: Verify the model number matches the actual product. Research the correct model number for the brand+product combination. Common voltage-based models:
   - Makita 18V tools use "DXX" prefix (e.g., DHP486, DTD172, DCF102)
   - Milwaukee 18V M18 tools use model numbers like "2767-20", "2804-20"
   - DeWalt 20V MAX tools use "DCX" prefix
   - Bosch Professional tools use "GXX" prefix (e.g., GBH 2-28, GSB 18V-55)
   If you cannot determine the exact model, keep the existing one but flag it.

3. **Voltage**: If the item is a power tool, ensure the voltage in specs/description is correct and matches the model. Valid voltages: 12V, 18V, 20V, 36V, 40V, 80V, 110V, 220V, 380V. Cordless Makita = 18V or 40V. Cordless Milwaukee = 18V (M18) or 12V (M12). Cordless DeWalt = 20V MAX.

4. **Rental Rates (HKD)**: Research typical UK/US daily rental rates for this exact equipment, convert to HKD (1 GBP ≈ 10 HKD, 1 USD ≈ 7.8 HKD), then add 20% markup. Use these guidelines:
   - Small hand tools/accessories: HKD 80-200/day
   - Power tools (drills, grinders, saws): HKD 150-400/day
   - Heavy-duty power tools: HKD 300-800/day
   - Generators (small): HKD 250-500/day
   - Generators (large): HKD 800-2000/day
   - Heavy plant/machinery: HKD 1000-5000/day
   - Marine vessels: HKD 5000-15000/day
   - Scaffolding components: HKD 30-100/day per piece
   - Safety equipment: HKD 50-200/day
   Weekly rate = daily × 5 (not 7). Monthly rate = daily × 20 (not 30).

Return a JSON array of corrections. For each item, include ALL fields even if unchanged.`;

  const userPrompt = `Audit these ${items.length} equipment items and return corrections:\n\n${JSON.stringify(itemSummaries, null, 2)}`;

  const result = await invokeLLM(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      type: 'json_schema',
      json_schema: {
        name: 'equipment_audit',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            corrections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', description: 'Equipment item ID' },
                  brand: { type: ['string', 'null'], description: 'Corrected brand name or null if unknown' },
                  model: { type: ['string', 'null'], description: 'Corrected model number or null if unknown' },
                  modelConfidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Confidence in model number accuracy' },
                  dailyRate: { type: ['number', 'null'], description: 'HKD daily rental rate (UK/US + 20%)' },
                  weeklyRate: { type: ['number', 'null'], description: 'HKD weekly rental rate (daily × 5)' },
                  monthlyRate: { type: ['number', 'null'], description: 'HKD monthly rental rate (daily × 20)' },
                  voltageNote: { type: ['string', 'null'], description: 'Any voltage correction needed, or null' },
                  changes: { type: 'string', description: 'Summary of what was changed and why' },
                },
                required: ['id', 'brand', 'model', 'modelConfidence', 'dailyRate', 'weeklyRate', 'monthlyRate', 'voltageNote', 'changes'],
                additionalProperties: false,
              },
            },
          },
          required: ['corrections'],
          additionalProperties: false,
        },
      },
    }
  );

  const content = result.choices[0].message.content;
  return JSON.parse(typeof content === 'string' ? content : content[0].text);
}

async function main() {
  const items = JSON.parse(readFileSync('/home/ubuntu/equiphk/scripts/all-items.json', 'utf8'));
  log(`Starting audit of ${items.length} items in batches of ${BATCH_SIZE}`);

  // Load progress if resuming
  let startIdx = 0;
  let allCorrections = [];
  if (existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    startIdx = progress.nextIndex;
    allCorrections = progress.corrections || [];
    log(`Resuming from index ${startIdx} (${allCorrections.length} corrections so far)`);
  }

  const totalBatches = Math.ceil((items.length - startIdx) / BATCH_SIZE);
  let batchNum = 0;

  for (let i = startIdx; i < items.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = items.slice(i, i + BATCH_SIZE);
    const ids = batch.map(b => b.id).join(', ');
    log(`Batch ${batchNum}/${totalBatches} — IDs: ${ids}`);

    try {
      const result = await auditBatch(batch);
      allCorrections.push(...result.corrections);

      // Log changes
      for (const c of result.corrections) {
        log(`  ID ${c.id}: ${c.changes}`);
      }

      // Save progress after each batch
      writeFileSync(PROGRESS_FILE, JSON.stringify({
        nextIndex: i + BATCH_SIZE,
        corrections: allCorrections,
        timestamp: new Date().toISOString(),
      }));

    } catch (err) {
      log(`ERROR on batch ${batchNum}: ${err.message}`);
      // Save progress and continue
      writeFileSync(PROGRESS_FILE, JSON.stringify({
        nextIndex: i, // retry this batch
        corrections: allCorrections,
        timestamp: new Date().toISOString(),
      }));
      // Wait and retry once
      log('  Waiting 5s and retrying...');
      await new Promise(r => setTimeout(r, 5000));
      try {
        const result = await auditBatch(batch);
        allCorrections.push(...result.corrections);
        for (const c of result.corrections) {
          log(`  ID ${c.id}: ${c.changes}`);
        }
        writeFileSync(PROGRESS_FILE, JSON.stringify({
          nextIndex: i + BATCH_SIZE,
          corrections: allCorrections,
          timestamp: new Date().toISOString(),
        }));
      } catch (err2) {
        log(`RETRY FAILED on batch ${batchNum}: ${err2.message}. Skipping.`);
        writeFileSync(PROGRESS_FILE, JSON.stringify({
          nextIndex: i + BATCH_SIZE,
          corrections: allCorrections,
          timestamp: new Date().toISOString(),
        }));
      }
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 1000));
  }

  // Apply known brand corrections on top
  for (const c of allCorrections) {
    if (c.brand && BRAND_CORRECTIONS[c.brand] !== undefined) {
      c.brand = BRAND_CORRECTIONS[c.brand];
    }
  }

  // Save final corrections
  writeFileSync(OUTPUT_FILE, JSON.stringify(allCorrections, null, 2));
  log(`Audit complete. ${allCorrections.length} corrections saved to ${OUTPUT_FILE}`);

  // Generate summary stats
  let brandChanges = 0, modelChanges = 0, rateChanges = 0;
  const origItems = Object.fromEntries(items.map(i => [i.id, i]));
  for (const c of allCorrections) {
    const orig = origItems[c.id];
    if (!orig) continue;
    if (c.brand !== orig.brand) brandChanges++;
    if (c.model !== orig.model) modelChanges++;
    if (c.dailyRate && c.dailyRate !== parseFloat(orig.dailyRate)) rateChanges++;
  }
  log(`Summary: ${brandChanges} brand fixes, ${modelChanges} model fixes, ${rateChanges} rate changes`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
