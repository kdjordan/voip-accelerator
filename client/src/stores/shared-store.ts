import { defineStore } from 'pinia';
import type { UserInfo, PlanFeatures, PlanTierType } from '../types/user-types';
import { PlanTier } from '../types/user-types';

export const useSharedStore = defineStore('shared', {
  state: () => ({
    ui: {
      isSideNavOpen: false,
      isGlobalLoading: false,
    },
    user: {
      info: {
        id: 'usr_12345',
        username: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        planTier: PlanTier.PRO,
        lastLoggedIn: new Date('2023-11-12T14:30:00'),
        createdAt: new Date('2022-06-15T09:00:00')
      } as UserInfo,
      currentPlan: PlanTier.PRO as PlanTierType,
      features: {
        unlimitedUploads: false,
        advancedAnalytics: false,
        prioritySupport: false,
        cdrProcessing: false,
        rateDeckBuilder: false,
        batchProcessing: false,
        exportFormats: ['csv'],
      } as PlanFeatures,
      usage: {
        uploadsToday: 3,
        storageUsed: 12.5,
        comparisonsToday: 7,
      },
    },
  }),

  getters: {
    getSideNavOpen: state => state.ui.isSideNavOpen,
    isLoggedIn: state => state.user.info !== null,
    isPro: state => state.user.currentPlan === PlanTier.PRO,
    userEmail: state => state.user.info?.email ?? '',
    username: state => state.user.info?.username ?? '',
    currentPlan: state => state.user.currentPlan,
  },

  actions: {
    setSideNavOpen(isOpen: boolean) {
      this.ui.isSideNavOpen = isOpen;
    },

    toggleSideNav() {
      this.ui.isSideNavOpen = !this.ui.isSideNavOpen;
    },

    setUser(userInfo: Omit<UserInfo, 'lastLoggedIn'>) {
      this.user.info = {
        ...userInfo,
        lastLoggedIn: new Date(),
      };
      this.updatePlanAndFeatures(userInfo.planTier);
    },

    updatePlanAndFeatures(planTier: PlanTierType) {
      this.user.currentPlan = planTier;
      this.updateFeatures();
    },

    updateFeatures() {
      if (this.user.currentPlan === PlanTier.PRO) {
        this.user.features = {
          unlimitedUploads: true,
          advancedAnalytics: true,
          prioritySupport: true,
          cdrProcessing: true,
          rateDeckBuilder: true,
          batchProcessing: true,
          exportFormats: ['csv', 'xlsx', 'json'],
        };
      } else {
        this.user.features = {
          unlimitedUploads: false,
          advancedAnalytics: false,
          prioritySupport: false,
          cdrProcessing: false,
          rateDeckBuilder: false,
          batchProcessing: false,
          exportFormats: ['csv'],
        };
      }
    },

    clearUser() {
      this.user.info = null as unknown as UserInfo;
      this.user.currentPlan = PlanTier.FREE;
      this.updateFeatures();
      this.ui.isSideNavOpen = false;
      this.user.usage = {
        uploadsToday: 0,
        storageUsed: 0,
        comparisonsToday: 0,
      };
    },
  },
});
