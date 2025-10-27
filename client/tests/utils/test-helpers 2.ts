import { createClient } from '@supabase/supabase-js'

// Test database utilities - use existing development environment
// Fall back to env vars if import.meta.env is not available in tests
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://test.supabase.co'
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-key'

export const testSupabase = createClient(supabaseUrl, supabaseKey)

// Mock user profiles for testing
export const mockProfiles = {
  trialUser: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'trial@test.com',
    subscription_status: 'trial',
    billing_period: null,
    total_uploads: 50,
    plan_expires_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
  },
  expiredTrialUser: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'expired@test.com',
    subscription_status: 'trial',
    billing_period: null,
    total_uploads: 25,
    plan_expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  monthlyUser: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'monthly@test.com',
    subscription_status: 'active',
    billing_period: 'monthly',
    total_uploads: 200,
    stripe_customer_id: 'cus_test123',
    subscription_id: 'sub_test123',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days
  },
  annualUser: {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'annual@test.com',
    subscription_status: 'active',
    billing_period: 'annual',
    total_uploads: 500,
    stripe_customer_id: 'cus_test456',
    subscription_id: 'sub_test456',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(), // 365 days
  }
}

// Mock Stripe checkout session objects
export const mockStripeSessionObjects = {
  monthlyCheckout: {
    id: 'cs_test_monthly',
    customer: 'cus_test123',
    customer_email: 'test-upgrade@test.com',
    subscription: 'sub_test123',
    amount_total: 9900, // $99.00
    payment_status: 'paid',
    status: 'complete'
  },
  annualCheckout: {
    id: 'cs_test_annual',
    customer: 'cus_test456',
    customer_email: 'test-upgrade@test.com',
    subscription: 'sub_test456',
    amount_total: 99900, // $999.00
    payment_status: 'paid',
    status: 'complete'
  }
}

// Utility to create test users in the database
export async function createTestUser(profile: typeof mockProfiles.trialUser) {
  const { data, error } = await testSupabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Utility to clean up test users
export async function cleanupTestUser(email: string) {
  await testSupabase
    .from('profiles')
    .delete()
    .eq('email', email)
}

// Utility to get user by email
export async function getTestUser(email: string) {
  const { data, error } = await testSupabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) throw error
  return data
}