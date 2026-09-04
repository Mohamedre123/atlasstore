-- ============================================================
--  ATLAS Store — متابعة العملاء والسلة المتروكة
-- ------------------------------------------------------------
--  انسخ الملف ده كله والصقه في:
--  Supabase → SQL Editor → New query → Run
--
--  شغّله بعد schema.sql و admin-policies.sql و catalog.sql
--  و tracking.sql. آمن تشغّله أكتر من مرة.
-- ============================================================


-- ============================================================
--  1) نشاط العميل
--  ------------------------------------------------------------
--  صف واحد لكل زائر (أو حساب)، بيتحدّث مع كل خطوة يعملها:
--  إيه اللي في سلته، فين وقف في صفحة إتمام الطلب، وإيه
--  البيانات اللي كتبها وإيه اللي سابها.
-- ============================================================
create table if not exists public.customer_activity (
  id          uuid primary key default gen_random_uuid(),

  /* الزائر بيتعرّف بـ session_id، والمسجّل بـ user_id كمان */
  session_id  text not null unique,
  user_id     uuid references auth.users(id) on delete set null,

  name        text,
  email       text,
  phone       text,
  governorate text,
  area        text,
  address     text,

  /* السلة وقت آخر نشاط */
  cart        jsonb  not null default '[]'::jsonb,
  cart_count  int    not null default 0,
  cart_total  numeric not null default 0,

  /**
   * المرحلة اللي وصلها:
   * browsing  → بيتفرّج بس
   * cart      → ضاف للسلة
   * checkout  → فتح صفحة إتمام الطلب
   * filling   → بدأ يكتب بياناته
   * ordered   → أتمّ الطلب
   */
  stage       text not null default 'browsing',

  /* { "fullName": true, "phone": false, ... } */
  filled      jsonb not null default '{}'::jsonb,
  /* آخر خانة لمسها — بيوريك وقف فين بالظبط */
  last_field  text,

  ordered     boolean not null default false,
  order_code  text,

  /* التذكيرات اللي اتبعتت: [{ kind, at }] */
  reminders   jsonb not null default '[]'::jsonb,
  reminded_at timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists activity_stage_idx   on public.customer_activity(stage);
create index if not exists activity_updated_idx on public.customer_activity(updated_at desc);
create index if not exists activity_user_idx    on public.customer_activity(user_id);

alter table public.customer_activity enable row level security;

/* الجدول ده للأدمن بس — فيه بيانات عملاء */
drop policy if exists "الأدمن يشوف نشاط العملاء" on public.customer_activity;
create policy "الأدمن يشوف نشاط العملاء"
  on public.customer_activity for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists activity_touch on public.customer_activity;
create trigger activity_touch
  before update on public.customer_activity
  for each row execute function public.touch_updated_at();


-- ============================================================
--  2) الأحداث التفصيلية
--  ------------------------------------------------------------
--  كل حركة لوحدها بوقتها: لمس خانة، كتب فيها، ضاف منتج،
--  فتح إتمام الطلب... إلخ.
-- ============================================================
create table if not exists public.customer_events (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.customer_activity(id) on delete cascade,
  kind        text not null,
  label       text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists customer_events_activity_idx on public.customer_events(activity_id, created_at desc);

alter table public.customer_events enable row level security;

drop policy if exists "الأدمن يشوف أحداث العملاء" on public.customer_events;
create policy "الأدمن يشوف أحداث العملاء"
  on public.customer_events for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
--  3) تسجيل النشاط — دالة واحدة بيناديها الموقع
--  ------------------------------------------------------------
--  الجدول نفسه مقفول على الأدمن، والكتابة بتعدّي من الدالة دي
--  بس. كده الزائر بيقدر يسجّل نشاطه هو من غير ما يقدر يقرا
--  نشاط حد تاني أو يعدّل صفوف مش بتاعته.
-- ============================================================
create or replace function public.record_activity(
  p_session    text,
  p_stage      text default null,
  p_name       text default null,
  p_email      text default null,
  p_phone      text default null,
  p_governorate text default null,
  p_area       text default null,
  p_address    text default null,
  p_cart       jsonb default null,
  p_cart_count int default null,
  p_cart_total numeric default null,
  p_filled     jsonb default null,
  p_last_field text default null,
  p_kind       text default null,
  p_label      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_session is null or length(trim(p_session)) < 8 then
    return;
  end if;

  insert into public.customer_activity as a (
    session_id, user_id, stage, name, email, phone,
    governorate, area, address,
    cart, cart_count, cart_total, filled, last_field
  )
  values (
    p_session, auth.uid(), coalesce(p_stage, 'browsing'),
    p_name, p_email, p_phone,
    p_governorate, p_area, p_address,
    coalesce(p_cart, '[]'::jsonb), coalesce(p_cart_count, 0),
    coalesce(p_cart_total, 0), coalesce(p_filled, '{}'::jsonb), p_last_field
  )
  on conflict (session_id) do update set
    /* القيم الفاضية مابتمسحش اللي اتسجّل قبل كده */
    user_id     = coalesce(auth.uid(), a.user_id),
    stage       = coalesce(p_stage, a.stage),
    name        = coalesce(nullif(p_name, ''), a.name),
    email       = coalesce(nullif(p_email, ''), a.email),
    phone       = coalesce(nullif(p_phone, ''), a.phone),
    governorate = coalesce(nullif(p_governorate, ''), a.governorate),
    area        = coalesce(nullif(p_area, ''), a.area),
    address     = coalesce(nullif(p_address, ''), a.address),
    cart        = coalesce(p_cart, a.cart),
    cart_count  = coalesce(p_cart_count, a.cart_count),
    cart_total  = coalesce(p_cart_total, a.cart_total),
    filled      = coalesce(p_filled, a.filled),
    last_field  = coalesce(nullif(p_last_field, ''), a.last_field),
    updated_at  = now()
  returning a.id into v_id;

  if p_kind is not null then
    insert into public.customer_events (activity_id, kind, label)
    values (v_id, p_kind, p_label);
  end if;
end;
$$;

grant execute on function public.record_activity(
  text, text, text, text, text, text, text, text,
  jsonb, int, numeric, jsonb, text, text, text
) to anon, authenticated;


-- ============================================================
--  4) تعليم إن الزائر أتمّ الطلب
-- ============================================================
create or replace function public.mark_activity_ordered(
  p_session text,
  p_code    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.customer_activity
     set ordered = true, order_code = p_code, stage = 'ordered', updated_at = now()
   where session_id = p_session
  returning id into v_id;

  if v_id is not null then
    insert into public.customer_events (activity_id, kind, label)
    values (v_id, 'ordered', p_code);
  end if;
end;
$$;

grant execute on function public.mark_activity_ordered(text, text) to anon, authenticated;


-- ============================================================
--  خلاص. لو ظهرت Success بدون أخطاء يبقى كل حاجة تمام.
-- ============================================================
