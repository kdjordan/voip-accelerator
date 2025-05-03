# User Management & Authentication (Supabase)

This document outlines the plan and considerations for implementing user authentication and management using Supabase within the VoIP Accelerator application.

## 1. Integration Steps

1.  **Supabase Project Setup:**

    - Ensure the Supabase project has Authentication enabled.
    - Enable **Email Provider** and **Google OAuth Provider**. Configure required credentials/settings for Google OAuth.
    - Enable **Confirm email** in Auth settings.
    - Configure necessary Auth settings (e.g., email templates, Site URL, Additional Redirect URLs for confirmation and OAuth callbacks pointing to your `AuthCallbackPage.vue` or similar).

2.  **Install Supabase Client:**

    - Add the `@supabase/supabase-js` package to the client project dependencies (if not already done).

    ```bash
    npm install @supabase/supabase-js
    # or yarn add @supabase/supabase-js
    ```

3.  **Initialize Supabase Client:**

    - Create a singleton instance of the Supabase client, likely in a dedicated service file (`src/services/supabase.service.ts`). Use environment variables for the Supabase URL and Anon Key.

4.  **Implement Authentication UI (`src/components/auth/`, `src/pages/auth/`):**

    - Create Vue components for:
      - `SignUpForm.vue` (include fields for email/password)
      - `SignInForm.vue` (include fields for email/password, plus a "Sign in with Google" button)
      - `PasswordResetRequestForm.vue`
      - `PasswordUpdateForm.vue`
      - `AuthGoogleApiClient.vue` (or similar, to handle Google OAuth flow)
    - Create corresponding pages:
      - `LoginPage.vue`
      - `SignUpPage.vue`
      - `PasswordResetPage.vue`
      - `UpdatePasswordPage.vue`
      - `AuthCallbackPage.vue` (Handles redirects from Google OAuth and email confirmation links)

5.  **Implement Auth Functions (in `src/composables/useAuth.ts` or `src/services/auth.service.ts`):**

    - Wrap Supabase Auth methods:
      - `signUp(email, password, options?)` - _Pass `user_agent` in `options.data`_
      - `signInWithPassword(email, password)`
      - `signInWithGoogle()` - Calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
      - `signOut()`
      - `resetPasswordForEmail(email)`
      - `updateUser({ email: newEmail })` - _Handles user email changes, triggers confirmation flow._
      - `getSession()`
      - `getUser()`
      - `onAuthStateChange((event, session) => ...)` - _Will handle session updates, including those triggered by email change confirmation._

6.  **User Metadata Storage (`profiles` table):**

    - Create a `profiles` table in Supabase `public` schema.
    - **Columns:**
      - `id` (UUID, Primary Key, references `auth.users.id`, `ON DELETE CASCADE`)
      - `created_at` (timestamp with timezone, default `now()`, not null)
      - `updated_at` (timestamp with timezone, nullable)
      - `role` (text, default `'user'`, not null) - _To store 'user' or 'admin'_
      - `trial_ends_at` (timestamp with timezone, nullable) - _Set by trigger_
      - `user_agent` (text, nullable) - _Set by trigger from `auth.users.raw_user_meta_data`_
      - `signup_method` (text, nullable) - _Set by trigger (e.g., 'email', 'google')_
      - `stripe_customer_id` (text, nullable) - _For future Stripe integration_
      - `subscription_status` (text, nullable) - _For future Stripe integration_
    - **Row Level Security (RLS):**
      - Enable RLS on the `profiles` table.
      - Policy 1 (Read Own): Allow users to `SELECT` their own profile (`auth.uid() = id`).
      - Policy 2 (Update Own - Limited): Allow users to `UPDATE` their own profile (`auth.uid() = id`). _Note: User email change is handled via `supabase.auth.updateUser`, not direct table update._ Define what, if any, other profile fields users can update directly via this policy (currently none planned).
      - Policy 3 (Admin Read All): Allow users with `role = 'admin'` to `SELECT` all profiles. Check role using a helper function: `CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$ SELECT role FROM public.profiles WHERE id = auth.uid(); $$ SECURITY DEFINER;`. Policy: `get_my_role() = 'admin'`.
      - Policy 4 (Admin Update Any): Allow users with `role = 'admin'` to `UPDATE` any profile (`get_my_role() = 'admin'`). _Needed for admin management via Supabase UI or future API._
      - _Note: Profile creation is handled by the trigger below._

