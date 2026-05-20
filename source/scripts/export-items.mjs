import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const [rows] = await conn.execute(`
  SELECT 
    ei.id, ei.name, ei.brand, ei.model, ei.description, ei.specs,
    ei.dailyRate, ei.weeklyRate, ei.monthlyRate, ei.pricingType,
    ei.categoryId, ei.subCategoryId,
    ec.name AS categoryName, 
    esc.name AS subCategoryName
  FROM equipment_items ei
  LEFT JOIN equipment_categories ec ON ei.categoryId = ec.id
  LEFT JOIN equipment_sub_categories esc ON ei.subCategoryId = esc.id
  ORDER BY ei.id
`);

await conn.end();

const fs = await import('fs');
fs.writeFileSync('/home/ubuntu/equiphk/scripts/all-items.json', JSON.stringify(rows, null, 2));
console.log(`Exported ${rows.length} items to all-items.json`);
