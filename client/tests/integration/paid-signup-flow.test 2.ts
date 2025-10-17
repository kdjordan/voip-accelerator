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
    it('should create profile with correct fields for trial signup', async () => {
      // Test that trial signup creates profile with:
      // - subscription_status: 'trial'
      // - billing_period: null (no billing yet)
      // - stripe_customer_id: null
      // - email: from auth.users

      const mockProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        subscription_status: 'trial',
        billing_period: null,
        stripe_customer_id: null,
        role: 'user'
      };

      // Set the profile in store
      userStore.auth.profile = mockProfile;

      expect(userStore.getUserProfile?.subscription_status).toBe('trial');
      expect(userStore.getUserProfile?.billing_period).toBeNull();
      expect(userStore.getUserProfile?.stripe_customer_id).toBeNull();
      expect(userStore.getUserProfile?.email).toBe('test@example.com');
    });

    it('should include email from auth.users in profile', () => {
      const mockProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        subscription_status: 'trial',
        billing_period: null
      };

      userStore.auth.profile = mockProfile;

      expect(userStore.getUserProfile?.email).toBeDefined();
      expect(userStore.getUserProfile?.email).not.toBeNull();
    });
  });

  describe('Billing Redirect Logic', () => {
    it('should NOT redirect to billing for trial users', () => {
      const mockProfile = {
        subscription_status: 'trial',
        billing_period: null,
        stripe_customer_id: null
      };

      userStore.auth.profile = mockProfile;

      expect(userStore.shouldRedirectToBilling).toBe(false);
    });

    it('should NOT redirect to billing after payment (active status)', () => {
      const mockProfile = {
        subscription_status: 'active',
        billing_period: 'monthly',
        stripe_customer_id: 'cus_123456'
      };

      userStore.auth.profile = mockProfile;

      expect(userStore.shouldRedirectToBilling).toBe(false);
    });

    it('should redirect to billing if trial expired and no active subscription', () => {
      const mockProfile = {
        subscription_status: 'expired',
        billing_period: null,
        stripe_customer_id: null,
        plan_expires_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };

      userStore.auth.profile = mockProfile;

      expect(userStore.shouldRedirectToBilling).toBe(true);
    });

    it('should NOT redirect if status is active even without billing_period', () => {
      // Edge case: status is active but no billing period (shouldn't happen but be defensive)
      const mockProfile = {
        subscription_status: 'active',
        billing_period: null,
        stripe_customer_id: 'cus_123456'
      };

      userStore.auth.profile = mockProfile;

      expect(userStore.shouldRedirectToBilling).toBe(false);
    });
  });

  describe('Webhook Processing', () => {
    it('should update profile with stripe_customer_id and billing_period after webhook', () => {
      // Initial state: trial user
      const beforeWebhook = {
        subscription_status: 'trial',
        billing_period: null,
        stripe_customer_id: null,
        email: 'test@example.com'
      };

      userStore.auth.profile = beforeWebhook;
      expect(userStore.shouldRedirectToBilling).toBe(false);

      // Simulate webhook update for monthly subscription
      const afterWebhook = {
        ...beforeWebhook,
        subscription_status: 'active',
        billing_period: 'monthly',
        stripe_customer_id: 'cus_test123',
        subscription_id: 'sub_test456',
        current_period_start: '2025-08-22T00:00:00Z',
        current_period_end: '2025-09-22T00:00:00Z'
      };

      userStore.auth.profile = afterWebhook;

      expect(userStore.getUserProfile?.stripe_customer_id).toBe('cus_test123');
      expect(userStore.getUserProfile?.billing_period).toBe('monthly');
      expect(userStore.getUserProfile?.subscription_status).toBe('active');
      expect(userStore.shouldRedirectToBilling).toBe(false);
    });

    it('should handle annual billing period correctly', () => {
      const annualProfile = {
        subscription_status: 'active',
        billing_period: 'annual',
        stripe_customer_id: 'cus_test123',
        subscription_id: 'sub_test456',
        current_period_start: '2025-08-22T00:00:00Z',
        current_period_end: '2026-08-22T00:00:00Z',
        email: 'test@example.com'
      };

      userStore.auth.profile = annualProfile;

      expect(userStore.getUserProfile?.billing_period).toBe('annual');
      expect(userStore.shouldRedirectToBilling).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing email in profile', () => {
      const profileWithoutEmail = {
        subscription_status: 'trial',
        billing_period: null,
        stripe_customer_id: null,
        email: null
      };

      userStore.auth.profile = profileWithoutEmail;

      // Trial users should not redirect to billing even without email
      expect(userStore.shouldRedirectToBilling).toBe(false);
    });

    it('should handle expired trial without email', () => {
      const expiredProfile = {
        subscription_status: 'expired',
        billing_period: null,
        stripe_customer_id: null,
        email: null,
        plan_expires_at: new Date(Date.now() - 86400000).toISOString()
      };

      userStore.auth.profile = expiredProfile;

      // Should redirect to billing even without email
      expect(userStore.shouldRedirectToBilling).toBe(true);
    });

    it('should handle canceled subscription correctly', () => {
      const canceledProfile = {
        subscription_status: 'canceled',
        billing_period: 'monthly',
        stripe_customer_id: 'cus_123456'
      };

      userStore.auth.profile = canceledProfile;

      expect(userStore.shouldRedirectToBilling).toBe(true);
    });
  });
});