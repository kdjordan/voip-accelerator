# Environment Configuration Guide

This guide outlines the steps and best practices for setting up and managing different environments (e.g., development, testing, production) for your Vue.js application using Vite and Supabase.

---

## 1. Introduction to Environment Management

Using separate environments is crucial for a stable development lifecycle. It allows you to:

- Test new features without affecting live users.
- Use different configurations (e.g., API keys, database connections) for each stage.
- Ensure consistency and reliability in your production deployments.

Common environments include:

- **Development**: For local development and daily work.
- **Staging**: (Optional) A pre-production environment that mimics production as closely as possible.
- **Production**: The live environment accessible to end-users.

---

## 2. Vite Environment Variables

Vite has built-in support for environment variables using `.env` files. Vite loads variables from the following files in your project root:

- `.env`: Loaded in all cases.
- `.env.local`: Loaded in all cases, ignored by git. Used for local overrides.
- `.env.[mode]`: Loaded only in the specified mode.
- `.env.[mode].local`: Loaded only in the specified mode, ignored by git. Used for local overrides for a specific mode.

**Variable Naming:**
To expose variables to your client-side source code, they **must** be prefixed with `VITE_`. For example, `VITE_API_URL`.

**Creating Environment Files:**

Create the following files in your project root:

- **`.env` (optional, for shared variables):**

  ```env
  VITE_APP_NAME="My Awesome App"
  ```

- **`.env.development` (for development-specific variables):**

  ```env
  VITE_API_BASE_URL="http://localhost:3000/api"
  VITE_SUPABASE_URL="YOUR_DEV_SUPABASE_URL"
  VITE_SUPABASE_ANON_KEY="YOUR_DEV_SUPABASE_ANON_KEY"
  ```

- **`.env.production` (for production-specific variables):**

  ```env
  VITE_API_BASE_URL="https://api.yourapp.com/api"
  VITE_SUPABASE_URL="YOUR_PROD_SUPABASE_URL"
  VITE_SUPABASE_ANON_KEY="YOUR_PROD_SUPABASE_ANON_KEY"
  ```

- **`.env.test` (for testing-specific variables):**
  ```env
  VITE_API_BASE_URL="http://localhost:3001/api" # Or a mock server URL
  VITE_SUPABASE_URL="YOUR_TEST_SUPABASE_URL" # Or a mock/local Supabase instance
  VITE_SUPABASE_ANON_KEY="YOUR_TEST_SUPABASE_ANON_KEY"
  # Disable features not needed for tests
  VITE_FEATURE_FLAGS_ANALYTICS="false"
  ```

**Important:** Add `.env*.local` files to your `.gitignore` to prevent committing sensitive local overrides.

```gitignore
# Local .env files
.env.local
.env.*.local
```

**Accessing Environment Variables in Code:**
Vite exposes these variables on the `import.meta.env` object.

```typescript
// Example: src/config/env.ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const APP_NAME = import.meta.env.VITE_APP_NAME || "Default App Name";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase URL or Anon Key is not defined. Please check your .env files."
  );
}
```

---

## 3. Supabase Configuration

It is highly recommended to use separate Supabase projects for different environments:

- **Development Project**: Used for local development and experimentation. Can be reset or modified freely.
- **Test Project**: (Optional, but good practice) Used by automated tests. This might be a dedicated Supabase project or a local Supabase instance spun up via Docker for CI.
- **Production Project**: The live Supabase project serving your users. Data integrity and careful schema migrations are critical here.

