# AGENT BRIEF — ResponKu.id: "Sign in with FunikIn" (OIDC Client)

## 1. Goal
Replace/augment ResponKu's current login so users authenticate through **FunikIn** (`auth.funikin.com`), an OAuth 2.1 / OpenID Connect provider (Supabase Auth OAuth server). ResponKu acts as a **confidential OIDC client**: its backend holds the `client_secret`, does the code exchange, verifies the `id_token`, and then creates ResponKu's own session.

ResponKu never sees user passwords. FunikIn is the source of identity; ResponKu remains the source of its own app data.

## 2. Prerequisite (do not start coding before this)
The FunikIn side must be ready and a client for ResponKu registered. Required values from the FunikIn owner, provided via env vars (never hardcode, never commit):

```
FUNIKIN_ISSUER=            # OIDC issuer URL (from FunikIn's discovery document)
FUNIKIN_CLIENT_ID=
FUNIKIN_CLIENT_SECRET=     # server-side only
FUNIKIN_REDIRECT_URI=https://responku.id/api/auth/callback/funikin
NEXTAUTH_URL=https://responku.id
AUTH_SECRET=               # random 32+ bytes
```
Dev redirect: `http://localhost:3000/api/auth/callback/funikin` (must also be registered on FunikIn). If values are missing, stop and ask; do not invent or mock production values.

## 3. Assumed current state (VERIFY by reading the repo first)
- Next.js (App Router) + TypeScript, deployed at responku.id.
- Uses its own Supabase project for data (chat sessions/history, persistent user memory, schedules) and possibly Supabase Auth with RLS keyed on `auth.uid()`.
- Groq-powered AI chat with per-session and persistent memory.

**Step 0 — Audit before changing anything.** Produce a short written report (in the PR description) answering:
1. How are users authenticated today? Which tables/columns reference `auth.users.id` or `auth.uid()`?
2. Which RLS policies depend on `auth.uid()`?
3. Where is the session read on the server and on the client?
4. How many existing users/rows would be affected?
Base every later decision on this report, not on the assumptions above.

## 3b. Key constraint
Supabase cannot natively consume an arbitrary external OIDC issuer as a login provider. Therefore ResponKu must handle the OIDC flow itself (Auth.js) and manage its own session. Any RLS that relies on `auth.uid()` will NOT see FunikIn users automatically. Choose the data-access strategy below and justify it in the audit report.

## 4. Data-access strategy (choose one, default = A)
**A. Server-side access (default).** All Supabase reads/writes go through Next.js server code (route handlers / server actions) using the Supabase **service/secret key on the server only**, after verifying the ResponKu session. Authorization is enforced in code: every query is scoped by the local `user_id`. Lock down tables with RLS that denies all direct anon/authenticated access (service key bypasses RLS). Remove any client-side direct table access.
**B. Mint Supabase-compatible JWTs.** Only if the audit shows A is impractical. Requires signing JWTs with a Supabase JWT secret/key; higher risk. Do not choose B without asking.

## 5. Implementation plan

### 5.1 Auth.js (NextAuth v5) generic OIDC provider
- Install `next-auth@beta` (Auth.js v5) or the version matching the repo's Next.js; confirm compatibility first.
- Configure a custom provider id `funikin`, `type: "oidc"`, `issuer: FUNIKIN_ISSUER`, `clientId`, `clientSecret`, `checks: ["pkce", "state", "nonce"]`, scope `openid profile email`.
- Session strategy: JWT (encrypted cookie) or database sessions — pick based on the audit; keep cookie `httpOnly`, `secure`, `sameSite=lax`.
- In callbacks, persist the FunikIn **`sub`** into the token/session and expose `session.user.id` = local user id (not the FunikIn sub).
- Verify `iss`, `aud` (= our client_id), `exp`, `nonce`, signature via JWKS (Auth.js/openid-client do this; add a test that proves it).
- Handle provider errors (`access_denied`, `invalid_request`, expired state) with a friendly `/login/error` page.

### 5.2 User identity mapping
- Create/extend table `app_users`: `id uuid pk default gen_random_uuid()`, `funikin_sub text unique not null`, `email`, `name`, `avatar_url`, `created_at`, `last_login_at`.
- Identify users by **`sub`**, never by email. Update `email/name/avatar` on each login.
- On first login: look up by `funikin_sub`; if absent, create. Upsert must be atomic (unique constraint + `on conflict`).

