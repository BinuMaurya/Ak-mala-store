-- AK MALA shared product catalogue.
-- Public visitors may read active products only. All writes go through the
-- server-side API after requireAdmin() verifies the Supabase owner session.
create table if not exists public.store_products (
  id text primary key check (char_length(id) between 1 and 100),
  data jsonb not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint store_products_data_object check (jsonb_typeof(data) = 'object')
);

create index if not exists store_products_active_updated_idx
  on public.store_products (is_active, updated_at desc);

alter table public.store_products enable row level security;

drop policy if exists "Public can read active store products" on public.store_products;
create policy "Public can read active store products"
  on public.store_products
  for select
  to anon, authenticated
  using (is_active = true);

revoke all on public.store_products from anon, authenticated;
grant select on public.store_products to anon, authenticated;

-- The server uses the Supabase service-role key for writes. Never expose that
-- key in VITE_ variables or browser code.
