/**
 * Regenerate Equipment Descriptions with AI
 * Creates unique, mixed-tone descriptions for each equipment item
 */
import { invokeLLM } from './_core/llm';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { equipmentItems, equipmentCategories } from '../drizzle/schema';

// Tone templates for different equipment categories
const TONE_TEMPLATES: Record<string, { b2c: string; b2b: string }> = {
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

export async function generateUniqueDescription(
  item: any,
  categoryName: string
): Promise<string | null> {
  const toneConfig = TONE_TEMPLATES[categoryName] || {
    b2c: 'practical, user-friendly, accessible',
    b2b: 'professional, technical, performance-focused',
  };

  // Determine if B2B or B2B based on category
  const isB2B = [
    'Scaffolding & Access',
    'Hydraulic Equipment',
    'Chainsaws & Outdoor',
    'Specialized Equipment',
  ].includes(categoryName);
  const tone = isB2B ? toneConfig.b2b : toneConfig.b2c;

  const prompt = `Generate a unique, compelling product description for this equipment rental item.

Product: ${item.name}
Brand: ${item.brand || 'Generic'}
Model: ${item.model || 'Standard'}
Category: ${categoryName}
Daily Rate: HK$${item.dailyRate || 'Negotiated'}

Requirements:
- Tone: ${tone}
- Length: 2-3 sentences (40-80 words)
- Highlight: Key benefits, use cases, and why customers would rent this
- Avoid: Generic phrases like "Available for rent" or "Perfect for any job"
- Make it unique and specific to this equipment type
- Include practical details or applications
- For B2B: Emphasize durability, specs, and professional use
- For DIY: Emphasize ease of use, versatility, and practical applications

Write ONLY the description text, no labels or extra formatting.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert equipment rental copywriter. Create unique, compelling product descriptions that highlight benefits and encourage rentals. Each description should be distinct and tailored to the specific equipment.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawContent = response.choices[0].message.content;
    const description = (typeof rawContent === "string" ? rawContent : "").trim();
    return description;
  } catch (error) {
    console.error(`Error generating description for ${item.name}:`, error);
    return null;
  }
}

export async function regenerateAllDescriptions() {
  const db = await getDb();
  if (!db) {
    console.log('Database not available');
    return { success: false, message: 'Database not available' };
  }

  try {
    // Fetch all equipment items with their category names via a join
    const rows = await db
      .select({
        id: equipmentItems.id,
        name: equipmentItems.name,
        brand: equipmentItems.brand,
        model: equipmentItems.model,
        dailyRate: equipmentItems.dailyRate,
        categoryName: equipmentCategories.name,
      })
      .from(equipmentItems)
      .leftJoin(equipmentCategories, eq(equipmentItems.categoryId, equipmentCategories.id))
      .where(eq(equipmentItems.isActive, true));

    // Map to the shape the rest of the function expects
    const items = rows.map((r) => ({
      ...r,
      category: { name: r.categoryName ?? 'Equipment' },
    }));

    console.log(`\nRegenerating descriptions for ${items.length} equipment items...\n`);

    let updated = 0;
    let failed = 0;
    const results = [];

    for (const item of items) {
      const categoryName = item.category?.name || 'Equipment';
      console.log(`Processing: ${item.name}...`);

      const newDescription = await generateUniqueDescription(item, categoryName);

      if (newDescription) {
        // Update the description in database
        await db
          .update(equipmentItems)
          .set({ description: newDescription })
          .where(eq(equipmentItems.id, item.id));

        console.log(`✓ Updated: "${newDescription.substring(0, 60)}..."`);
        results.push({
          id: item.id,
          name: item.name,
          description: newDescription,
        });
        updated++;
      } else {
        console.log(`✗ Failed to generate description`);
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total items: ${items.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    return {
      success: true,
      message: `Successfully regenerated ${updated} descriptions`,
      updated,
      failed,
      results,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