### 5.3 Migrating existing ResponKu users (only if audit finds any)
- Add `funikin_sub` to the mapping; link legacy accounts by **verified email only**, and only when the FunikIn `email_verified` claim is true. If email matches but not verified → do NOT auto-link; show a manual-link flow.
- Re-point existing data (`chat_sessions`, `user_memory`, schedule/history tables) from the legacy user id to the new local id inside a single migration; write it as a reversible SQL migration; take a backup note in the PR.
- Never delete legacy users in this change.

### 5.4 Routes & UI
- `/login` — single "Masuk dengan FunikIn" button (Indonesian default), preserves `callbackUrl` (validated: same-origin paths only).
- `/api/auth/*` — Auth.js handlers.
- Middleware protecting private routes (existing KRS planner routes, chat, history) → redirect to `/login?callbackUrl=...`.
- Header user menu: avatar/name, link "Kelola akun FunikIn" (opens `https://auth.funikin.com/account`), Logout.
- Loading, error and "session expired" states.

### 5.5 Logout
- Clear ResponKu session (Auth.js `signOut`).
- Then optionally redirect to `https://auth.funikin.com/logout?redirect_to=https://responku.id` so the FunikIn session ends too (the target must be on FunikIn's allowlist). Make this a documented choice: local-only logout vs. global logout. Default: local logout + a "Keluar dari FunikIn juga" option.

### 5.6 AI chat & memory continuity
- Everything keyed by the Supabase user id today (chat sessions, persistent memory, schedule-change history) must now key on `app_users.id`.
- Groq API key stays server-side; no change to model behaviour.
- Regression-check: history sidebar, persistent memory recall, schedule change history saving.

## 6. Security requirements
- `client_secret`, `AUTH_SECRET`, Supabase secret key: server env only; add to `.env.example` as empty placeholders; confirm none appear in the client bundle (grep the build output).
- `callbackUrl`/post-login redirect: allow only relative same-origin paths.
- All API routes check the session server-side; no trust in client-sent `user_id`.
- Rate-limit `/api/auth/*` and AI chat endpoints per user/IP.
- Security headers (CSP, `frame-ancestors 'none'`, `Referrer-Policy`, HSTS).
- Do not log tokens, codes, or secrets.

## 7. Tests (required)
- Unit: user upsert by `sub` (new user, returning user, changed email), safe `callbackUrl` validator.
- Integration (against FunikIn staging or a mock OIDC provider): login success, user denies consent, tampered `state`, replayed `code`, wrong `nonce`, expired token.
- Authorization: user A cannot read user B's sessions/memory/history via any route.
- Migration test on a copy of data: row counts before/after match; reversible.
- E2E smoke: login → open KRS planner → AI chat → logout.

## 8. Delivery phases
1. Audit report (Section 3, Step 0) → confirm data-access strategy with the owner.
2. Auth.js OIDC provider wired to FunikIn **staging**; `/login`, callback, session working with a throwaway test page.
3. `app_users` + identity mapping + server-side data-access layer.
4. Move existing features onto the new user id; middleware; header menu; logout.
5. Legacy-user migration (only if needed), behind a feature flag.
6. Security headers, rate limits, tests, README section "Login via FunikIn" (env vars, how to run locally, how to rotate the secret).

## 9. Acceptance criteria
- A new user can click "Masuk dengan FunikIn", authenticate at auth.funikin.com, return to ResponKu, and see their own data.
- Returning users land on the same local account (matched by `sub`).
- Denying consent or a bad/expired flow returns to `/login/error` with no session created.
- No route returns another user's data (tested).
- No secrets in repo or client bundle; `tsc --noEmit`, lint and tests pass.
- Existing features (KRS planner, AI chat, memory, history) behave the same as before.

## 10. Ask before doing
- Choosing Strategy B (custom JWTs), changing the Supabase schema beyond what is described, deleting legacy accounts, or adding any auth library other than Auth.js.
- Any mismatch between this brief and what the repo actually contains: report it, propose options, then proceed once confirmed.
