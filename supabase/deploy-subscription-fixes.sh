#!/bin/bash

# Deploy subscription fix edge functions to staging
# Make sure you're logged into the correct Supabase project first

echo "🚀 Deploying subscription fix edge functions to staging..."

# Deploy stripe-webhook with enhanced logging
echo "📦 Deploying stripe-webhook v2..."
supabase functions deploy stripe-webhook --project-ref odnwqnmgftgjrdkotlro

# Deploy check-subscription-status with enhanced logging  
echo "📦 Deploying check-subscription-status v5..."
supabase functions deploy check-subscription-status --project-ref odnwqnmgftgjrdkotlro

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run diagnose-user-subscription.sql in Supabase SQL editor"
echo "2. Run reset-user-to-trial.sql to reset test user"
echo "3. Test subscription purchase flow"
echo "4. Check edge function logs for detailed debugging info"