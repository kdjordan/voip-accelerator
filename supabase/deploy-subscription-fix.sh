#!/bin/bash

# Deploy fixed check-subscription-status edge function
echo "🚀 Deploying fixed check-subscription-status edge function..."
echo ""
echo "This script fixes the 'now' variable reference bug in the edge function."
echo ""

# Check if running with correct permissions
echo "⚠️  If you get a 403 error, you may need to:"
echo "   1. Login with: supabase login"
echo "   2. Or use a service role key with proper permissions"
echo ""

# Deploy the function
supabase functions deploy check-subscription-status \
  --project-ref odngnmfifqjrdkqltlro \
  --no-verify-jwt

echo ""
echo "✅ Deployment attempt complete!"
echo ""
echo "To verify the fix worked:"
echo "1. Refresh the application"
echo "2. Check if the 500 errors are gone from the console"
echo "3. The user should be able to access the app on their trial plan"