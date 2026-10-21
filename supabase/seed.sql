-- =============================================================================
-- ShopSphere Marketplace Database Seed Data (Idempotent & Safe)
-- =============================================================================

-- 1. Seed Categories
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, display_order)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Electronics & Gadgets', 'electronics', 'Smartphones, headphones, laptops, and smart home tech.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', true, 1),
    ('c2222222-2222-2222-2222-222222222222', 'Fashion & Apparel', 'fashion', 'Trendy clothing, street wear, premium footwear, and accessories.', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80', true, 2),
    ('c3333333-3333-3333-3333-333333333333', 'Home & Living', 'home-living', 'Modern furniture, ambient lighting, kitchenware, and luxury decor.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', true, 3),
    ('c4444444-4444-4444-4444-444444444444', 'Beauty & Wellness', 'beauty-wellness', 'Organic skincare, luxury fragrances, grooming, and personal care.', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', true, 4),
    ('c5555555-5555-5555-5555-555555555555', 'Sports & Outdoors', 'sports-fitness', 'Gym equipment, outdoor gear, fitness trackers, and athletic shoes.', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', true, 5),
    ('c6666666-6666-6666-6666-666666666666', 'Footwear & Sneakers', 'footwear', 'Running shoes, casual sneakers, formal shoes, and luxury boots.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', true, 6)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- 2. Seed Products
INSERT INTO public.products (
    id, slug, title, brand, description, short_description, price, compare_at_price,
    discount_percent, sku, stock_quantity, track_quantity, category_id, is_active, is_featured, is_bestseller, is_deal, rating, review_count, tags, features, specifications
) VALUES
(
    'p1111111-1111-1111-1111-111111111111',
    'sony-wh-1000xm5-noise-cancelling-headphones',
    'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
    'Sony',
    'The Sony WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control 8 microphones for unprecedented noise cancellation and exceptional call quality.',
    'Industry-leading noise cancellation with two processors and 8 microphones.',
    26990.00,
    34990.00,
    23,
    'SNY-WH-1000XM5-BLK',
    18,
    true,
    'c1111111-1111-1111-1111-111111111111',
    true, true, true, true, 4.8, 1420,
    ARRAY['headphones', 'wireless', 'noise-cancelling', 'sony'],
    '["Active noise cancellation with 8 mics", "30-hour battery life", "Integrated Processor V1"]'::jsonb,
    '[{"group": "Audio", "attributes": [{"name": "Driver", "value": "30mm"}, {"name": "Battery", "value": "30 Hours"}]}]'::jsonb
),
(
    'p2222222-2222-2222-2222-222222222222',
    'apple-watch-series-9-gps-45mm',
    'Apple Watch Series 9 GPS 45mm Midnight Aluminum Case with Sport Band',
    'Apple',
    'Apple Watch Series 9 helps you stay connected, active, healthy, and safe. Featuring the S9 SiP with 64-bit dual-core processor, double tap gesture, and 2000 nits edge-to-edge display.',
    'Powerful S9 chip, magical Double Tap gesture, and 2000 nits edge-to-edge display.',
    41900.00,
    44900.00,
    7,
    'APL-WCH-S9-45-MID',
    12,
    true,
    'c1111111-1111-1111-1111-111111111111',
    true, true, true, false, 4.9, 890,
    ARRAY['smartwatch', 'apple', 'fitness', 'wearable'],
    '["S9 SiP with Double Tap gesture", "Always-On Retina display", "Blood Oxygen & ECG sensors"]'::jsonb,
    '[{"group": "General", "attributes": [{"name": "Case Size", "value": "45mm"}, {"name": "Connectivity", "value": "GPS, Wi-Fi, BT"}]}]'::jsonb
),
(
    'p3333333-3333-3333-3333-333333333333',
    'nike-air-zoom-pegasus-40-running-shoes',
    'Nike Air Zoom Pegasus 40 Men Road Running Shoes',
    'Nike',
    'A springy ride for every run, the Peg returns to help you accomplish your goals with responsive React foam and dual Zoom Air units.',
    'Responsive React foam with dual Zoom Air units for daily distance running.',
    8495.00,
    11895.00,
    29,
    'NKE-PEG-40-BLK',
    25,
    true,
    'c6666666-6666-6666-6666-666666666666',
    true, true, false, true, 4.6, 654,
    ARRAY['shoes', 'sneakers', 'running', 'nike'],
    '["Nike React foam", "Dual Zoom Air units", "Engineered mesh upper"]'::jsonb,
    '[{"group": "Details", "attributes": [{"name": "Weight", "value": "288g"}, {"name": "Drop", "value": "10mm"}]}]'::jsonb
),
(
    'p4444444-4444-4444-4444-444444444444',
    'macbook-pro-14-m3-pro-space-black',
    'Apple MacBook Pro 14" M3 Pro Chip 18GB Unified Memory 512GB SSD',
    'Apple',
    'Supercharged by M3 Pro with 11-core CPU, 14-core GPU, up to 18 hours of battery life, and Liquid Retina XDR display.',
    'Next-gen M3 Pro silicon with 18-hour battery and Liquid Retina XDR display.',
    189900.00,
    199900.00,
    5,
    'APL-MBP-14-M3P',
    6,
    true,
    'c1111111-1111-1111-1111-111111111111',
    true, true, true, false, 4.9, 312,
    ARRAY['laptop', 'macbook', 'apple', 'pro'],
    '["Apple M3 Pro chip", "18GB Unified Memory", "Liquid Retina XDR display"]'::jsonb,
    '[{"group": "Specs", "attributes": [{"name": "Storage", "value": "512GB SSD"}, {"name": "Screen", "value": "14.2 inch"}]}]'::jsonb
),
(
    'p5555555-5555-5555-5555-555555555555',
    'minimalist-ceramic-table-lamp',
    'Aura Minimalist Scandinavian Ceramic Table Lamp with Linen Shade',
    'Aura Living',
    'Hand-molded matte terracotta ceramic base paired with an unbleached organic linen cylindrical shade.',
    'Handcrafted ceramic base with organic linen shade and warm dimmable LED bulb.',
    3499.00,
    5999.00,
    42,
    'AUR-LMP-MIN-01',
    34,
    true,
    'c3333333-3333-3333-3333-333333333333',
    true, false, true, false, 4.7, 218,
    ARRAY['home', 'lamp', 'decor', 'lighting'],
    '["Hand-thrown ceramic", "Natural linen shade", "Dimmable 9W warm LED included"]'::jsonb,
    '[{"group": "Dimensions", "attributes": [{"name": "Height", "value": "45cm"}, {"name": "Diameter", "value": "18cm"}]}]'::jsonb
),
(
    'p6666666-6666-6666-6666-666666666666',
    'pure-cashmere-overcoat-camel',
    'Atelier Sartorial Men 100% Mongolian Cashmere Tailored Overcoat',
    'Atelier',
    'Impeccably tailored from dense, buttery soft Grade-A Mongolian cashmere with peak lapels.',
    'Grade-A 100% pure cashmere overcoat with peak lapels and Italian cupro lining.',
    18499.00,
    28999.00,
    36,
    'ATL-CSH-CT-CML',
    8,
    true,
    'c2222222-2222-2222-2222-222222222222',
    true, true, false, false, 4.9, 94,
    ARRAY['fashion', 'coat', 'cashmere', 'luxury'],
    '["100% Grade-A Mongolian cashmere", "Horn buttons crafted in Italy", "Cupro lining"]'::jsonb,
    '[{"group": "Care", "attributes": [{"name": "Material", "value": "100% Cashmere"}, {"name": "Dry Clean", "value": "Only"}]}]'::jsonb
),
(
    'p7777777-7777-7777-7777-777777777777',
    'botanical-glow-vitamin-c-serum',
    'Lumiere Botanics 15% Ethyl Ascorbic Acid Vitamin C Radiance Serum',
    'Lumiere Botanics',
    'Stabilized 15% Ethyl Ascorbic Acid, Ferulic Acid, and Hyaluronic Acid for luminous, even-toned skin.',
    'Clinically tested 15% Vitamin C complex for luminous, even-toned skin.',
    1299.00,
    1999.00,
    35,
    'LUM-VITC-30ML',
    45,
    true,
    'c4444444-4444-4444-4444-444444444444',
    true, false, true, false, 4.7, 489,
    ARRAY['skincare', 'serum', 'beauty', 'vitamin-c'],
    '["15% Ethyl Ascorbic Acid", "Ferulic Acid photoprotection", "Triple Hyaluronic Acid"]'::jsonb,
    '[{"group": "Product", "attributes": [{"name": "Volume", "value": "30ml"}, {"name": "Skin Type", "value": "All Types"}]}]'::jsonb
),
(
    'p8888888-8888-8888-8888-888888888888',
    'titanium-smart-fitness-kettlebell',
    'Apex Fit Pro Adjustable Smart Kettlebell with Digital Tracking',
    'Apex Fit',
    'Replaces 7 kettlebells from 4.5kg to 18kg with built-in Bluetooth rep and calorie tracking.',
    'Adjustable 4.5kg - 18kg kettlebell with real-time Bluetooth rep tracking.',
    11999.00,
    16999.00,
    29,
    'APX-KTB-SMT-18',
    14,
    true,
    'c5555555-5555-5555-5555-555555555555',
    true, true, false, false, 4.8, 165,
    ARRAY['fitness', 'workout', 'kettlebell', 'gym'],
    '["7 selectable weight increments", "Bluetooth tracking sensor", "Cast iron core"]'::jsonb,
    '[{"group": "Weights", "attributes": [{"name": "Range", "value": "4.5kg - 18kg"}, {"name": "Battery", "value": "90 Days"}]}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    stock_quantity = EXCLUDED.stock_quantity;

-- 3. Seed Product Variants
INSERT INTO public.product_variants (id, product_id, title, sku, price, compare_at_price, stock_quantity, attributes) VALUES
('v1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Midnight Black', 'SNY-WH-1000XM5-BLK', 26990.00, 34990.00, 10, '{"color": "Midnight Black"}'::jsonb),
('v1111111-1111-1111-1111-111111111112', 'p1111111-1111-1111-1111-111111111111', 'Silver White', 'SNY-WH-1000XM5-SLV', 26990.00, 34990.00, 8, '{"color": "Silver White"}'::jsonb),
('v2222222-2222-2222-2222-222222222221', 'p2222222-2222-2222-2222-222222222222', '41mm Midnight', 'APL-WCH-S9-41-MID', 38900.00, 41900.00, 8, '{"caseSize": "41mm", "color": "Midnight"}'::jsonb),
('v2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', '45mm Midnight', 'APL-WCH-S9-45-MID', 41900.00, 44900.00, 4, '{"caseSize": "45mm", "color": "Midnight"}'::jsonb),
('v3333333-3333-3333-3333-333333333331', 'p3333333-3333-3333-3333-333333333333', 'UK 8 / EU 42', 'NKE-PEG-40-UK8', 8495.00, 11895.00, 12, '{"size": "UK 8"}'::jsonb),
('v3333333-3333-3333-3333-333333333332', 'p3333333-3333-3333-3333-333333333333', 'UK 9 / EU 43', 'NKE-PEG-40-UK9', 8495.00, 11895.00, 13, '{"size": "UK 9"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Product Images
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
('p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80', 'Sony Headphones Front', 0, true),
('p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80', 'Sony Headphones Side', 1, false),
('p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80', 'Apple Watch Front', 0, true),
('p3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80', 'Nike Pegasus Front', 0, true),
('p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80', 'MacBook Pro Front', 0, true),
('p5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80', 'Ceramic Lamp Front', 0, true),
('p6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80', 'Cashmere Coat Front', 0, true),
('p7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80', 'Vitamin C Serum Front', 0, true),
('p8888888-8888-8888-8888-888888888888', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80', 'Smart Kettlebell Front', 0, true)
ON CONFLICT DO NOTHING;
