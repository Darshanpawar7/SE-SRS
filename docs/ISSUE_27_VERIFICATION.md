# Issue #27: Keep credentials out of source control

The repository does not contain a project credential. `.env`, `.env.local`, and
`.env.production` are ignored, while `.env.example` contains placeholders only.
The application reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the
build environment or accepts them through the in-app settings screen.

Configuration validation requires an HTTPS Supabase URL and rejects empty,
whitespace-containing, placeholder, service-role, and secret keys. Only the
Supabase anon/public or publishable key belongs in the browser; it is not a
database administrator credential.

Setup:

1. Copy `.env.example` to `.env.local`.
2. Set the project URL and anon/public key locally.
3. Keep `.env.local` untracked and never paste a service-role or secret key
   into the app.
4. Rotate a key in the Supabase dashboard if it is exposed, then update the
   local environment or in-app configuration.
