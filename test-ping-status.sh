#!/bin/bash

# Get the access token from supabase CLI
echo "Getting access token..."
ACCESS_TOKEN=$(supabase token)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Error: Could not get access token. Make sure you are logged in to Supabase CLI"
    exit 1
fi

# Make the request to ping-status
echo "Testing ping-status function..."
curl -i "https://odnwqnmgftgjrdkotlro.supabase.co/functions/v1/ping-status" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"

echo -e "\nDone!" 