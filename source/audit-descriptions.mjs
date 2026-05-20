import { getDb } from './server/db.ts';

async function auditDescriptions() {
  const db = await getDb();
  if (!db) {
    console.log('Database not available');
    return;
  }

  try {
    const items = await db.query.equipmentItems.findMany({
      columns: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
      },
      limit: 50,
    });

    console.log('\n=== CURRENT EQUIPMENT DESCRIPTIONS ===\n');
    items.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.name}`);
      console.log(`   Description: ${item.description?.substring(0, 100)}...`);
      console.log(`   Category ID: ${item.categoryId}`);
      console.log('');
    });

    // Find duplicates
    const descMap = new Map();
    items.forEach((item) => {
      const desc = item.description || '';
      if (!descMap.has(desc)) {
        descMap.set(desc, []);
      }
      descMap.get(desc).push(item.name);
    });

    console.log('\n=== DUPLICATE DESCRIPTIONS ===\n');
    let hasDuplicates = false;
    descMap.forEach((names, desc) => {
      if (names.length > 1) {
        hasDuplicates = true;
        console.log(`Description used ${names.length} times:`);
        console.log(`"${desc?.substring(0, 80)}..."`);
        console.log(`Used by: ${names.join(', ')}`);
        console.log('');
      }
    });

    if (!hasDuplicates) {
      console.log('No duplicate descriptions found!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

auditDescriptions();
