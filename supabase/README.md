# AK MALA Supabase setup

This app stores orders and consented, pseudonymous analytics in Supabase. The
browser never receives the service-role key. Orders and analytics have row-level
security enabled with no public policies; only the server accesses them.

## Configure the project

1. Create a Supabase project and run `schema.sql` in its SQL Editor.
2. In Authentication, enable email OTP/magic-link sign-in. Add the deployed
   website URL to the allowed redirect URLs. Add the owner's verified email
   under Authentication > Users; owner sign-in does not allow public account creation.
3. Create a local `.env` file (it is ignored by Git) with:

   ```env
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
   ADMIN_EMAILS=owner@example.com
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
   ```

4. Configure the same variables as server-side secrets in production. Never
   put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable or browser code.
5. Configure Razorpay separately using the server-side variables in
   `.env.example`.

`ADMIN_EMAILS` is a comma-separated allowlist of verified owner email
addresses. Only those accounts can read orders or analytics. The dashboard
authenticates with Supabase email OTP and the server checks each request.

Analytics collection is off until a visitor accepts the consent notice. It
records page/product views and wishlist actions against a random browser ID,
not a name, email, phone number, or social account. Contact and delivery details
are stored only when a customer submits checkout. Social-media identifiers are
not collected. Publish an accurate privacy notice and retention policy before
launching the site publicly.

The production host must run `server.ts` (not a static-only Vite deployment)
for payment, order, analytics, and owner-dashboard APIs.
