import { DEVELOPMENT_SEED_PRODUCTS } from '../src/data/seed-products';

const queries = [
  'Samsung mobile',
  "Men's shoes",
  'Wireless headphones',
  'Face wash',
  'Refrigerator',
  'Office chair',
  'Python programming book',
];

console.log('Testing 7 explicit search queries against DEVELOPMENT_SEED_PRODUCTS:');
for (const q of queries) {
  const tokens = q.toLowerCase().replace(/['']/g, '').split(/\s+/).filter(Boolean);
  const matches = DEVELOPMENT_SEED_PRODUCTS.filter((p) => {
    const text = (
      p.title + ' ' +
      p.brand + ' ' +
      p.category + ' ' +
      p.categorySlug + ' ' +
      p.description + ' ' +
      (p.tags || []).join(' ')
    ).toLowerCase().replace(/['']/g, '');
    return tokens.every((t) => text.includes(t));
  });
  console.log(`"${q}" => ${matches.length} matches`);
  if (matches.length > 0) {
    console.log(`   Sample: ${matches[0].title} [${matches[0].categorySlug}]`);
  }
}

console.log('\nCategory breakdown in DEVELOPMENT_SEED_PRODUCTS:');
const cats: Record<string, number> = {};
DEVELOPMENT_SEED_PRODUCTS.forEach((p) => {
  cats[p.categorySlug] = (cats[p.categorySlug] || 0) + 1;
});
console.log(cats);
