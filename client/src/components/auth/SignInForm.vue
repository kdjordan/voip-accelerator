<template>
  <form class="space-y-6" @submit.prevent="handleSignIn">
    <div>
      <label for="email" class="block text-sm font-medium leading-6 text-gray-300"
        >Email address</label
      >
      <div class="mt-2">
        <input
          v-model="email"
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          required
          class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
        />
      </div>
    </div>

    <div>
      <label for="password" class="block text-sm font-medium leading-6 text-gray-300"
        >Password</label
      >
      <div class="mt-2">
        <input
          v-model="password"
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
        />
      </div>
    </div>

    <div v-if="errorMessage" class="mt-4 text-center text-sm text-red-400">
      {{ errorMessage }}
    </div>

    <div>
      <BaseButton type="submit" :is-loading="isLoading" variant="primary" class="w-full">
        {{ isLoading ? 'Signing in...' : 'Sign in' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user-store';
  import BaseButton from '@/components/shared/BaseButton.vue';

  const email = ref('');
  const password = ref('');
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  const userStore = useUserStore();
  const router = useRouter();

  async function handleSignIn() {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const { error } = await userStore.signInWithPassword(email.value, password.value);
      if (error) throw error;

      router.push((router.currentRoute.value.query.redirect as string) || '/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      errorMessage.value = error.message || 'Invalid email or password.';
    } finally {
      isLoading.value = false;
    }
  }
</script>
