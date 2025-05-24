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

    <!-- Add Forgot Password Link Later -->
    <!-- <div class="flex items-center justify-between">
      <div class="text-sm leading-6">
        <a href="#" class="font-semibold text-accent hover:text-accent-hover">Forgot password?</a>
      </div>
    </div> -->

    <div v-if="errorMessage" class="mt-4 text-center text-sm text-red-400">
      {{ errorMessage }}
    </div>

    <div>
      <BaseButton type="submit" :is-loading="isLoading" variant="primary" class="w-full">
        {{ isLoading ? 'Signing in...' : 'Sign in' }}
      </BaseButton>
    </div>

    <!-- Optional: Add Divider -->
    <div class="relative mt-10">
      <div class="absolute inset-0 flex items-center" aria-hidden="true">
        <div class="w-full border-t border-white/10" />
      </div>
      <div class="relative flex justify-center text-sm font-medium leading-6">
        <span class="bg-gray-800 px-6 text-gray-400">Or continue with</span>
      </div>
    </div> 

    
     <div class="mt-6">
      <BaseButton
        @click="handleGoogleSignIn"
        :is-loading="isLoadingGoogle"
        variant="secondary"
        class="w-full"
      >
        <span class="sr-only">Sign in with Google</span>
        
        Sign in with Google
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
  const isLoadingGoogle = ref(false);
  const errorMessage = ref<string | null>(null);

  const userStore = useUserStore();
  const router = useRouter();

  async function handleSignIn() {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const { error } = await userStore.signInWithPassword(email.value, password.value);
      if (error) throw error;
      // Login successful, onAuthStateChange in store should handle profile loading
      // Redirect logic is handled by the router guard
      router.push((router.currentRoute.value.query.redirect as string) || '/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      errorMessage.value = error.message || 'Invalid email or password.';
    } finally {
      isLoading.value = false;
    }
  }

  async function handleGoogleSignIn() {
    try {
      isLoadingGoogle.value = true;
      // Ensure the result is handled, even if the function doesn't return anything on success
      const result = await userStore.signInWithGoogle();
      // Check specifically for an error property if the result is an object
      if (result && result.error) {
        throw result.error; // Throw if the store method returned an error object
      }
      // Success: Redirect or update UI
      const redirectPath = router.currentRoute.value.query.redirect || '/dashboard';
      router.push(redirectPath as string);
    } catch (err: any) {
      errorMessage.value = err.message || 'Google Sign-In failed. Please try again.';
      console.error('Google Sign-In Error:', err);
    } finally {
      isLoadingGoogle.value = false;
    }
  }
</script>
