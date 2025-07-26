#!/usr/bin/env -S deno run --allow-env --allow-net

import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

// Initialize Stripe with the secret key from environment
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

async function listStripeProductsAndPrices() {
  try {
    console.log('🔍 Fetching all products from Stripe Pricing Sandbox...\n');
    
    // Get all products
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    });

    console.log(`Found ${products.data.length} active products:\n`);

    // Get all prices
    const prices = await stripe.prices.list({
      limit: 100,
      active: true,
    });

    console.log('📋 PRODUCTS AND THEIR PRICES:');
    console.log('=' .repeat(80));

    for (const product of products.data) {
      console.log(`\n🏷️  Product: ${product.name} (${product.id})`);
      console.log(`   Description: ${product.description || 'No description'}`);
      console.log(`   Created: ${new Date(product.created * 1000).toLocaleDateString()}`);
      
      // Find prices for this product
      const productPrices = prices.data.filter(price => price.product === product.id);
      
      if (productPrices.length > 0) {
        console.log(`   💰 Prices:`);
        for (const price of productPrices) {
          const amount = price.unit_amount ? (price.unit_amount / 100) : 0;
          const currency = price.currency.toUpperCase();
          const interval = price.recurring 
            ? `${price.recurring.interval}${price.recurring.interval_count > 1 ? `/${price.recurring.interval_count}` : ''}`
            : 'one-time';
          
          console.log(`      🆔 ID: ${price.id}`);
          console.log(`         💵 Amount: ${amount} ${currency}`);
          console.log(`         📅 Billing: ${interval}`);
          console.log(`         🔄 Type: ${price.type}`);
          console.log('');
        }
      } else {
        console.log(`   ⚠️  No active prices found for this product`);
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('🔍 CURRENT CONFIGURATION ANALYSIS:');
    console.log('=' .repeat(80));
    
    // Current price IDs from environment
    const currentMonthlyId = 'price_1RotlARph811NFOoNeWYYFKW';
    const currentAnnualId = 'price_1Rotm6Rph811NFOox5WYFCGC';
    
    // Browser log price IDs to check
    const browserLogMonthlyId = 'price_1RouCzFVpXrZdLrXWfpzF0YX';
    const browserLogAnnualId = 'price_1RouAFVpXrZdLrXWAqLhLlL';
    
    console.log(`\n📁 Environment file price IDs:`);
    console.log(`   Monthly: ${currentMonthlyId}`);
    console.log(`   Annual:  ${currentAnnualId}`);
    
    console.log(`\n🌐 Browser log price IDs (to check):`);
    console.log(`   Monthly: ${browserLogMonthlyId}`);
    console.log(`   Annual:  ${browserLogAnnualId}`);
    
    // Check if these price IDs exist in Stripe
    const monthlyPrice = prices.data.find(p => p.id === currentMonthlyId);
    const annualPrice = prices.data.find(p => p.id === currentAnnualId);
    const browserMonthlyPrice = prices.data.find(p => p.id === browserLogMonthlyId);
    const browserAnnualPrice = prices.data.find(p => p.id === browserLogAnnualId);
    
    console.log(`\n✅ ENVIRONMENT PRICE ID VALIDATION:`);
    if (monthlyPrice) {
      const amount = monthlyPrice.unit_amount ? (monthlyPrice.unit_amount / 100) : 0;
      console.log(`   ✅ Monthly price ID EXISTS: $${amount} ${monthlyPrice.currency.toUpperCase()}/${monthlyPrice.recurring?.interval}`);
    } else {
      console.log(`   ❌ Monthly price ID NOT FOUND in Stripe`);
    }
    
    if (annualPrice) {
      const amount = annualPrice.unit_amount ? (annualPrice.unit_amount / 100) : 0;
      console.log(`   ✅ Annual price ID EXISTS: $${amount} ${annualPrice.currency.toUpperCase()}/${annualPrice.recurring?.interval}`);
    } else {
      console.log(`   ❌ Annual price ID NOT FOUND in Stripe`);
    }

    console.log(`\n🔍 BROWSER LOG PRICE ID VALIDATION:`);
    if (browserMonthlyPrice) {
      const amount = browserMonthlyPrice.unit_amount ? (browserMonthlyPrice.unit_amount / 100) : 0;
      console.log(`   ✅ Browser monthly price ID EXISTS: $${amount} ${browserMonthlyPrice.currency.toUpperCase()}/${browserMonthlyPrice.recurring?.interval}`);
    } else {
      console.log(`   ❌ Browser monthly price ID NOT FOUND in Stripe`);
    }
    
    if (browserAnnualPrice) {
      const amount = browserAnnualPrice.unit_amount ? (browserAnnualPrice.unit_amount / 100) : 0;
      console.log(`   ✅ Browser annual price ID EXISTS: $${amount} ${browserAnnualPrice.currency.toUpperCase()}/${browserAnnualPrice.recurring?.interval}`);
    } else {
      console.log(`   ❌ Browser annual price ID NOT FOUND in Stripe`);
    }

    // Show frontend vs environment comparison
    console.log(`\n🔄 PRICE ID FLOW:`);
    console.log(`   1. Frontend useBilling.ts reads: VITE_STRIPE_PRICE_MONTHLY & VITE_STRIPE_PRICE_ANNUAL`);
    console.log(`   2. Environment file sets: ${currentMonthlyId} & ${currentAnnualId}`);
    console.log(`   3. Edge function expects: price_1RotlARph811NFOoNeWYYFKW & price_1Rotm6Rph811NFOox5WYFCGC`);
    
    const environmentMatch = currentMonthlyId === 'price_1RotlARph811NFOoNeWYYFKW' && 
                            currentAnnualId === 'price_1Rotm6Rph811NFOox5WYFCGC';
    
    if (environmentMatch) {
      console.log(`   ✅ Environment and edge function price IDs MATCH`);
    } else {
      console.log(`   ⚠️  Environment and edge function price IDs may not match`);
    }

  } catch (error) {
    console.error('❌ Error fetching Stripe data:', error);
  }
}

// Run the script
if (import.meta.main) {
  await listStripeProductsAndPrices();
}