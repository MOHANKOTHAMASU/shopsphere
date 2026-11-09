# ShopSphere — Storage Architecture & Cloud Storage Audit

**Audit Date:** November 9, 2026  
**Primary Storage Infrastructure:** Supabase Object Storage (S3-compatible) + Global CDN  
**Storage Buckets:** `product-images` (Public), `avatars` (Public/Restricted)  

---

## 1. Storage Organization & Bucket Architecture

ShopSphere employs a clean separation of object storage to ensure optimal delivery speeds, strict access controls, and zero database bloat:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE STORAGE BUCKETS                        │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ Bucket Name              │ Purpose                  │ Access Policy    │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ 1. `product-images`      │ High-resolution product  │ Public Read      │
│    (Public: true)        │ photography, gallery     │ Admin-only write │
│                          │ thumbnails, catalog art  │ (RLS enforced)   │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ 2. `avatars`             │ Customer & staff profile │ Public Read      │
│    (Public: true)        │ pictures                 │ Authenticated    │
│                          │                          │ owner write      │
└──────────────────────────┴──────────────────────────┴──────────────────┘
```

---

## 2. Storage Security & Upload Validation Rules

1. **Strict Client-Side & Server-Side File Limits:**
   * Maximum file size limit: **5 MB** per image.
   * Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`. Executable files, SVGs with embedded scripts, and non-image binaries are strictly rejected.
2. **Access Control Policies (PostgreSQL RLS on `storage.objects`):**
   * **Public Read:** `SELECT USING (bucket_id = 'product-images' OR bucket_id = 'avatars')` allows visitors and customers to view product photos and avatars instantly.
   * **Admin-Only Product Management:** `INSERT / UPDATE / DELETE WITH CHECK (bucket_id = 'product-images' AND public.is_admin())` guarantees that only authorized store administrators can upload, replace, or delete store imagery.
   * **User-Owned Avatars:** `INSERT / UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])` isolates user avatars by customer ID folder.
3. **Database Hygiene:**
   * Images are **never stored as binary blobs (`BYTEA`) in PostgreSQL tables**. The database stores only clean HTTPS URLs in `public.product_images.image_url` and `public.products.thumbnail`.

---

## 3. Capacity, Free-Tier Limits & Future Scaling

| Dimension | Supabase Free Tier | ShopSphere Production Usage | Future Scaling Path |
| :--- | :--- | :--- | :--- |
| **Storage Capacity** | 1.0 GB total | ~85 MB (catalog images) | Upgrade to Supabase Pro (100 GB) or attach AWS S3 / Cloudflare R2 bucket. |
| **Monthly Egress** | 2.0 GB / month | ~350 MB / month | Offloaded by Vercel edge caching and CDN headers (`Cache-Control: public, max-age=31536000`). |
| **Max File Upload** | 50 MB / file | 5 MB max configured limit | Well within free tier allowances. |

### Migration Roadmap (When Exceeding 100,000 Products)
If ShopSphere expands beyond 100,000 product images:
1. Enable **Cloudflare R2** or **AWS S3** as an external S3-compatible backend.
2. Maintain existing URL paths in `public.product_images`.
3. Add Cloudflare Images for on-the-fly resizing and AVIF transformations.

