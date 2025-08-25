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

    <!-- Optional: Add Divider - Hidden for now -->
    <!-- <div class="relative mt-10">
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
    </div> -->
  </form>

  <!-- Session Conflict Modal -->
  <SessionConflictModal
    :is-open="showSessionConflict"
    :session-info="conflictingSession"
    :is-loading="isResolvingConflict"
    @force-logout="handleForceLogout"
    @cancel="handleCancelLogin"
  />
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user-store';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import SessionConflictModal from '@/components/auth/SessionConflictModal.vue';
  import { useSessionManagement } from '@/composables/useSessionManagement';
import { supabase } from '@/utils/supabase';

  const email = ref('');
  const password = ref('');
  const isLoading = ref(false);
  const isLoadingGoogle = ref(false);
  const errorMessage = ref<string | null>(null);
  const showSessionConflict = ref(false);
  const conflictingSession = ref<any>(null);
  const isResolvingConflict = ref(false);

  const userStore = useUserStore();
  const router = useRouter();
  const { checkSession, forceLogout, sessionConflict } = useSessionManagement();

  async function handleSignIn() {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const { error } = await userStore.signInWithPassword(email.value, password.value);
      if (error) throw error;
      
      // Check for conflicts BEFORE creating any session
      console.log('Checking for existing sessions before login...');
      try {
        const response = await supabase.functions.invoke('pre-login-check', {});
        
        if (response.error) {
          throw response.error;
        }

        const result = response.data;
        
        if (result.hasConflict) {
          // Show conflict modal WITHOUT creating a new session yet
          console.log('🚨 CONFLICT DETECTED! Showing modal for existing session:', result.existingSession);
          conflictingSession.value = result.existingSession;
          showSessionConflict.value = true;
          console.log('🚨 Modal state set - showSessionConflict:', showSessionConflict.value);
          console.log('🚨 conflictingSession value:', conflictingSession.value);
          // Don't redirect or create session - wait for user to resolve conflict
          return;
        }
        
        console.log('No conflicts found, safe to create session');
      } catch (conflictCheckError) {
        console.error('Pre-login conflict check failed:', conflictCheckError);
        // Proceed anyway - better to allow login than block it
      }

      // No conflicts detected, create the session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user after login');
      
      // First ensure the user has a profile (in case it's a new user)
      console.log('Ensuring user profile exists...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error('Profile upsert error:', profileError);
        // Don't fail login if profile can't be created, just log it
      }
      
      // Generate a NEW session ID for each login to avoid duplicates
      const sessionId = Date.now() + '-' + Math.random().toString(36).substring(2);
      sessionStorage.setItem('voip_session_id', sessionId);
      
      // Create the session in database
      console.log('Creating session...');
      const { data, error: createError } = await supabase
        .from('active_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionId,
          user_agent: navigator.userAgent,
          ip_address: null,
          browser_info: {
            browser: 'Chrome',
            os: 'Unknown', 
            device: 'Desktop'
          },
          is_active: true,
          created_at: new Date().toISOString(),
          last_heartbeat: new Date().toISOString()
        });
      
      if (createError) {
        console.error('Session creation error:', createError);
        // Don't fail the login completely if session tracking fails
        console.log('⚠️ Session tracking failed but proceeding with login');
      } else {
        console.log('✅ Session created successfully!');
      }

      // Success - proceed with redirect
      router.push((router.currentRoute.value.query.redirect as string) || '/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      errorMessage.value = error.message || 'Invalid email or password.';
    } finally {
      isLoading.value = false;
    }
  }

  async function handleForceLogout() {
    isResolvingConflict.value = true;
    try {
      await forceLogout();
      showSessionConflict.value = false;
      // Proceed with redirect after forcing logout
      router.push((router.currentRoute.value.query.redirect as string) || '/dashboard');
    } catch (error: any) {
      console.error('Force logout error:', error);
      errorMessage.value = 'Failed to resolve session conflict. Please try again.';
      showSessionConflict.value = false;
    } finally {
      isResolvingConflict.value = false;
    }
  }

  function handleCancelLogin() {
    showSessionConflict.value = false;
    // Sign out the user since they chose not to force logout
    userStore.signOut();
    errorMessage.value = 'Login cancelled. Please resolve the session conflict to continue.';
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
