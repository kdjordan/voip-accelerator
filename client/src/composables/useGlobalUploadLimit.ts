import { ref, computed } from 'vue';
import { useUploadTracking } from './useUploadTracking';

// Global state for upload limit management
const isUploadLimitReached = ref(false);
const showPlanSelectionModal = ref(false);

export function useGlobalUploadLimit() {
  const uploadTracking = useUploadTracking();

  // Check if uploads are globally blocked
  const isUploadBlocked = computed(() => {
    return isUploadLimitReached.value;
  });

  // Show banner when limit is reached
  const showUploadLimitBanner = computed(() => {
    return isUploadLimitReached.value;
  });

  // Check upload limit and update global state
  async function checkGlobalUploadLimit(): Promise<boolean> {
    try {
      const validation = await uploadTracking.validateBeforeUpload(1);
      
      // Check if it's specifically an upload limit error
      const isLimitError = !validation.canUpload && 
        (validation.message.includes('Monthly upload limit reached') ||
         validation.message.includes('limit reached') ||
         validation.message.includes('100/100'));
      
      isUploadLimitReached.value = isLimitError;
      
      return validation.canUpload;
    } catch (error) {
      console.error('Error checking global upload limit:', error);
      return false;
    }
  }

  // Reset state (called when user upgrades or limit resets)
  function resetUploadLimitState() {
    isUploadLimitReached.value = false;
  }

  // Handle upgrade click - show plan selection modal
  function handleUpgradeClick() {
    showPlanSelectionModal.value = true;
  }

  // Handle plan selection modal
  function closePlanSelectionModal() {
    showPlanSelectionModal.value = false;
  }

  function handlePlanSelection(tier: 'accelerator' | 'enterprise') {
    // Navigate to billing page with selected tier
    console.log(`Plan selected: ${tier}`);
    // TODO: Integrate with your billing/upgrade flow
    // Example: router.push(`/billing?tier=${tier}`) 
    showPlanSelectionModal.value = false;
  }

  return {
    // State
    isUploadBlocked,
    showUploadLimitBanner,
    showPlanSelectionModal: computed(() => showPlanSelectionModal.value),
    isUploadLimitReached: computed(() => isUploadLimitReached.value),
    
    // Methods
    checkGlobalUploadLimit,
    resetUploadLimitState,
    handleUpgradeClick,
    closePlanSelectionModal,
    handlePlanSelection
  };
}