# User Management & Authentication (Supabase)

This document outlines the plan and considerations for implementing user authentication and management using Supabase within the VoIP Accelerator application.

**Current Status (as of YYYY-MM-DD):**

- Steps 1-8 completed.
- `client/src/stores/shared-store.ts` was refactored into `client/src/stores/user-store.ts` and updated for Supabase auth.
- `client/src/utils/utils.ts` was deleted.
- Components (`DashBoard.vue`, `App.vue`, `AppMobileNav.vue`, `SideNav.vue`) updated to use `user-store.ts`; related TS errors resolved.
- Redundant `client/src/stores/shared-store.ts` file deleted.
- Step 9: Route Guards implemented in `client/src/router/index.ts`. [COMPLETED]
- Step 10 (Integrate Auth State in UI): [COMPLETED]
  - Navigation components (`AppMobileNav.vue`, `SideNav.vue`) updated to filter items based on auth state (using `userStore`) and added Logout/Login buttons. [COMPLETED]
  - `DashboardView.vue` updated to display user info (email, last login, account created), trial status, and includes an email change form (using `userStore`). [COMPLETED]
- Auth Pages/Components created: [COMPLETED]
  - `client/src/pages/auth/LoginPage.vue`
  - `client/src/components/auth/SignInForm.vue` (with calls to `userStore.loginWithPassword`, `userStore.loginWithGoogle`)
  - `client/src/pages/auth/SignUpPage.vue`
  - `client/src/components/auth/SignUpForm.vue` (with calls to `userStore.signUp`, `userStore.loginWithGoogle`, passing `user_agent`)
- Router (`client/src/router/index.ts`) updated with `/login` and `/signup` routes. [COMPLETED]
- Step 11: `userStore` actions implemented. Listener (`initializeAuthListener`) added to `App.vue` and confirmed to fetch profile data on load/refresh. [COMPLETED]
- Step 12: `AuthCallbackPage.vue` implemented and handles redirects. [COMPLETED]

- **Next Steps:**
  1.  **Test Full Auth Flow:** [PRIORITY] Systematically test all remaining authentication flows:
      - Google Sign-In (initial login & linking)
      - Email/Password Sign Up (including email confirmation if enabled)
      - Email/Password Sign In
      - Logout
      - Email Change (confirmation flow)
      - Password Reset Request (email sending)
      - Password Update (via link - requires Step 4 below)
      - Route Guard Protection (verify redirects for protected/auth pages)
  2.  **Refine Auth UI/UX:** Implement user feedback (e.g., toasts/notifications for success/error messages during sign-in, sign-up, email/password changes), loading states on buttons/forms, and handle edge cases gracefully.
  3.  **Implement Password Update Page/Logic:** Create the page/component (`UpdatePasswordPage.vue` / `PasswordUpdateForm.vue`) and associated route (`/update-password`) for users to set a new password after clicking the reset link. Implement the Supabase `updateUser` call for password changes within the `userStore`.
  4.  **Review Navigation Item `meta`:** Check `@/constants/navigation` for correct conditional rendering logic based on auth state, user role (`userStore.getUserRole`), or trial status (`userStore.isTrialActive`).
  5.  **Admin User Management (Deferred):** Building an in-app admin interface (`AdminView.vue`) remains a future task.

## 1. Integration Steps

1.  **Supabase Project Setup:** [COMPLETED - Assumed]

    - Ensure the Supabase project has Authentication enabled.
    - Enable **Email Provider** and **Google OAuth Provider**. Configure required credentials/settings for Google OAuth.
    - Enable **Confirm email** in Auth settings.
    - Configure necessary Auth settings (e.g., email templates, Site URL, Additional Redirect URLs for confirmation and OAuth callbacks pointing to your `AuthCallbackPage.vue` or similar).
    - _Note: Supabase migrations and function definitions (like the trigger below) should be managed within the `/supabase` directory._

2.  **Install Supabase Client:**

    - Add the `@supabase/supabase-js` package to the client project dependencies (if not already done).

    ```bash
    npm install @supabase/supabase-js
    # or yarn add @supabase/supabase-js
    ```

3.  **Initialize Supabase Client:**

    - Create a singleton instance of the Supabase client, likely in a dedicated service file (`src/services/supabase.service.ts`). Use environment variables for the Supabase URL and Anon Key.