7.  **Trigger for Profile Creation & Trial:**

    - Create a Supabase Database Function (`handle_new_user`) triggered `AFTER INSERT` on `auth.users`.
    - This function will:
      - `INSERT` a new row into `public.profiles` table:
        - `id`: `NEW.id`
        - `role`: `'user'` (default)
        - `trial_ends_at`: `now() + interval '24 hours'`
        - `user_agent`: `NEW.raw_user_meta_data->>'user_agent'`
        - `signup_method`: `NEW.raw_app_meta_data->>'provider'` (or 'email' if null)
    - Ensure `raw_user_meta_data` field (`user_agent`) is passed correctly during `signUp`.

8.  **State Management (Pinia - `src/stores/user-store.ts`):**

    - Store current auth status (`isAuthenticated`, `isLoading`), user object (`user`), and profile data (`profile`).
    - Use `onAuthStateChange` to:
      - Update auth status.
      - On `SIGNED_IN`, fetch the user's profile using `getUser()` and a query to the `profiles` table (respecting RLS). Store the profile data.
      - On `SIGNED_OUT` or `USER_DELETED`, clear user and profile data.
      - On `USER_UPDATED`, re-fetch user and profile data.

9.  **Route Guards (Vue Router - `src/router/index.ts`):**

    - Implement `router.beforeEach`:
      - Check auth status using `supabase.auth.getSession()` or the `userStore`.
      - Redirect unauthenticated users from protected routes (e.g., `/dashboard`) to `/login`.
      - Redirect authenticated users from `/login`, `/signup` to `/dashboard`.
      - Protect `/admin` routes by checking if `profile.role === 'admin'`.
      - _Future:_ Check trial status (`profile.trial_ends_at`) or subscription status.

10. **Integrate Auth State in UI:**

    - Use the `userStore` (`isAuthenticated`, `profile`) in components:
      - Conditionally show Login/Sign Up vs. Dashboard/Logout links.
      - Show user information (e.g., email) in the dashboard (`DashboardView.vue`).
      - Implement email change functionality within `DashboardView.vue` using `updateUser`.
      - Enable/disable features based on trial status (`profile.trial_ends_at > now()`).
      - Conditionally show Admin links/sections based on `profile.role === 'admin'`.

11. **Admin User Management (Deferred):**
    - Admin tasks (e.g., extending trials, viewing users) will be performed directly via the Supabase web UI for now.
    - Building an in-app admin interface in `AdminView.vue` is deferred.
    - Admin role assignment will be done manually via Supabase UI after initial signup.

## 2. Future Considerations & Priorities

- **Stripe Integration:** High priority after auth. Requires adding `stripe_customer_id`, `subscription_status` to `profiles` and logic for payment flows and status checks.
- **Anti-Abuse Measures:** Monitor trial signups. Rely on email verification and `user_agent`. If abuse becomes significant, reconsider capturing IP via Edge Functions or other server-side validation.
- **Enhanced Admin Roles/UI:** If direct DB management becomes cumbersome or more granular permissions are needed, revisit building the Admin UI (`AdminView.vue`) and potentially use Supabase Custom Claims.
- **Profile Editing:** Add fields like `full_name` if users need to manage more profile data later.

## 3. Implementation Notes

- **Email Change Callback:** When implementing the `AuthCallbackPage.vue`, it will need logic to detect the `type=recovery` (for password reset) vs `type=email_change` fragments/query params potentially added by Supabase redirects to handle the different confirmation flows.
  The `onAuthStateChange` listener in the main app layout or user store setup should automatically detect the session update after a successful email change confirmation.
