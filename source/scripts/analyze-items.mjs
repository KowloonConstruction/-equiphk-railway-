import { readFileSync } from 'fs';
const d = JSON.parse(readFileSync('/home/ubuntu/equiphk/scripts/all-items.json', 'utf8'));

console.log('Total items:', d.length);
console.log('No/Unknown brand:', d.filter(i => !i.brand || i.brand === 'Unknown').length);
console.log('No model:', d.filter(i => !i.model || i.model === '').length);
console.log('No daily rate:', d.filter(i => !i.dailyRate).length);
console.log('No description:', d.filter(i => !i.description).length);
console.log('No specs:', d.filter(i => !i.specs || i.specs === 'NULL').length);

// Show items with "Unknown" brand
console.log('\n--- Items with Unknown brand ---');
d.filter(i => i.brand === 'Unknown').forEach(i => console.log(`  ID ${i.id}: ${i.name}`));

// Show items with empty model
console.log('\n--- Items with empty model ---');
d.filter(i => !i.model || i.model === '').slice(0, 30).forEach(i => console.log(`  ID ${i.id}: ${i.name} (brand: ${i.brand})`));

// Show items with no pricing
console.log('\n--- Items with no daily rate (first 20) ---');
d.filter(i => !i.dailyRate).slice(0, 20).forEach(i => console.log(`  ID ${i.id}: ${i.name}`));

// Check for potential brand misspellings
const brands = {};
d.forEach(i => { if (i.brand) brands[i.brand] = (brands[i.brand] || 0) + 1; });
console.log('\n--- All brands ---');
Object.entries(brands).sort((a,b) => b[1] - a[1]).forEach(([b, c]) => console.log(`  ${b}: ${c}`));
