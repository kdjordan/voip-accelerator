# Clean-slate user migration

When porting off Supabase to a self-hosted backend on Hetzner, we are not preserving any existing user accounts, sessions, or per-user data. Existing users (if any) will be required to re-register on the new system; the only data carried over is the curated `enhanced_lerg` table content, which moves via a one-time CSV seed script.

## Considered options

- **Preserve users via password-hash import.** Supabase's bcrypt hashes can be imported by some auth libraries (better-auth, Lucia). Sessions cannot be carried — every user would need to re-log-in regardless, and password reset flows / JWT formats differ.
- **Preserve users via forced password reset on first login.** Migrate the `profiles` rows, blank their passwords, send everyone a reset email at cutover.
- **Clean slate.** Accept that everyone re-registers.

## Why clean slate

- The product currently has no user base whose churn cost outweighs the migration friction.
- Auth migration is the single largest source of risk and time in a port like this. Removing it eliminates entire categories of bugs (hash format mismatches, session-table-shape coupling, password-reset-token format compatibility).
- It lets the new system be treated as greenfield — no need to carry forward schema warts from the legacy `profiles` table or replicate Supabase Auth's quirks (email confirmation states, identity provider rows, metadata blobs).
- The dropped feature surface (single-active-session enforcement, see ADR-0004 wrinkles) lets us avoid migrating `active_sessions` data too.

## Consequences

- The new system can ship without dual-write or fallback paths.
- DNS cutover doubles as a "the old product is gone" event. Any existing users see a re-register prompt at the new site.
- We do not need to run the old Supabase project in parallel after cutover — once DNS flips, the old project can be archived.
