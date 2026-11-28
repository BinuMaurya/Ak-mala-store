alter table public.analytics_events
  add column if not exists event_type text;
