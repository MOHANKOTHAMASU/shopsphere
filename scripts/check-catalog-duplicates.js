const fs = require('fs');
const path = require('path');

// We can read and verify seed-products.ts and seed-products-supplement.ts
const seedMainText = fs.readFileSync(path.join(__dirname, '../src/data/seed-products.ts'), 'utf8');
const seedSuppText = fs.readFileSync(path.join(__dirname, '../src/data/seed-products-supplement.ts'), 'utf8');

function extractImages(content) {
  const matches = [...content.matchAll(/https:\/\/images\.unsplash\.com\/[^\s"',]+/g)];
  return matches.map(m => m[0]);
}

function extractIds(content) {
  const matches = [...content.matchAll(/id:\s*'([^']+)'/g)];
  return matches.map(m => m[1]);
}

const mainImages = extractImages(seedMainText);
const suppImages = extractImages(seedSuppText);
const allImages = [...mainImages, ...suppImages];

console.log('Total extracted image instances:', allImages.length);

const imageCounts = new Map();
for (const url of allImages) {
  const clean = url.split('?')[0];
  imageCounts.set(clean, (imageCounts.get(clean) || 0) + 1);
}

let dupCount = 0;
for (const [url, count] of imageCounts.entries()) {
  if (count > 2) { // Some products use thumbnail + images array so 2 is expected per product
    console.log(`Image reused ${count} times:`, url);
    dupCount++;
  }
}

console.log('Cross-product duplicate images count (used > 2 times):', dupCount);

const mainIds = extractIds(seedMainText);
const suppIds = extractIds(seedSuppText);
const allIds = [...mainIds, ...suppIds];
const idCounts = new Map();
for (const id of allIds) {
  idCounts.set(id, (idCounts.get(id) || 0) + 1);
}

let dupIdCount = 0;
for (const [id, count] of idCounts.entries()) {
  if (count > 1) {
    console.log(`Duplicate ID (${count} times):`, id);
    dupIdCount++;
  }
}
console.log('Duplicate IDs count:', dupIdCount);

