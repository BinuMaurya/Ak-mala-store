SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('orders','product_reviews','product_review_summaries','store_content','analytics_events');
