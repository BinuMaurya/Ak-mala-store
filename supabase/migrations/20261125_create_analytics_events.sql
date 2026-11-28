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

create policy "owner insert" on public.analytics_events for insert using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner update" on public.analytics_events for update using (auth.uid() = user_id);
create policy "owner delete" on public.analytics_events for delete using (auth.uid() = user_id);
