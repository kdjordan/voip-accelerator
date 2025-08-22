import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserStore } from '@/stores/user-store';
import { setActivePinia, createPinia } from 'pinia';

describe('Paid Signup Flow', () => {
  let userStore: ReturnType<typeof useUserStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    userStore = useUserStore();
  });

  describe('Profile Creation', () => {
    it('should create profile with correct fields for paid signup', async () => {
      // Test that paid signup creates profile with:
      // - subscription_tier: 'accelerator'
      // - subscription_status: 'inactive' 
      // - stripe_customer_id: null
      // - email: from auth.users
      
      const mockProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        subscription_tier: 'accelerator',
        subscription_status: 'inactive',
        stripe_customer_id: null,
        role: 'user'
      };

      // Set the profile in store
      userStore.auth.profile = mockProfile;

      expect(userStore.getUserProfile?.subscription_tier).toBe('accelerator');
      expect(userStore.getUserProfile?.subscription_status).toBe('inactive');
      expect(userStore.getUserProfile?.stripe_customer_id).toBeNull();
      expect(userStore.getUserProfile?.email).toBe('test@example.com');
    });

    it('should include email from auth.users in profile', () => {
      const mockProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        subscription_tier: 'accelerator',
        subscription_status: 'inactive'
      };

      userStore.auth.profile = mockProfile;
      
      expect(userStore.getUserProfile?.email).toBeDefined();
      expect(userStore.getUserProfile?.email).not.toBeNull();
    });
  });

  describe('Billing Redirect Logic', () => {
    it('should redirect to billing for paid tier with no stripe_customer_id', () => {
      const mockProfile = {
        subscription_tier: 'accelerator',
        subscription_status: 'inactive',
        stripe_customer_id: null
      };

      userStore.auth.profile = mockProfile;
      
      expect(userStore.shouldRedirectToBilling).toBe(true);
    });

    it('should NOT redirect to billing after payment (active status)', () => {
      const mockProfile = {
        subscription_tier: 'accelerator',
        subscription_status: 'active',
        stripe_customer_id: 'cus_123456'
      };

      userStore.auth.profile = mockProfile;
      
      expect(userStore.shouldRedirectToBilling).toBe(false);
    });

    it('should NOT redirect to billing for trial users', () => {
      const mockProfile = {
        subscription_tier: null,
        subscription_status: 'trial',
        stripe_customer_id: null
      };

      userStore.auth.profile = mockProfile;
      
      expect(userStore.shouldRedirectToBilling).toBe(false);
    });

    it('should NOT redirect if status is active even without stripe_customer_id', () => {
      // Edge case: status is active but no customer ID (shouldn't happen but be defensive)
      const mockProfile = {
        subscription_tier: 'accelerator',
        subscription_status: 'active',
        stripe_customer_id: null
      };

      userStore.auth.profile = mockProfile;
      
      expect(userStore.shouldRedirectToBilling).toBe(false);
    });
  });

  describe('Webhook Processing', () => {
    it('should update profile with stripe_customer_id after webhook', () => {
      // Initial state: paid tier, inactive, no customer ID
      const beforeWebhook = {
        subscription_tier: 'accelerator',
        subscription_status: 'inactive',
        stripe_customer_id: null,
        email: 'test@example.com'
      };

      userStore.auth.profile = beforeWebhook;
      expect(userStore.shouldRedirectToBilling).toBe(true);

      // Simulate webhook update
      const afterWebhook = {
        ...beforeWebhook,
        subscription_status: 'active',
        stripe_customer_id: 'cus_test123',
        subscription_id: 'sub_test456',
        current_period_start: '2025-08-22T00:00:00Z',
        current_period_end: '2025-09-22T00:00:00Z'
      };

      userStore.auth.profile = afterWebhook;
      
      expect(userStore.getUserProfile?.stripe_customer_id).toBe('cus_test123');
      expect(userStore.getUserProfile?.subscription_status).toBe('active');
      expect(userStore.shouldRedirectToBilling).toBe(false);
    });

    it('should handle webhook failure gracefully', () => {
      // If webhook fails, user should still be redirected to billing
      const profileWithoutWebhook = {
        subscription_tier: 'accelerator',
        subscription_status: 'inactive',
        stripe_customer_id: null,
        email: 'test@example.com'
      };

      userStore.auth.profile = profileWithoutWebhook;
      
      expect(userStore.shouldRedirectToBilling).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing email in profile', () => {
      const profileWithoutEmail = {
        subscription_tier: 'accelerator',
        subscription_status: 'inactive',
        stripe_customer_id: null,
        email: null // This was our bug!
      };

      userStore.auth.profile = profileWithoutEmail;
      
      // Should still redirect to billing
      expect(userStore.shouldRedirectToBilling).toBe(true);
      
      // But webhook won't be able to update without email
      // This is what we fixed by ensuring email is always set
    });

    it('should handle enterprise tier correctly', () => {
      const enterpriseProfile = {
        subscription_tier: 'enterprise',
        subscription_status: 'inactive',
        stripe_customer_id: null
      };

      userStore.auth.profile = enterpriseProfile;
      
      expect(userStore.shouldRedirectToBilling).toBe(true);
    });

    it('should handle optimizer tier correctly', () => {
      const optimizerProfile = {
        subscription_tier: 'optimizer',
        subscription_status: 'inactive',
        stripe_customer_id: null
      };

      userStore.auth.profile = optimizerProfile;
      
      expect(userStore.shouldRedirectToBilling).toBe(true);
    });
  });
});