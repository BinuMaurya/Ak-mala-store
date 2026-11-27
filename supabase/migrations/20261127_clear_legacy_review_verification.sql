-- Older review rows may have inherited verified_purchase=true from the original schema default.
-- Clear only the verification flag; preserve review text, photos, order links, and moderation status.
update public.product_reviews
set verified_purchase = false
where verified_purchase is distinct from false;

alter table public.product_reviews
  alter column verified_purchase set default false;

comment on column public.product_reviews.verified_purchase is
  'True only when the server confirms a matching delivered order and eligible payment.';
