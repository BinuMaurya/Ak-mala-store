alter table if exists public.orders
  add column if not exists delivery_otp_hash text,
  add column if not exists delivery_otp_expires_at timestamptz,
  add column if not exists delivery_otp_attempts smallint not null default 0;

alter table if exists public.orders
  drop constraint if exists orders_delivery_otp_attempts_check;

alter table if exists public.orders
  add constraint orders_delivery_otp_attempts_check
  check (delivery_otp_attempts between 0 and 5);
