import { DEVELOPMENT_SEED_PRODUCTS } from '../src/data/seed-products.ts';

console.log('Total Products in Catalog:', DEVELOPMENT_SEED_PRODUCTS.length);

const imageMap = new Map();
const duplicates = [];

for (const p of DEVELOPMENT_SEED_PRODUCTS) {
  const img = p.thumbnail;
  if (!img) continue;

  // Extract base unsplash id if unsplash
  const match = img.match(/photo-([a-zA-Z0-9-]+)/);
  const key = match ? match[1] : img;

  if (imageMap.has(key)) {
    const existing = imageMap.get(key);
    duplicates.push({
      key,
      url: img,
      item1: { id: existing.id, title: existing.title, category: existing.category },
      item2: { id: p.id, title: p.title, category: p.category },
    });
  } else {
    imageMap.set(key, p);
  }
}

console.log(`Found ${duplicates.length} duplicate image instances:`);
duplicates.forEach((d, idx) => {
  console.log(`\n[#${idx + 1}] Image: ${d.key}`);
  console.log(`  - Item 1: (${d.item1.category}) ${d.item1.title} [${d.item1.id}]`);
  console.log(`  - Item 2: (${d.item2.category}) ${d.item2.title} [${d.item2.id}]`);
});
