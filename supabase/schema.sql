create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  text text not null,
  cert text not null check (cert in ('PSPO', 'PMP')),
  done boolean not null default false,
  completed_at timestamptz,
  resource_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  hours numeric(4,1) not null default 0 check (hours >= 0),
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  cert text not null check (cert in ('PSPO', 'PMP')),
  score integer not null check (score between 0 and 100),
  domains jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  cert text not null check (cert in ('PSPO', 'PMP')),
  domain text not null,
  question text not null,
  root text not null default '',
  action text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cert text not null check (cert in ('PSPO', 'PMP', 'Both')),
  type text not null check (type in ('doc', 'video', 'course')),
  done boolean not null default false,
  link text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_dates (
  user_id uuid not null references auth.users(id) on delete cascade,
  cert text not null check (cert in ('PSPO', 'PMP')),
  exam_date date not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, cert)
);

alter table public.tasks enable row level security;
alter table public.study_logs enable row level security;
alter table public.mock_exams enable row level security;
alter table public.error_logs enable row level security;
alter table public.resources enable row level security;
alter table public.exam_dates enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.study_logs to authenticated;
grant select, insert, update, delete on public.mock_exams to authenticated;
grant select, insert, update, delete on public.error_logs to authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.exam_dates to authenticated;

create policy "Users manage own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own study logs" on public.study_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own mock exams" on public.mock_exams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own error logs" on public.error_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own resources" on public.resources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own exam dates" on public.exam_dates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
