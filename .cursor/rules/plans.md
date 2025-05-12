# Subscription Plan Implementation Roadmap

This document outlines the plan to implement a new subscription model with 'Trial', 'Monthly', and 'Annual' tiers. Initially, all new users will be placed on the 'Trial Tier'. Stripe integration for paid plans is a future roadmap item.

## Phase 1: Backend (Supabase) Modifications

1.  **Standardize Plan Identifiers**:

    - The `subscription_status` column in the `public.profiles` table will use the following exact string values:
      - `'trial'`
      - `'monthly'`
      - `'annual'`

2.  **Update New User Onboarding (SQL Function)**:

    - Modify the `public.handle_new_user` SQL function.
    - **Action**: Ensure that when a new user signs up, their `profile.subscription_status` is automatically set to `'trial'`.
    - The `profile.trial_ends_at` field will continue to define the duration of this trial period (currently set to a fixed date: `2025-05-23 23:59:59 UTC`).

3.  **Create Supabase Migration Script**:
    - Draft a new SQL migration script.
    - **Contents**:
      - The updated `CREATE OR REPLACE FUNCTION public.handle_new_user() ...` definition, ensuring `subscription_status` is set to `'trial'` for new profiles.
      - (Optional) Add a comment to the `subscription_status` column in `public.profiles` to document the new accepted values (`'trial'`, `'monthly'`, `'annual'`).
    - **Note on Existing Users**: This initial plan focuses on new signups. Existing users with `NULL` `subscription_status` (currently defaulting to "Free" in the UI) will need a separate migration strategy if their current "Free" status is not to be considered equivalent to the new "Trial" status.

## Phase 2: Frontend (Vue Client) Modifications

1.  **Update TypeScript Definitions (`client/src/types/user-types.ts`)**:

    - Modify the `PlanTier` constant and the `PlanTierType` type alias to reflect the new plan structure.

      ```typescript
      // Example update in user-types.ts
      export const PlanTier = {
        TRIAL: "trial",
        MONTHLY: "monthly",
        ANNUAL: "annual",
      } as const;

      export type PlanTierType = (typeof PlanTier)[keyof typeof PlanTier];
      ```

    - Review and update `PlanLimits` and `PlanFeatures` interfaces:
      - Define (or prepare placeholders for) the specific limits and features associated with the `'trial'` plan.
      - Plan for how these will differ for `'monthly'` and `'annual'` plans once Stripe is integrated.

2.  **Refactor Pinia User Store (`client/src/stores/userStore.ts` or similar)**:

    - Ensure the store accurately loads and reflects the `subscription_status` from the user's Supabase profile.
    - Update any state variables, getters (e.g., `currentPlan`, feature flags derived from plan), or actions to use the new `PlanTierType` values consistently.
    - The Pinia store should become the single source of truth for the user's current plan, eliminating the need for default fallbacks (e.g., `?? 'Free'`) in components.

3.  **Update UI Components**:
    - **`client/src/pages/DashBoard.vue`**:
      - Revise the `currentPlan` computed property to directly use the plan status from the Pinia store without a fallback to `'Free'`.
      - Ensure the UI correctly displays "Trial Plan", "Monthly Plan", or "Annual Plan" based on the store's state.
    - **`client/src/components/home/PricingSection.vue`**:
      - This component will need significant updates to dynamically display 'Monthly' and 'Annual' plans. Consider fetching plan details from a configuration file or an API endpoint in the future.
      - The 'Trial' plan is typically not displayed in a pricing section aimed at upgrades.
    - **General UI Review**:
      - Identify and update any other components that display plan information or conditionally render features based on the user's plan.

## Phase 3: Implementation & Testing Strategy

1.  **Iterative Development**:

    - **Step 1**: Implement backend changes (Supabase migration for `handle_new_user`).
    - **Step 2**: Update TypeScript types and the Pinia store.
    - **Step 3**: Refactor UI components to reflect the new plan structure.

2.  **Local Testing**:

    - Verify the new user signup flow: confirm new users are assigned the `'trial'` plan and `trial_ends_at` is correctly set.
    - Manually update `subscription_status` in your local Supabase `profiles` table for test users to `'monthly'` and `'annual'` to simulate future paid states and verify UI/feature logic.
    - Test UI behavior for a `'trial'` user whose `trial_ends_at` date has passed (e.g., prompts to upgrade).

3.  **Deployment**:
    - Apply Supabase migrations to development/staging and production Supabase projects.
    - Deploy the updated frontend application.

## Future Roadmap: Stripe Integration

- **Objective**: Integrate Stripe for handling 'Monthly' and 'Annual' paid subscriptions.
- **Key Areas**:
  - **Stripe Checkout**: Implement Stripe Checkout sessions for new subscriptions.
  - **Stripe Customer Portal**: Allow users to manage their subscriptions (upgrade, downgrade, cancel, update payment methods) via the Stripe Customer Portal.
  - **Webhooks**: Create Supabase Edge Functions (or other backend endpoints) to handle Stripe webhooks (e.g., `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`). These webhooks will be responsible for:
    - Updating the `subscription_status` in the `public.profiles` table.
    - Potentially managing fields like `current_period_ends_at` or `subscription_id`.
  - **UI Updates**:
    - Connect "Manage Billing & Subscription" button in `DashBoard.vue` to the Stripe Customer Portal.
    - Link CTAs in `PricingSection.vue` to Stripe Checkout.
- **Database Considerations**:
  - May need to add columns to `public.profiles` like `stripe_subscription_id`, `current_period_ends_at`, etc.
