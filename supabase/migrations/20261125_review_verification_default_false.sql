-- New review rows must be explicitly verified by the server-side order check.
-- Existing review records are preserved; this migration changes only the column default.
alter table public.product_reviews
  alter column verified_purchase set default false;

comment on column public.product_reviews.verified_purchase is
  'True only when the server confirms a matching eligible order and product.';
