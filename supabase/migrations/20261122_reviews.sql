create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  author text not null,
  city text not null,
  rating smallint not null check (rating between 1 and 5),
  title text not null,
  comment text not null,
  photo_url text,
  verified_purchase boolean not null default true,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create index if not exists product_reviews_public_idx
  on public.product_reviews (product_id, created_at desc)
  where status = 'approved';
create index if not exists product_reviews_moderation_idx
  on public.product_reviews (status, created_at desc);

create or replace view public.product_review_summaries as
select
  product_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*)::integer as review_count
from public.product_reviews
where status = 'approved'
group by product_id;

alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from anon, authenticated;
revoke all on public.product_review_summaries from anon, authenticated;
grant select on public.product_review_summaries to service_role;
