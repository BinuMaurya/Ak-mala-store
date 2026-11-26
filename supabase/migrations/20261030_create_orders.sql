create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  visitor_id uuid,
  customer_name text not null,
  phone text not null,
  email text,
  shipping_address jsonb not null,
  items jsonb not null,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null check (discount >= 0),
  delivery_charge integer not null check (delivery_charge >= 0),
  total integer not null check (total > 0),
  payment_method text not null check (payment_method in ('upi', 'card', 'netbanking', 'wallet', 'cod')),
  payment_status text not null check (payment_status in ('paid', 'pending')),
  order_status text not null default 'confirmed' check (order_status in ('confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered')),
  delivery_otp_hash text,
  delivery_otp_expires_at timestamptz,
  delivery_otp_attempts smallint not null default 0 check (delivery_otp_attempts between 0 and 5),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_visitor_id_idx on public.orders (visitor_id);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;