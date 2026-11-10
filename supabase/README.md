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
   SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
   ADMIN_EMAILS=owner@example.com
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
   ```

4. Configure the same variables as server-side secrets in production. Never
   put `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*`
   variable or browser code. Legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported.
5. Configure Razorpay separately using the server-side variables in
   `.env.example`.

## Run checkout locally

1. Copy `.env.example` to `.env` in the project root.
2. Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` from
   the Supabase project. The payment and COD checkout APIs need these server-side
   values to save orders. The legacy `service_role` key can be used as
   `SUPABASE_SERVICE_ROLE_KEY` if needed.
3. In the Razorpay Dashboard, enable Test Mode and copy its API Key ID and Key
   Secret into `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Never put the Key
   Secret in a `VITE_*` variable or share it in chat.
4. Run `npm run dev`, then open `http://localhost:3000` in the browser. Do not
   open `index.html` directly; `file://` cannot load the app modules or its
   payment API.
5. Complete checkout using Razorpay's test-mode flow. Switch to live credentials
   only after the merchant account is activated for live payments.

Restart `npm run dev` after changing `.env`. The checkout reports a configuration
error until both Supabase and Razorpay are configured.

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
