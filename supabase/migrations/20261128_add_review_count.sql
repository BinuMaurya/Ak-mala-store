create table if not exists public.product_review_summaries (
  product_id uuid primary key,
  total_reviews integer not null default 0 check (total_reviews >= 0),
  average_rating numeric(3,2) not null default 0 check (average_rating >= 0 and average_rating <= 5),
  review_count integer not null default 0
);

alter table public.product_review_summaries
  add column if not exists review_count integer not null default 0;

alter table public.product_review_summaries enable row level security;
