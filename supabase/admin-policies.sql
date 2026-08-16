-- ============================================================
--  صلاحيات الأدمن + تتبّع حالة الأوردر
-- ------------------------------------------------------------
--  انسخ الملف ده كله والصقه في:
--  Supabase → SQL Editor → New query → Run
--
--  آمن تشغّله أكتر من مرة.
-- ============================================================


-- ============================================================
--  1) إيميل الأدمن
--  ------------------------------------------------------------
--  دالة بترجع true لو المستخدم الحالي هو صاحب المتجر.
--  عشان تغيّر الأدمن أو تزوّد واحد، عدّل السطر اللي جوه.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() ->> 'email') in ('iaomn8406@gmail.com'),
    false
  );
$$;


-- ============================================================
--  2) أعمدة تتبّع الحالة
-- ============================================================
alter table public.orders
  add column if not exists status_updated_at timestamptz default now();

alter table public.orders
  add column if not exists admin_note text;

-- فهرس عشان الفلترة بالحالة تبقى سريعة
create index if not exists orders_status_idx on public.orders(status);


-- ============================================================
--  3) الأدمن يشوف كل الأوردرات ويعدّل حالتها
--  ------------------------------------------------------------
--  العميل العادي بيفضل شايف أوردراته هو بس — السياسات القديمة
--  زي ما هي، دي بتتضاف فوقها.
-- ============================================================
drop policy if exists "الأدمن يشوف كل الأوردرات" on public.orders;
create policy "الأدمن يشوف كل الأوردرات"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "الأدمن يعدّل حالة الأوردر" on public.orders;
create policy "الأدمن يعدّل حالة الأوردر"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
--  4) الأدمن يشوف بيانات العملاء (للتواصل معاهم)
-- ============================================================
drop policy if exists "الأدمن يشوف بيانات العملاء" on public.profiles;
create policy "الأدمن يشوف بيانات العملاء"
  on public.profiles for select
  using (public.is_admin());


-- ============================================================
--  5) تحديث وقت تغيير الحالة تلقائيًا
-- ============================================================
create or replace function public.touch_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_touch_status on public.orders;
create trigger orders_touch_status
  before update on public.orders
  for each row execute function public.touch_status_updated_at();


-- ============================================================
--  خلاص. لو ظهرت Success بدون أخطاء يبقى كل حاجة تمام.
-- ============================================================