4.  **Implement Authentication UI (`src/components/auth/`, `src/pages/auth/`):** [COMPLETED - Structure Assumed]

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

5.  **Implement Auth Functions (in `src/composables/useAuth.ts` or `src/services/auth.service.ts`):** [COMPLETED - Structure Assumed]

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

6.  **User Metadata Storage (`profiles` table):** [COMPLETED]

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

7.  **Trigger for Profile Creation & Trial (Database Function):** [COMPLETED]

    - Create a **Supabase Database Function** (not an Edge Function) named `handle_new_user`.
    - This function will be triggered `AFTER INSERT` on the `auth.users` table.
    - _The SQL definition for this function and its trigger should be saved as a migration file within the `/supabase/migrations` directory._ (File: `supabase/migrations/20230101000000_create_profile_on_signup.sql`)
    - The function will perform the following logic:
      - `INSERT` a new row into `public.profiles` table:
        - `id`: `NEW.id`
        - `role`: `'user'` (default)
        - `trial_ends_at`: `now() + interval '24 hours'`
        - `user_agent`: `NEW.raw_user_meta_data->>'user_agent'`
        - `signup_method`: `NEW.raw_app_meta_data->>'provider'` (or 'email' if null)
    - Ensure `raw_user_meta_data` field (`user_agent`) is passed correctly during `signUp`.

8.  **State Management (Pinia - `src/stores/user-store.ts`)**: [COMPLETED]

    - Utilize the existing `user-store.ts` Pinia store (refactored from `shared-store.ts`).
    - Add state properties for current auth status (`isAuthenticated`, `isLoading`), Supabase user object (`user`), and profile data (`profile`).
    - Use `onAuthStateChange` to:
      - Update auth status.
      - On `SIGNED_IN`, fetch the user's profile using `getUser()` and a query to the `profiles` table (respecting RLS). Store the profile data.
      - On `SIGNED_OUT` or `USER_DELETED`, clear user and profile data.
      - On `USER_UPDATED`, re-fetch user and profile data.

9.  **Route Guards (Vue Router - `src/router/index.ts`):** [COMPLETED - Requires verification after state loading fix]

    - Implement `router.beforeEach`:
      - Check auth status.
      - Redirect unauthenticated users from protected routes (e.g., `/dashboard`) to `/login`.
      - Redirect authenticated users from `/login`, `/signup` to `/dashboard`.
      - Protect `/admin` routes (pending profile loading fix).
      - _Future:_ Check trial status (pending profile loading fix).

10. **Integrate Auth State in UI:** [IN PROGRESS - Blocked by refresh issues]

    - Use the `userStore` (from `user-store.ts`) (`isAuthenticated`, `profile`) in components:
      - Conditionally show Login/Sign Up vs. Dashboard/Logout links in navigation (`AppMobileNav.vue`, `SideNav.vue`). [COMPLETED]
      - Show user information (e.g., email) in the dashboard (`DashboardView.vue`). [COMPLETED]
      - Implement email change functionality within `DashboardView.vue` using `updateUser`. [COMPLETED]
      - Show trial status in `DashboardView.vue` (pending profile loading fix).
      - Enable/disable features based on trial status (pending profile loading fix).
      - Conditionally show Admin links/sections based on `profile.role === 'admin'` in navigation (pending profile loading fix).
    - Create core authentication pages/components (`LoginPage.vue`, `SignInForm.vue`, `SignUpPage.vue`, `SignUpForm.vue`). [COMPLETED]

11. **Implement `userStore` Actions & Listener:** [COMPLETED - Profile fetch on refresh needs fix]

    - Implement actions in `user-store.ts`.
    - Ensure `onAuthStateChange` listener correctly updates state and fetches profile (issue on initial load/refresh).

12. **Implement Auth Callback Page:** [COMPLETED]

    - Create `AuthCallbackPage.vue` and associated route (`/auth/callback`).
    - Handle redirects from OAuth providers (primarily via listener/guards).
    - Configure Supabase Site URL and Redirect URLs.

13. **Admin User Management (Deferred):**
    - Admin tasks (e.g., extending trials, viewing users) will be performed directly via the Supabase web UI for now.
    - Building an in-app admin interface in `AdminView.vue`
