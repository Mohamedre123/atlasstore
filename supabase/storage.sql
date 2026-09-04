-- ============================================================
--  ATLAS Store — مكان رفع صور المنتجات
-- ------------------------------------------------------------
--  انسخ الملف ده كله والصقه في:
--  Supabase → SQL Editor → New query → Run
--
--  شغّله مرة واحدة بس. آمن تشغّله أكتر من مرة.
--
--  من غيره زرار «ارفع من جهازك» في محرّر الصور مش هيشتغل —
--  باقي المتجر بيشتغل عادي.
-- ============================================================


-- ============================================================
--  1) المكان نفسه
--  ------------------------------------------------------------
--  public = true عشان الصور تتفتح من أي حد (زوار المتجر)،
--  والرفع والمسح مقفولين على الأدمن في القسم اللي تحت.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- ٥ ميجا للصورة
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public             = true,
  file_size_limit    = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
--  2) الصلاحيات
--  ------------------------------------------------------------
--  الزوار يشوفوا الصور، وصاحب المتجر لوحده اللي يرفع ويعدّل
--  ويمسح. is_admin() جاية من ملف admin-policies.sql.
-- ============================================================
drop policy if exists "عرض صور المنتجات" on storage.objects;
create policy "عرض صور المنتجات"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "الأدمن يرفع صور المنتجات" on storage.objects;
create policy "الأدمن يرفع صور المنتجات"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "الأدمن يعدّل صور المنتجات" on storage.objects;
create policy "الأدمن يعدّل صور المنتجات"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "الأدمن يمسح صور المنتجات" on storage.objects;
create policy "الأدمن يمسح صور المنتجات"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());


-- ============================================================
--  خلاص. لو ظهرت Success بدون أخطاء يبقى كل حاجة تمام،
--  وزرار «ارفع من جهازك» هيشتغل على طول.
-- ============================================================
