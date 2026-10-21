import { createProductAction, updateProductAction, deleteProductAction } from '../src/lib/admin/actions';
import { getProducts, getProductBySlug } from '../src/lib/products/queries';
import { revalidateCartAction } from '../src/lib/cart/actions';
import { memoryProducts } from '../src/lib/admin/store';
import { signInDemoAction } from '../src/lib/auth/actions';

async function main() {
  console.log('=============================================================');
  console.log('  TESTING ADMIN-TO-CUSTOMER STOREFRONT REAL-TIME SYNC');
  console.log('=============================================================');

  // Authenticate test session with admin privileges
  await signInDemoAction('admin');

  console.log('\n1. Initial product count in memory: ' + memoryProducts.length);

  // 1. Admin creates a new product
  console.log('\n2. Admin creates a new product: "[DEMO SAMPLE] Artisan Leather Notebook"...');
  const addRes = await createProductAction({
    title: '[DEMO SAMPLE] Artisan Leather Notebook with Refillable Pages',
    brand: 'Artisan Paper',
    category: 'Books & Stationery',
    categorySlug: 'books',
    sku: 'BOK-ART-NTB-01',
    price: 1499,
    compareAtPrice: 1999,
    discountPercent: 25,
    stockQuantity: 45,
    description: 'Full-grain leather bound refillable notebook crafted by master bookbinders.',
    shortDescription: '[DEMO SAMPLE] Full-grain leather notebook with refillable dotted paper.',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isFeatured: true,
  });

  if (!addRes.success || !addRes.product) {
    throw new Error('Failed to create product: ' + addRes.error);
  }
  console.log('   ✔ Product created! ID:', addRes.product.id, 'Slug:', addRes.product.slug);

  // 2. Customer searches for the new product
  console.log('\n3. Customer searches catalog for "Artisan Leather Notebook"...');
  const catalog = await getProducts({ query: 'Artisan Leather' });
  const foundInCatalog = catalog.items.some((p) => p.id === addRes.product!.id);
  if (!foundInCatalog) {
    throw new Error('New product not visible in customer catalog query!');
  }
  console.log('   ✔ Verified: Found in customer search results! Price: ₹' + catalog.items[0].price);

  // 3. Customer views the product detail page
  console.log('\n4. Customer navigates to product details /products/' + addRes.product.slug + '...');
  const details = await getProductBySlug(addRes.product.slug);
  if (!details || details.id !== addRes.product.id) {
    throw new Error('Product not found by slug on customer page!');
  }
  console.log('   ✔ Verified: Details page displays product with SKU:', details.sku);

  // 4. Customer adds product to cart
  console.log('\n5. Customer adds 2 units to cart & server validates...');
  const cartRes = await revalidateCartAction([
    { productId: addRes.product.id, quantity: 2 },
  ]);
  if (!cartRes.isValid || cartRes.summary.subtotal !== 1499 * 2) {
    throw new Error('Cart price calculation failed: expected ₹2,998, got ' + cartRes.summary.subtotal);
  }
  console.log('   ✔ Verified: Cart validated successfully! Subtotal: ₹' + cartRes.summary.subtotal);

  // 5. Admin updates the product price
  console.log('\n6. Admin updates price from ₹1,499 to ₹1,299...');
  const updateRes = await updateProductAction(addRes.product.id, { price: 1299 });
  if (!updateRes.success || updateRes.product?.price !== 1299) {
    throw new Error('Failed to update product price: ' + updateRes.error);
  }
  console.log('   ✔ Verified: Admin product price updated to ₹1,299');

  // 6. Customer cart reflects updated price
  console.log('\n7. Customer cart revalidates with updated price...');
  const cartRes2 = await revalidateCartAction([
    { productId: addRes.product.id, quantity: 2 },
  ]);
  if (cartRes2.summary.subtotal !== 1299 * 2) {
    throw new Error('Cart did not reflect updated price: expected ₹2,598, got ' + cartRes2.summary.subtotal);
  }
  console.log('   ✔ Verified: Customer cart automatically updated to ₹' + cartRes2.summary.subtotal + ' (2 x ₹1,299)');

  // 7. Admin deletes the product
  console.log('\n8. Admin deletes product from store...');
  const delRes = await deleteProductAction(addRes.product.id);
  if (!delRes.success) {
    throw new Error('Failed to delete product: ' + delRes.error);
  }
  console.log('   ✔ Verified: Admin deleted product:', delRes.message);

  const checkAfterDelete = await getProductBySlug(addRes.product.slug);
  if (checkAfterDelete !== null) {
    throw new Error('Deleted product still returned by customer query!');
  }
  console.log('   ✔ Verified: Product is no longer visible to customers.');

  console.log('\n=============================================================');
  console.log('🎉 SUCCESS: ADMIN AND CUSTOMER STORES ARE 100% SYNCHRONIZED!');
  console.log('=============================================================');
}

main().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
