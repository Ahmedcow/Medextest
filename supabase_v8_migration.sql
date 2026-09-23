-- MedEx v8 migration: admin analytics, anonymous exam counting, and user favourites.
-- Run this in Supabase SQL Editor after the existing MedEx schema/functions are installed.

create table if not exists public.exam_submission_analytics (
  exam_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  total integer not null default 0,
  correct integer not null default 0,
  accuracy numeric not null default 0,
  submitted_at timestamptz not null default now()
);

create index if not exists exam_submission_analytics_user_idx on public.exam_submission_analytics(user_id);
create index if not exists exam_submission_analytics_submitted_idx on public.exam_submission_analytics(submitted_at);

alter table public.exam_submission_analytics enable row level security;


-- Backfill historical signed-in exams already stored in the existing `exams` table.
insert into public.exam_submission_analytics(exam_id,user_id,total,correct,accuracy,submitted_at)
select id,user_id,total,correct,accuracy,coalesce(finished_at,now())
from public.exams
on conflict (exam_id) do nothing;


drop policy if exists "analytics insert" on public.exam_submission_analytics;
create policy "analytics insert" on public.exam_submission_analytics
for insert to anon, authenticated
with check (
  (auth.uid() is null and user_id is null)
  or
  (auth.uid() is not null and user_id = auth.uid())
);

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.user_favorites enable row level security;
drop policy if exists "users read own favourites" on public.user_favorites;
create policy "users read own favourites" on public.user_favorites
for select to authenticated using (user_id=auth.uid());
drop policy if exists "users insert own favourites" on public.user_favorites;
create policy "users insert own favourites" on public.user_favorites
for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "users delete own favourites" on public.user_favorites;
create policy "users delete own favourites" on public.user_favorites
for delete to authenticated using (user_id=auth.uid());

create or replace function public.record_exam_submission(
  p_exam_id text,
  p_total integer,
  p_correct integer,
  p_accuracy numeric,
  p_visitor_id text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.exam_submission_analytics(exam_id,user_id,visitor_id,total,correct,accuracy)
  values (
    p_exam_id,
    auth.uid(),
    case when auth.uid() is null then left(coalesce(p_visitor_id,''),120) else null end,
    greatest(coalesce(p_total,0),0),
    greatest(coalesce(p_correct,0),0),
    greatest(coalesce(p_accuracy,0),0)
  )
  on conflict (exam_id) do nothing;
end;
$$;

revoke all on function public.record_exam_submission(text,integer,integer,numeric,text) from public;
grant execute on function public.record_exam_submission(text,integer,integer,numeric,text) to anon, authenticated;

-- Uses the same is_admin() function already used by MedEx.
create or replace function public.get_admin_exam_analytics()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select json_build_object(
    'total', count(*)::integer,
    'signedIn', count(*) filter (where user_id is not null)::integer,
    'anonymous', count(*) filter (where user_id is null)::integer
  )
  into result
  from public.exam_submission_analytics;

  return result;
end;
$$;

revoke all on function public.get_admin_exam_analytics() from public;
grant execute on function public.get_admin_exam_analytics() to authenticated;
