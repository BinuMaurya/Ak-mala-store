DROP VIEW IF EXISTS public.product_review_summaries; 

create table if not exists public.product_review_summaries (
  product_id uuid primary key references public.products(id),
  total_reviews integer not null default 0 check (total_reviews >= 0),
  average_rating numeric(3,2) not null default 0 check (average_rating >= 0 and average_rating <= 5)
);

create index if not exists product_review_summaries_product_id_idx on public.product_review_summaries (product_id);

alter table public.product_review_summaries enable row level security;
revoke all on public.product_review_summaries from anon, authenticated;