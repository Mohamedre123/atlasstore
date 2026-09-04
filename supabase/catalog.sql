-- ============================================================
--  ATLAS Store — كتالوج المتجر (أقسام ومنتجات) + كتالوج فيندور
-- ------------------------------------------------------------
--  انسخ الملف ده كله والصقه في:
--  Supabase → SQL Editor → New query → Run
--
--  شغّله بعد schema.sql و admin-policies.sql.
--  آمن تشغّله أكتر من مرة.
-- ============================================================


-- ============================================================
--  1) الأقسام
--  ------------------------------------------------------------
--  parent_id بيخلّي القسم يبقى تحت قسم تاني — يعني تقدر تعمل
--  «تيشرتات» وتحتها «تيشرتات كورة» و«تيشرتات بولو»، وتظهر
--  كقايمة منسدلة في الهيدر و accordion في قايمة الفون.
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories(id) on delete cascade,
  slug        text not null unique,
  name        text not null,
  description text,
  image       text,
  sort        int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_sort_idx   on public.categories(sort);

alter table public.categories enable row level security;

-- الزوار يشوفوا الأقسام المفعّلة بس
drop policy if exists "عرض الأقسام" on public.categories;
create policy "عرض الأقسام"
  on public.categories for select
  using (is_active = true or public.is_admin());

drop policy if exists "الأدمن يدير الأقسام" on public.categories;
create policy "الأدمن يدير الأقسام"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
--  2) منتجات المتجر
--  ------------------------------------------------------------
--  دي المنتجات اللي بتظهر للعملاء. الأسعار هنا هي أسعارنا
--  (بعمولتنا)، وحقول vendoor_* بتربط المنتج بمصدره عند فيندور
--  عشان الأوردر يتبعت لهم تلقائي.
-- ============================================================
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references public.categories(id) on delete set null,

  slug              text not null unique,
  name              text not null,
  short_description text,
  description       text,

  price             numeric not null check (price >= 0),
  compare_at_price  numeric check (compare_at_price >= 0),

  -- ["https://...","/img/..."]
  images            jsonb not null default '[]'::jsonb,
  -- [{ "name": "اللون", "options": ["اسود","ابيض"] }]
  variants          jsonb not null default '[]'::jsonb,
  tags              jsonb not null default '[]'::jsonb,

  badge             text,
  sku               text,
  featured          boolean not null default false,
  in_stock          boolean not null default true,
  sort              int     not null default 0,
  is_active         boolean not null default true,

  -- ---------- الربط بفيندور ----------
  vendoor_id        int,
  -- { "اسود": ["L","XL"], "ابيض": ["L"] } — زي ما بيرجعها الـ API
  vendoor_variants  jsonb,
  vendoor_buy       numeric,
  vendoor_min       numeric,
  vendoor_max       numeric,
  vendoor_seller    text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx   on public.products(is_active);
create index if not exists products_sort_idx     on public.products(sort);
create index if not exists products_vendoor_idx  on public.products(vendoor_id);

alter table public.products enable row level security;

drop policy if exists "عرض المنتجات" on public.products;
create policy "عرض المنتجات"
  on public.products for select
  using (is_active = true or public.is_admin());

drop policy if exists "الأدمن يدير المنتجات" on public.products;
create policy "الأدمن يدير المنتجات"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
--  3) كتالوج فيندور (نسخة محلية)
--  ------------------------------------------------------------
--  بنسحب منتجات فيندور مرة واحدة ونخزّنها هنا، عشان صفحة
--  «كتالوج فيندور» تفتح فورًا وتبحث وتفلتر من غير ما تستنى
--  ٩٠ طلب على الـ API كل مرة.
--
--  الجدول ده للأدمن بس — فيه أسعار الشراء والعمولات.
-- ============================================================
create table if not exists public.vendoor_products (
  id             int primary key,          -- رقم المنتج عند فيندور
  category_id    int,
  category_name  text,
  name           text not null,
  seller         text,
  main_photo     text,
  images         jsonb not null default '[]'::jsonb,
  description    text,
  buy_price      numeric,
  min_price      numeric,
  max_price      numeric,
  commission     numeric,
  -- { "اسود": ["L","XL","2XL"] }
  variants       jsonb not null default '{}'::jsonb,
  catalog_url    text,
  synced_at      timestamptz not null default now()
);

create index if not exists vendoor_category_idx on public.vendoor_products(category_id);
create index if not exists vendoor_name_idx     on public.vendoor_products(name);

alter table public.vendoor_products enable row level security;

drop policy if exists "الأدمن يشوف كتالوج فيندور" on public.vendoor_products;
create policy "الأدمن يشوف كتالوج فيندور"
  on public.vendoor_products for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
--  4) رقم الأوردر عند فيندور
--  ------------------------------------------------------------
--  لما الأوردر يتبعت لفيندور بنحفظ رقمه هنا، ولو فشل بنحفظ
--  السبب عشان يبان في لوحة الإدارة وتقدر تبعته يدوي.
-- ============================================================
alter table public.orders add column if not exists vendoor_order_code text;
alter table public.orders add column if not exists vendoor_status     text;
alter table public.orders add column if not exists vendoor_error      text;
alter table public.orders add column if not exists vendoor_sent_at    timestamptz;


-- ============================================================
--  5) تحديث updated_at تلقائيًا
-- ============================================================
drop trigger if exists categories_touch on public.categories;
create trigger categories_touch
  before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();


-- ============================================================
--  خلاص. لو ظهرت Success بدون أخطاء يبقى كل حاجة تمام.
-- ============================================================
