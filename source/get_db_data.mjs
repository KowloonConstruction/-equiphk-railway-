import { createConnection } from 'mysql2/promise';
import { writeFileSync } from 'fs';

const dbUrl = process.env.DATABASE_URL;
const db = await createConnection(dbUrl);

const [cats] = await db.query('SELECT id, name, slug FROM equipment_categories ORDER BY id');
const [subs] = await db.query('SELECT id, name, slug, categoryId FROM equipment_sub_categories ORDER BY categoryId, id');
const [items] = await db.query(`
  SELECT ei.id, ei.name, ei.brand, ei.model, 
         ec.slug as category_slug, esc.slug as sub_category_slug
  FROM equipment_items ei
  LEFT JOIN equipment_categories ec ON ei.categoryId = ec.id
  LEFT JOIN equipment_sub_categories esc ON ei.subCategoryId = esc.id
  ORDER BY ei.id
`);

writeFileSync('/home/ubuntu/categories_map.json', JSON.stringify({ cats, subs }));
writeFileSync('/home/ubuntu/all_items.json', JSON.stringify(items));

console.log('Categories:', cats.length);
console.log('Sub-categories:', subs.length);
console.log('Items:', items.length);

await db.end();
