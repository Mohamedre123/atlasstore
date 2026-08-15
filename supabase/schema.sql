-- ============================================================
--  ATLAS Store — سكيما قاعدة البيانات
-- ------------------------------------------------------------
--  انسخ الملف ده كله والصقه في:
--  Supabase → SQL Editor → New query → Run
--
--  آمن تشغّله أكتر من مرة (بيستخدم IF NOT EXISTS).
-- ============================================================


-- ============================================================
--  1) جدول بيانات العملاء
--  بيحفظ اسم العميل وتليفونه وعنوانه عشان ما يكتبهمش كل مرة
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  phone_alt    text,
  governorate  text,
  area         text,
  village      text,
  address      text,
  landmark     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- تشغيل حماية الصفوف: كل عميل يشوف بياناته هو بس
alter table public.profiles enable row level security;

drop policy if exists "قراءة بياناتي" on public.profiles;
create policy "قراءة بياناتي"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "إضافة بياناتي" on public.profiles;
create policy "إضافة بياناتي"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "تعديل بياناتي" on public.profiles;
create policy "تعديل بياناتي"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ============================================================
--  2) جدول الأوردرات
--  نسخة احتياطية من كل أوردر جوه قاعدة البيانات،
--  غير الإيميل اللي بيوصلك
-- ============================================================
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  order_code   text not null,
  customer     jsonb not null,
  items        jsonb not null,
  subtotal     numeric not null,
  shipping     numeric not null,
  total        numeric not null,
  status       text not null default 'new',
  created_at   timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

alter table public.orders enable row level security;

drop policy if exists "قراءة أوردراتي" on public.orders;
create policy "قراءة أوردراتي"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "تسجيل أوردر" on public.orders;
create policy "تسجيل أوردر"
  on public.orders for insert
  with check (auth.uid() = user_id);


-- ============================================================
--  3) إنشاء صف بيانات تلقائي لكل مستخدم جديد
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
--  4) تحديث updated_at تلقائيًا
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ============================================================
--  خلاص. لو ظهرت رسالة Success بدون أخطاء يبقى كل حاجة تمام.
-- ============================================================
