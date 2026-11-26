-- 20261127_create_products.sql
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists products_name_idx on public.products (name);

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
