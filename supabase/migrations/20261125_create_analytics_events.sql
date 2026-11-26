-- 20261125_create_analytics_events.sql
create table public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  user_id uuid,
  created_at timestamp with time zone default now(),
  metadata jsonb
);

-- Enable Row Level Security if your project uses RLS
alter table public.analytics_events enable row level security;

-- Simple read policy (allow anyone to read – adjust as needed)
create policy "public read" on public.analytics_events for select using (true);

-- Write policy – only the authenticated user can insert/update/delete their own rows
create policy "owner write" on public.analytics_events for insert, update, delete using (auth.uid() = user_id);
