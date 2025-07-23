# AWS Amplify Environment Variables Migration Guide

This document contains all environment variables needed for migrating the Factor Pricing (formerly VoIP Accelerator) application to a new AWS Amplify project.

## Production Environment Variables

### Supabase Configuration
```bash
VITE_SUPABASE_URL=https://mwcvlicipocoqcdypgsy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Y3ZsaWNpcG9jb3FjZHlwZ3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMTcwNzMsImV4cCI6MjA2MjU5MzA3M30.VK3HNJaYGq1AXRNxDIf6u42ZhWBkeQ0sT-jLsAujL7o
VITE_SUPABASE_PUBLIC_URL=https://mwcvlicipocoqcdypgsy.supabase.co
```

### API Configuration
```bash
VITE_API_URL=https://mwcvlicipocoqcdypgsy.supabase.co
```

### Auth Configuration (Domain Transition)
```bash
# Current production domain
VITE_AUTH_REDIRECT_URL=https://voipaccelerator.com/auth/callback
VITE_SITE_URL=https://voipaccelerator.com/

# New domain (ready for switch)
# VITE_AUTH_REDIRECT_URL=https://factorpricing.com/auth/callback
# VITE_SITE_URL=https://factorpricing.com/
```

### Stripe Configuration (Production)
```bash
# Note: These need to be added to production env if using Stripe in production
# Currently only in staging/dev environments
```

## Staging Environment Variables

### Supabase Configuration (Staging)
```bash
VITE_SUPABASE_URL=https://odnwqnmgftgjrdkotlro.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbndxbm1nZnRnanJka290bHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMTcxMDAsImV4cCI6MjA2MjU5MzEwMH0.BMG8mS0KTGJo2SIRh1j31asS0Lo7nSlZcWFiSvkNkjU
VITE_SUPABASE_PUBLIC_URL=https://odnwqnmgftgjrdkotlro.supabase.co
```

### API Configuration (Staging)
```bash
VITE_API_URL=https://odnwqnmgftgjrdkotlro.supabase.co
```

### Auth Configuration (Staging)
```bash
VITE_AUTH_REDIRECT_URL=https://staging.d2fnr90mzdyqva.amplifyapp.com/auth/callback
VITE_SITE_URL=https://staging.d2fnr90mzdyqva.amplifyapp.com/
```

### Stripe Configuration (Staging/Test)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_secret_key_here
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
VITE_STRIPE_PRICE_MONTHLY=price_your_monthly_price_id_here
VITE_STRIPE_PRICE_ANNUAL=price_your_annual_price_id_here
```

## Migration Steps

### 1. Export from Current Amplify Project
1. Go to AWS Amplify Console
2. Select your current app (voip-accelerator)
3. Navigate to "Environment variables"
4. Copy all variables listed above

### 2. Import to New Amplify Project
1. Create new Amplify app (factor-pricing)
2. Go to "Environment variables" in the new app
3. Add each variable from this document
4. For staging branch, use staging variables
5. For main/production branch, use production variables

### 3. Update Auth Redirect URLs in Supabase
Once the new Amplify app is deployed:
1. Go to Supabase Dashboard
2. Navigate to Authentication > URL Configuration
3. Add the new Amplify URLs to:
   - Site URL
   - Redirect URLs

### 4. Domain Transition Strategy
When ready to switch domains:
1. Update DNS records to point to new Amplify app
2. Uncomment the new domain variables in Amplify
3. Comment out or remove the old domain variables
4. Update Supabase redirect URLs accordingly

### Important Notes
- Keep both domain URLs active during transition period
- Ensure Supabase accepts both redirect URLs
- Test auth flow thoroughly before full migration
- Consider using Amplify's custom domain feature for smooth transition

## Build Settings
Ensure your amplify.yml includes:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd client
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: client/dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```