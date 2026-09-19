# TradersProp — Supabase Authentication Setup

This build uses **Supabase Auth** as the source of truth for client sign-up, login,
sessions, password changes and logout. The old browser-password authentication
fallback has been removed.

## 1. Create/open your Supabase project

In the Supabase dashboard, create a project (or use your existing TradersProp project).

## 2. Configure the client

Open `config.js` and replace:

- `YOUR_SUPABASE_PROJECT_URL` with the project's public URL.
- `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` with the project's public anon/publishable key.

Do **not** use a `service_role` key in the browser.

## 3. Authentication settings

In Supabase Dashboard → Authentication → URL Configuration:

- Add your production TradersProp site URL to **Site URL**.
- Add the production URL plus `/#/login` to **Redirect URLs**.
- If you test on a Vercel preview, add that preview URL as an additional redirect URL.

Example redirect target used by this app:

`https://your-tradersprop-domain.example/#/login`

## 4. Email confirmation

The app supports both configurations:

- If email confirmation is disabled, signup immediately creates a session and opens the dashboard/challenge flow.
- If email confirmation is enabled, signup tells the client to confirm their email before logging in.

For production, configure Supabase's SMTP/email provider rather than relying on a development mail setup.

## 5. User profile data

Signup stores these fields in Supabase Auth user metadata:

- `fullName`
- `location`
- `phone`
- `referralCode`
- `role` (defaults to `client`)
- `kycStatus` (defaults to `Not submitted`)

The browser application state mirrors non-secret profile information for the existing
client dashboard. Passwords are never stored in `localStorage` by this build.

## 6. Existing TradersProp database / server

Supabase Auth authenticates the user. PesaPal, KYC, MT5, ledger and other sensitive
operations should continue to be enforced by authenticated server-side APIs.

If your backend needs the authenticated user identity, send the Supabase access token
as a Bearer token and verify it server-side using Supabase/JWT verification. Never trust
an email, role, account ID or payment status supplied only by the browser.
