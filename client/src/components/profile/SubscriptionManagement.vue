<template>
  <div class="bg-fbBlack rounded-xl border border-accent/20 p-6">
    <h3 class="text-xl font-semibold text-fbWhite mb-6">Subscription Management</h3>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>

    <!-- Subscription Info -->
    <div v-else-if="subscription" class="space-y-4">
      <!-- Status -->
      <div class="flex items-center justify-between">
        <span class="text-fbWhite/70">Status</span>
        <span :class="statusClasses">
          {{ formatStatus(subscription.subscription_status) }}
        </span>
      </div>

      <!-- Current Period End -->
      <div v-if="subscription.current_period_end" class="flex items-center justify-between">
        <span class="text-fbWhite/70">
          {{ subscription.cancel_at ? 'Expires' : 'Renews' }}
        </span>
        <span class="text-fbWhite">
          {{ formatDate(subscription.current_period_end) }}
        </span>
      </div>

      <!-- Cancellation Notice -->
      <div v-if="subscription.cancel_at" class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p class="text-yellow-300 text-sm">
          Your subscription will end on {{ formatDate(subscription.cancel_at) }}.
          You'll retain access until then.
        </p>
      </div>

      <!-- Manage Button -->
      <button
        @click="handleManageSubscription"
        :disabled="isProcessingPortal"
        class="w-full mt-6 bg-accent/20 text-accent border border-accent/50 rounded-lg px-4 py-2 font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isProcessingPortal">Opening Portal...</span>
        <span v-else>Manage Subscription</span>
      </button>
    </div>

    <!-- No Subscription -->
    <div v-else class="text-center py-8">
      <p class="text-fbWhite/70 mb-4">You don't have an active subscription.</p>
      <router-link
        to="/pricing"
        class="inline-block bg-accent/20 text-accent border border-accent/50 rounded-lg px-6 py-2 font-semibold hover:bg-accent/30 transition-colors"
      >
        View Plans
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { stripeService } from '@/services/stripe.service';
import { useToast } from '@/composables/useToast';
import { format } from 'date-fns';

interface SubscriptionData {
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
}

const { showError } = useToast();
const isLoading = ref(true);
const isProcessingPortal = ref(false);
const subscription = ref<SubscriptionData | null>(null);

const statusClasses = computed(() => {
  const status = subscription.value?.subscription_status;
  switch (status) {
    case 'active':
      return 'text-green-400 font-semibold';
    case 'past_due':
      return 'text-yellow-400 font-semibold';
    case 'canceled':
    case 'unpaid':
      return 'text-red-400 font-semibold';
    default:
      return 'text-fbWhite/70';
  }
});

onMounted(async () => {
  try {
    subscription.value = await stripeService.getSubscriptionStatus();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    showError('Failed to load subscription information');
  } finally {
    isLoading.value = false;
  }
});

function formatStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return 'Unknown';
  }
}

async function handleManageSubscription() {
  try {
    isProcessingPortal.value = true;
    await stripeService.createPortalSession();
  } catch (error) {
    console.error('Portal error:', error);
    showError(error instanceof Error ? error.message : 'Failed to open customer portal');
  } finally {
    isProcessingPortal.value = false;
  }
}
</script>