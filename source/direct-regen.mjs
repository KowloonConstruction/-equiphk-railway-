/**
 * Direct description regeneration script
 * Connects to the database and LLM API directly
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load env from .env file if present
try {
  config();
} catch (e) {}

// Read env from the running server process
import { execSync } from 'child_process';

const DATABASE_URL = process.env.DATABASE_URL;
const LLM_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const LLM_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Run this script with the correct environment.');
  process.exit(1);
}

// Tone templates for different equipment categories
const TONE_TEMPLATES = {
  'Power Tools': {
    b2c: 'casual, friendly, DIY-focused, practical benefits',
    b2b: 'technical, professional, performance-focused, contractor-grade',
  },
  'Scaffolding & Access': {
    b2c: 'safety-conscious, easy-to-use, beginner-friendly',
    b2b: 'structural specifications, load capacity, compliance-focused',
  },
  'Safety Equipment': {
    b2c: 'reassuring, protective, peace-of-mind focused',
    b2b: 'regulatory compliance, certification details, safety standards',
  },
  'Measuring & Leveling': {
    b2c: 'accuracy-focused, user-friendly, practical applications',
    b2b: 'precision specifications, professional-grade accuracy',
  },
  'Welding & Cutting': {
    b2c: 'versatile, powerful, creative applications',
    b2b: 'technical specifications, industrial-grade, performance metrics',
  },
  'Pneumatic Tools': {
    b2c: 'efficient, lightweight, easy handling',
    b2b: 'air pressure specs, industrial applications, durability',
  },
  'Hydraulic Equipment': {
    b2c: 'powerful, reliable, heavy-duty capability',
    b2b: 'hydraulic specifications, load capacity, industrial use',
  },
  'Pumps & Fluid Handling': {
    b2c: 'practical, efficient, problem-solving',
    b2b: 'flow rate, pressure ratings, industrial applications',
  },
  'Chainsaws & Outdoor': {
    b2c: 'powerful, outdoor-ready, maintenance tips',
    b2b: 'engine specs, cutting capacity, professional-grade',
  },
  'Batteries & Power': {
    b2c: 'reliable, long-lasting, convenient',
    b2b: 'voltage specs, capacity ratings, compatibility',
  },
  'Hand Tools & Accessories': {
    b2c: 'essential, versatile, everyday use',
    b2b: 'professional-grade, durability, bulk availability',
  },
  'Compressors & Air': {
    b2c: 'powerful, versatile, multi-purpose',
    b2b: 'CFM ratings, pressure specs, industrial capacity',
  },
  'Specialized Equipment': {
    b2c: 'specialized, professional-quality, unique capabilities',
    b2b: 'specialized applications, technical requirements, custom solutions',
  },
};

const B2B_CATEGORIES = [
  'Scaffolding & Access',
  'Hydraulic Equipment',
  'Chainsaws & Outdoor',
  'Specialized Equipment',
];

async function generateDescription(item, categoryName) {
  const toneConfig = TONE_TEMPLATES[categoryName] || {
    b2c: 'practical, user-friendly, accessible',
    b2b: 'professional, technical, performance-focused',
  };

  const isB2B = B2B_CATEGORIES.includes(categoryName);
  const tone = isB2B ? toneConfig.b2b : toneConfig.b2c;

  const prompt = `Generate a unique, compelling product description for this equipment rental item.

Product: ${item.name}
Brand: ${item.brand || 'Generic'}
Model: ${item.model || 'Standard'}
Category: ${categoryName}
Daily Rate: HK$${item.daily_rate || 'Negotiated'}

Requirements:
- Tone: ${tone}
- Length: 2-3 sentences (40-80 words)
- Highlight: Key benefits, use cases, and why customers would rent this
- Avoid: Generic phrases like "Available for rent", "Perfect for any job", "Perfect for contractors and DIY enthusiasts", "High-quality equipment with regular maintenance"
- Make it unique and specific to this exact equipment type
- Include practical details or applications specific to Hong Kong construction/DIY context
- For B2B: Emphasize durability, specs, and professional use
- For DIY: Emphasize ease of use, versatility, and practical applications

Write ONLY the description text, no labels or extra formatting.`;

  const response = await fetch(`${LLM_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert equipment rental copywriter for Hong Kong. Create unique, compelling product descriptions that highlight benefits and encourage rentals. Each description must be distinct and tailored to the specific equipment. Never use generic filler phrases.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function main() {
  // Dynamic import for mysql2
  const mysql2 = await import('mysql2/promise');

  console.log('Connecting to database...');
  const connection = await mysql2.default.createConnection(DATABASE_URL);

  try {
    // Fetch all active equipment items with category names
    const [rows] = await connection.execute(`
      SELECT 
        ei.id,
        ei.name,
        ei.brand,
        ei.model,
        ei.dailyRate as daily_rate,
        ec.name as category_name
      FROM equipment_items ei
      LEFT JOIN equipment_categories ec ON ei.categoryId = ec.id
      WHERE ei.isActive = 1
      ORDER BY ec.name, ei.name
    `);

    console.log(`Found ${rows.length} equipment items to update.\n`);

    let updated = 0;
    let failed = 0;

    for (const item of rows) {
      const categoryName = item.category_name || 'Equipment';
      process.stdout.write(`[${updated + failed + 1}/${rows.length}] ${item.name}... `);

      try {
        const description = await generateDescription(item, categoryName);

        // Update in database
        await connection.execute(
          'UPDATE equipment_items SET description = ? WHERE id = ?',
          [description, item.id]
        );

        console.log(`✓`);
        console.log(`   "${description.substring(0, 80)}..."`);
        updated++;

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 800));
      } catch (error) {
        console.log(`✗ FAILED: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`COMPLETE: ${updated} updated, ${failed} failed out of ${rows.length} total`);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