Store the Supabase URL and Anon Key for each environment in the corresponding `.env.[mode]` files, as shown above (e.g., `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

**Managing Supabase Instances:**

- **Development:** Use a free-tier Supabase project or run Supabase locally using Docker for faster iteration and offline capabilities.
- **Testing:**
  - For unit tests, you might mock the Supabase client.
  - For integration/E2E tests, use a dedicated test Supabase project or a local Supabase instance that can be easily reset between test runs.
- **Production:** A paid Supabase project with appropriate resources, backups, and security configurations.

---

## 4. `package.json` Scripts

Update your `package.json` to include scripts for running and building your application in different modes. Vite automatically detects the mode based on the command (`dev`, `build`) or an explicit `--mode` flag.

```json
{
  "scripts": {
    "dev": "vite", // Runs in 'development' mode by default
    "build": "vite build", // Runs in 'production' mode by default
    "build:staging": "vite build --mode staging", // Example for a staging environment
    "preview": "vite preview", // Previews the production build locally
    "test": "vitest --mode test", // Example if using Vitest, runs in 'test' mode
    "test:unit": "vitest --environment jsdom --mode test",
    "type-check": "vue-tsc --noEmit -p tsconfig.vitest.json --composite false"
  }
}
```

- `vite` (or `vite dev`): Starts the development server. Loads `.env.development`.
- `vite build`: Bundles your app for production. Loads `.env.production`.
- `vite build --mode <custom_mode>`: Builds for a specific mode, loading `.env.<custom_mode>`.
- `vitest --mode test`: Runs tests, loading `.env.test`.

---

## 5. Typed Environment Variables (Recommended)

To ensure type safety and provide defaults, create a configuration module:

**`src/config/index.ts`**

```typescript
interface AppConfig {
  appName: string;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

const mode = import.meta.env.MODE; // 'development', 'production', 'test', etc.

const config: AppConfig = {
  appName: import.meta.env.VITE_APP_NAME || "VoIP Accelerator",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api", // Default to relative path if not set
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  isProduction: mode === "production",
  isDevelopment: mode === "development",
  isTest: mode === "test",
};

// Validate essential variables
if (!config.supabaseUrl && (config.isDevelopment || config.isProduction)) {
  console.error(
    "FATAL: VITE_SUPABASE_URL is not defined in your .env file for the current mode:",
    mode
  );
}
if (!config.supabaseAnonKey && (config.isDevelopment || config.isProduction)) {
  console.error(
    "FATAL: VITE_SUPABASE_ANON_KEY is not defined in your .env file for the current mode:",
    mode
  );
}

export default config;
```

You can then import `config` throughout your application:

```typescript
import config from "@/config";

console.log(config.appName);
if (config.isProduction) {
  // Production-specific logic
}
```

---

## 6. Building for Different Environments

- **Development:** Run `npm run dev` (or `yarn dev`).
- **Production:** Run `npm run build` (or `yarn build`). This will create an optimized production bundle in the `dist/` directory.
- **Testing:** Tests are usually run directly using a test runner command (e.g., `npm run test`) which will use the mode specified in the script (e.g., `--mode test`). A separate "build" for testing is not always necessary unless you are testing the built output itself.

---

## 7. CI/CD Considerations

When deploying your application using a CI/CD pipeline (e.g., GitHub Actions, GitLab CI, Vercel, Netlify):

- **Do not commit `.env` files containing sensitive production keys to your repository.**
- Use the secrets management features provided by your CI/CD platform to inject environment variables at build or runtime.
- For example, in GitHub Actions, you can define repository secrets and access them in your workflow file:
  ```yaml
  # .github/workflows/deploy.yml
  jobs:
    build_and_deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Set up Node.js
          uses: actions/setup-node@v3
          with:
            node-version: "18" # Or your project's Node version
        - name: Install dependencies
          run: npm install # Or yarn install
        - name: Build
          run: npm run build
          env:
            VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL_PROD }}
            VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_PROD }}
            # Add other production environment variables here
        # ... deployment steps
  ```

---

## 8. Testing Environment Specifics

- **Mocking:** For unit tests, consider mocking external services like Supabase to make tests faster and more deterministic. Libraries like `msw` (Mock Service Worker) or Vitest's mocking features can be useful.
- **Test Database:** For integration or E2E tests that require a real database, use a dedicated test Supabase project or a local Supabase instance. Ensure you have scripts to seed necessary data and reset the database state before/after test runs.
- **Configuration:** Use `.env.test` to configure specific settings for your test runs, such as disabling analytics, using mock API endpoints, or setting specific feature flags.

By following these guidelines, you can establish a robust environment management strategy for your Vue.js application, leading to smoother development, more reliable testing, and safer production deployments.

---

## 9. AWS Amplify Setup (Optional Hosting & Backend)

AWS Amplify can be used for hosting your frontend application, setting up a CI/CD pipeline, and adding backend features like authentication, APIs (GraphQL/REST), and storage.

**Prerequisites:**

- An AWS Account.
- AWS Amplify CLI installed and configured: `npm install -g @aws-amplify/cli` then `amplify configure`.

**Steps to Deploy a Vite Frontend to Amplify Hosting:**

1.  **Initialize Amplify in your project:**
    Navigate to your project's root directory and run:

    ```bash
    amplify init
    ```

    Follow the prompts. Choose your default editor, app type (javascript), framework (vue), and source/distribution directories (usually `src` and `dist` for Vite).

2.  **Add Hosting with Amplify Console:**
    Amplify Console provides Git-based CI/CD, custom domains, feature branches, and PR previews.

    ```bash
    amplify add hosting
    ```

    - Choose **Hosting with Amplify Console (Managed hosting with custom domains, CI/CD, Carbon emissions data)**.
    - This will open the AWS Amplify Console in your browser.
    - Connect your Git provider (GitHub, GitLab, Bitbucket, AWS CodeCommit).
    - Select your repository and branch.

3.  **Configure Build Settings in Amplify Console:**
    Amplify usually detects Vite settings, but you might need to adjust them. The `amplify.yml` file in your root (or configured in the console) controls the build.
    A typical `amplify.yml` for a Vite project:

    ```yaml
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci # or yarn install
        build:
          commands:
            - npm run build # or your specific build script
      artifacts:
        baseDirectory: dist # Vite's default output folder
        files:
          - "**/*"
      cache:
        paths:
          - node_modules/**/*
    ```

4.  **Manage Environment Variables in Amplify Console:**

    - In the Amplify Console, navigate to your app, then go to **Environment variables** (under App settings).
    - Here, you can add the same `VITE_` prefixed environment variables that your application expects (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
    - You can set different values for different branches (e.g., `main` branch gets production Supabase keys, `develop` branch gets dev keys).
    - These variables are injected into the build process, similar to how `.env` files work locally.
    - **Important:** For variables defined here to be available to your Vite app at runtime (client-side), they **must** be prefixed with `VITE_`.
    - For backend environment variables (if you add Amplify backend features), they are managed separately within those specific categories (e.g., Functions, Auth).

5.  **Deployment:**

    - Once your Git repository is connected and build settings are configured, Amplify automatically builds and deploys your app when you push to the connected branch.
    - You can monitor build logs and deployment status in the Amplify Console.

6.  **Manual Deploys (Alternative, less common for frontend):**
    If you chose "Manual deployment" when adding hosting (not recommended for CI/CD):

    ```bash
    amplify publish
    ```

    This command builds your project using your local Amplify backend environment variables (if any) and uploads the artifacts to Amplify Hosting. Environment variables for the frontend build still need to be managed carefully, possibly by committing mode-specific `.env.[mode]` files (less secure for sensitive keys if the repo is public/shared) or by using the Amplify Console environment variable settings even with manual deploys.

7.  **Custom Domains:**
    Configure custom domains for your hosted application via the Amplify Console under **Domain management**.

8.  **Multiple Environments (Branches):**
    Amplify Hosting makes it easy to create new environments based on Git branches. Each branch can have its own environment variable configurations, backend environment (if using Amplify backend features), and custom domain.

By integrating AWS Amplify, you can streamline your deployment process and leverage its scalable infrastructure for hosting your Vue/Vite application.

---

## 10. Current State & Database Setup

### Current State & Migration Summary

- **Edge Functions:** Assumed to be managed as previously stated.
- **Database Migrations:** A series of migrations have been applied to set up core tables, functions, and RLS policies. These include:
  - `profiles_migration`: Created the `public.profiles` table and initial RLS policies.
  - `lerg_migration`: Created the `public.get_my_role()` SQL function, the `public.lerg_codes` table, and its RLS policies.
  - `add_admin_rls_to_profiles`: Added admin-specific RLS policies to the `public.profiles` table.
  - `create_profile_on_signup_trigger`: Intended to create the `public.handle_new_user()` SQL function and the trigger on `auth.users` to populate profiles. Due to permissions, the trigger part of this migration required manual application via the Supabase SQL Editor.
- **Manual Steps:** The trigger `on_auth_user_created` on `auth.users` (executing `public.handle_new_user`) was set up manually via the Supabase SQL Editor due to migration permission constraints.

### Key Database Objects Implemented

The following core database objects have been set up in the `public` schema (unless otherwise specified):

1.  **`profiles` Table:**

    - Stores user-specific information, linked to `auth.users.id`.
    - Columns include `id`, `created_at`, `updated_at`, `role`, `trial_ends_at`, `user_agent`, `signup_method`, `stripe_customer_id`, `subscription_status`.
    - **RLS Policies:**
      - Users can read their own profile.
      - Users can update their own profile.
      - Admins (via `get_my_role()`) can select any profile.
      - Admins (via `get_my_role()`) can update any profile.

2.  **`lerg_codes` Table:**

    - Stores LERG (Local Exchange Routing Guide) data.
    - Columns include `id` (serial), `npa`, `state`, `country`, `last_updated`.
    - Includes indexes on `country` and `state`, and a unique constraint on `npa`.
    - **RLS Policies:**
      - Authenticated users can select records.
      - Admins (via `get_my_role()`) can update records.
      - Admins (via `get_my_role()`) can delete records.

3.  **SQL Functions:**

    - **`public.get_my_role()`**:
      - Retrieves the `role` for the currently authenticated user from their `public.profiles` record.
      - Used in RLS policies for admin-level access.
    - **`public.handle_new_user()`**:
      - Triggered after a new user is inserted into `auth.users`.
      - Creates a corresponding record in `public.profiles`.
      - Sets a default `role` ('user').
      - Sets a fixed `trial_ends_at` date to `'2025-05-23 23:59:59+00'`.
      - Populates `user_agent` and `signup_method` from the new user's metadata.

4.  **Triggers:**
    - **`on_auth_user_created` on `auth.users` Table:**
      - Fires `AFTER INSERT` on `auth.users`.
      - Executes the `public.handle_new_user()` function.
      - _Note: This trigger was applied manually via the Supabase SQL Editor._

### Manual Table Schema Copy (Supabase Portal) - Legacy/Fallback

If, for any reason, schemas are out of sync and not covered by migrations (which should be the primary method for schema changes), the following manual copy process can be used as a fallback. However, all new schema changes should ideally be managed via migration files.

1. **Open Staging Project:**

   - Go to [app.supabase.com](https://app.supabase.com) and select your **staging** project.
   - Navigate to the **Table Editor** in the sidebar.
   - For each table you want to copy (e.g., `profiles`):
     - Click the table name.
     - Note down all columns, data types, default values, primary keys, unique constraints, and foreign keys.
     - Also note any Row Level Security (RLS) policies under **Authentication > Policies** for that table.

2. **Open Production Project:**

   - In a new tab, open your **production** project in the Supabase dashboard.
   - Go to the **Table Editor**.
   - Click **"New Table"** (or similar) to create a new table.
   - Enter the table name and add columns, types, defaults, and constraints to match the staging table exactly.
   - Save the table.

3. **Add Constraints and Relationships:**

   - If your table has foreign keys or unique constraints, add them as needed (either in the Table Editor or via the SQL Editor for more complex constraints).

4. **Copy RLS Policies:**

   - Go to **Authentication > Policies** in production.
   - Select your new table and add any RLS policies to match those in staging. Copy the `USING` and `WITH CHECK` expressions as needed.

5. **Test:**
   - After creating the tables and policies, test your production app to ensure the schema matches and everything works as expected.

**Tip:** For complex tables, you can use the SQL Editor in staging to generate a `CREATE TABLE` statement (right-click table > "Generate CREATE statement" if available), then copy and run it in the production SQL Editor, adjusting as needed.

---
