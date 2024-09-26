import { defineStore } from 'pinia'
import { UserState, UserInfo, PlanTier, PlanFeatures } from '../../types/app-types'

export const useUserStore = defineStore('userStore', {
  state: (): UserState => ({
    info: null,
    currentPlan: PlanTier.FREE,
    features: {
      unlimitedUploads: false,
      advancedAnalytics: false,
      prioritySupport: false,
      // Add more features as needed
    }
  }),

  getters: {
    isLoggedIn: (state): boolean => state.info !== null,
    userEmail: (state): string | null => state.info?.email ?? null,
    username: (state): string | null => state.info?.username ?? null,
    lastLoggedIn: (state): Date | null => state.info?.lastLoggedIn ?? null,
    isPro: (state): boolean => state.currentPlan === PlanTier.PRO,
    canUseFeature: (state) => (feature: keyof PlanFeatures): boolean => state.features[feature],
  },

  actions: {
    setUser(userInfo: Omit<UserInfo, 'lastLoggedIn'>) {
      this.info = {
        ...userInfo,
        lastLoggedIn: new Date()
      };
      this.updatePlanAndFeatures(userInfo.planTier);
    },
    updateLastLoggedIn() {
      if (this.info) {
        this.info.lastLoggedIn = new Date();
      }
    },
    clearUser() {
      this.info = null;
      this.currentPlan = PlanTier.FREE;
      this.updateFeatures();
    },
    updatePlanAndFeatures(planTier: PlanTier) {
      this.currentPlan = planTier;
      this.updateFeatures();
    },
    updateFeatures() {
      if (this.currentPlan === PlanTier.PRO) {
        this.features = {
          unlimitedUploads: true,
          advancedAnalytics: true,
          prioritySupport: true,
          // Enable all pro features
        };
      } else {
        this.features = {
          unlimitedUploads: false,
          advancedAnalytics: false,
          prioritySupport: false,
          // Disable pro features
        };
      }
    }
  }
})
