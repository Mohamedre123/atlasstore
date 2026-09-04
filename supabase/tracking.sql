-- ============================================================
--  ATLAS Store — تتبّع الأوردر
-- ------------------------------------------------------------
--  انسخ الملف ده كله والصقه في:
--  Supabase → SQL Editor → New query → Run
--
--  شغّله بعد schema.sql و admin-policies.sql و catalog.sql.
--  آمن تشغّله أكتر من مرة.
-- ============================================================


-- ============================================================
--  1) سجل حالات الأوردر
--  ------------------------------------------------------------
--  كل تغيير في الحالة بيتسجّل هنا، فالعميل بيشوف مسار طلبه
--  كامل بالتواريخ مش الحالة الحالية بس.
-- ============================================================
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events(order_id);
create index if not exists order_events_time_idx  on public.order_events(created_at desc);

alter table public.order_events enable row level security;

-- العميل يشوف أحداث أوردراته هو بس
drop policy if exists "قراءة أحداث أوردراتي" on public.order_events;
create policy "قراءة أحداث أوردراتي"
  on public.order_events for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "الأدمن يدير أحداث الأوردرات" on public.order_events;
create policy "الأدمن يدير أحداث الأوردرات"
  on public.order_events for all
  using (public.is_admin())
  with check (public.is_admin());

-- إضافة حدث عند تسجيل أوردر أو تغيير حالته
drop policy if exists "تسجيل حدث لأوردري" on public.order_events;
create policy "تسجيل حدث لأوردري"
  on public.order_events for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.user_id = auth.uid()
    )
  );


-- ============================================================
--  2) تسجيل الحدث تلقائيًا مع كل تغيير حالة
--  ------------------------------------------------------------
--  كده مفيش تغيير بيضيع، حتى لو اتعمل من لوحة Supabase نفسها.
-- ============================================================
create or replace function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.order_events (order_id, status, note)
    values (new.id, coalesce(new.status, 'new'), 'اتسجّل الطلب');
  elsif (new.status is distinct from old.status) then
    insert into public.order_events (order_id, status)
    values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_log_status on public.orders;
create trigger orders_log_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();


-- ============================================================
--  3) تتبّع الطلب برقمه — من غير تسجيل دخول
--  ------------------------------------------------------------
--  العميل اللي مش مسجّل دخول بيكتب رقم الأوردر ورقم موبايله
--  ويشوف حالته. الرقمين مع بعض بيمنعوا أي حد يخمّن الأرقام
--  ويتفرّج على طلبات غيره.
--
--  الدالة بترجّع الحد الأدنى من البيانات — من غير عنوان ولا
--  إيميل ولا رقم كامل.
-- ============================================================
create or replace function public.track_order(code text, phone_tail text)
returns table (
  order_code        text,
  status            text,
  created_at        timestamptz,
  status_updated_at timestamptz,
  total             numeric,
  shipping          numeric,
  items             jsonb,
  first_name        text,
  governorate       text,
  area              text
)
language sql
security definer
set search_path = public
as $$
  select
    o.order_code,
    o.status,
    o.created_at,
    o.status_updated_at,
    o.total,
    o.shipping,
    o.items,
    split_part(coalesce(o.customer->>'fullName', ''), ' ', 1),
    o.customer->>'governorate',
    o.customer->>'area'
  from public.orders o
  where upper(o.order_code) = upper(trim(code))
    and right(coalesce(o.customer->>'phone', ''), 4) = trim(phone_tail)
  limit 1;
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;


-- ============================================================
--  4) مسار الطلب برقمه
-- ============================================================
create or replace function public.track_order_events(code text, phone_tail text)
returns table (status text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select e.status, e.created_at
  from public.order_events e
  join public.orders o on o.id = e.order_id
  where upper(o.order_code) = upper(trim(code))
    and right(coalesce(o.customer->>'phone', ''), 4) = trim(phone_tail)
  order by e.created_at asc;
$$;

grant execute on function public.track_order_events(text, text) to anon, authenticated;


-- ============================================================
--  5) أحداث قديمة للأوردرات الموجودة
--  ------------------------------------------------------------
--  بيضيف حدث «اتسجّل الطلب» لأي أوردر قديم مالوش أحداث،
--  عشان صفحة التتبّع ما تبانش فاضية.
-- ============================================================
insert into public.order_events (order_id, status, note, created_at)
select o.id, coalesce(o.status, 'new'), 'اتسجّل الطلب', o.created_at
from public.orders o
where not exists (
  select 1 from public.order_events e where e.order_id = o.id
);


-- ============================================================
--  خلاص. لو ظهرت Success بدون أخطاء يبقى كل حاجة تمام.
-- ============================================================
