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
    subscription_tier: null,
    uploads_this_month: 50,
    total_uploads: 50,
    plan_expires_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
  },
  trialUserAtLimit: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'trial-limit@test.com',
    subscription_status: 'trial',
    subscription_tier: null,
    uploads_this_month: 100,
    total_uploads: 100,
    plan_expires_at: new Date(Date.now() + 86400000).toISOString(),
  },
  expiredTrialUser: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'expired@test.com',
    subscription_status: 'trial',
    subscription_tier: null,
    uploads_this_month: 25,
    total_uploads: 25,
    plan_expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  optimizerUser: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'optimizer@test.com',
    subscription_status: 'active',
    subscription_tier: 'optimizer',
    uploads_this_month: 50,
    total_uploads: 200,
    stripe_customer_id: 'cus_test123',
    subscription_id: 'sub_test123',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days
  },
  acceleratorUser: {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'accelerator@test.com',
    subscription_status: 'active',
    subscription_tier: 'accelerator',
    uploads_this_month: 150,
    total_uploads: 500,
    stripe_customer_id: 'cus_test456',
    subscription_id: 'sub_test456',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  }
}

// Mock Stripe checkout session objects
export const mockStripeSessionObjects = {
  optimizerCheckout: {
    id: 'cs_test_optimizer',
    customer: 'cus_test123',
    customer_email: 'test-upgrade@test.com',
    subscription: 'sub_test123',
    amount_total: 9900, // $99.00
    payment_status: 'paid',
    status: 'complete'
  },
  acceleratorCheckout: {
    id: 'cs_test_accelerator',
    customer: 'cus_test456',
    customer_email: 'test-upgrade@test.com',
    subscription: 'sub_test456',
    amount_total: 24900, // $249.00
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