import { defineStore } from 'pinia';
import { PlanTier } from '../types/user-types';
export const useSharedStore = defineStore('shared', {
    state: () => ({
        ui: {
            isSideNavOpen: false,
            isGlobalLoading: false,
        },
        user: {
            info: null,
            currentPlan: PlanTier.FREE,
            features: {
                unlimitedUploads: false,
                advancedAnalytics: false,
                prioritySupport: false,
                cdrProcessing: false,
                rateDeckBuilder: false,
                batchProcessing: false,
                exportFormats: ['csv'],
            },
            usage: {
                uploadsToday: 0,
                storageUsed: 0,
                comparisonsToday: 0,
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
        setSideNavOpen(isOpen) {
            this.ui.isSideNavOpen = isOpen;
        },
        toggleSideNav() {
            this.ui.isSideNavOpen = !this.ui.isSideNavOpen;
        },
        setUser(userInfo) {
            this.user.info = {
                ...userInfo,
                lastLoggedIn: new Date(),
            };
            this.updatePlanAndFeatures(userInfo.planTier);
        },
        updatePlanAndFeatures(planTier) {
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
            }
            else {
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
            this.user.info = null;
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
