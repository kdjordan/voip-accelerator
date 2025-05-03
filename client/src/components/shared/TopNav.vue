<template>
  <header ref="header" class="z-[100] px-16 mx-auto pt-8 pb-12 font-secondary">
    <nav class="flex justify-between items-center w-full">
      <RouterLink to="/home" class="flex items-center text-fbBlack">
        <div class="glitch-container">
          <BoltIcon class="w-8 h-8 glitch-item" />
        </div>
        <div class="glitch-text-container ml-2">
          <span class="text-sizeLg font-bold font-secondary glitch-text">VOIP Accelerator</span>
        </div>
      </RouterLink>

      <div class="flex items-center space-x-8">
        <!-- <RouterLink
          to="/pricing"
          class="text-fbWhite/90 hover:text-fbWhite transition-colors text-sm"
        >
          Pricing
        </RouterLink>
        <RouterLink
          to="/about"
          class="text-fbWhite/90 hover:text-fbWhite transition-colors text-sm"
        >
          About
        </RouterLink> -->
        <RouterLink
          to="/dashboard"
          class="text-fbWhite/90 hover:text-fbWhite transition-colors text-sm"
        >
          Log in
        </RouterLink>
        <RouterLink
          to="/dashboard"
          class="bg-accent/20 text-accent border border-accent/50 text-sm font-medium px-4 py-1.5 rounded-3xl hover:bg-accent/30 transition-colors"
        >
          Sign up
        </RouterLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
  import { BoltIcon } from '@heroicons/vue/24/outline';
  import { RouterLink } from 'vue-router';
  import { ref, onMounted } from 'vue';

  const header = ref<HTMLElement | null>(null);
</script>

<style scoped>
  /* Glitch effect for the bolt icon */
  .glitch-container {
    position: relative;
    display: inline-block;
    color: black;
  }

  .glitch-item {
    position: relative;
    z-index: 1;
    animation: glitch 3s ease-in-out infinite;
  }

  .glitch-text-container {
    position: relative;
    display: inline-block;
    color: black;
  }

  .glitch-text {
    position: relative;
    z-index: 1;
    animation: textGlitch 3s ease-in-out infinite;
  }

  /* Glitch animation for icon */
  @keyframes glitch {
    0%,
    100% {
      transform: translate(0);
    }
    5% {
      transform: translate(-3px, 3px);
    }
    10% {
      transform: translate(-3px, -3px);
    }
    15% {
      transform: translate(3px, 3px);
    }
    20% {
      transform: translate(3px, -3px);
    }
    25% {
      transform: translate(-3px, 3px);
      filter: hue-rotate(90deg) brightness(1.2);
    }
    30% {
      transform: translate(3px, 3px);
    }
    35% {
      transform: translate(3px, -3px);
      filter: hue-rotate(0deg) brightness(1);
    }
    40% {
      transform: translate(-3px, -3px);
    }
    45% {
      transform: translate(-3px, 3px);
    }
    50% {
      transform: translate(0);
    }
    /* Rest period between glitches */
    55%,
    95% {
      transform: translate(0);
    }
  }

  /* Glitch animation for text */
  @keyframes textGlitch {
    0%,
    100% {
      transform: translate(0);
      opacity: 1;
      text-shadow: none;
    }
    5% {
      transform: translate(-2px, 2px);
      opacity: 0.9;
    }
    10% {
      transform: translate(-2px, -2px);
      opacity: 1;
    }
    15% {
      transform: translate(2px, 2px);
      opacity: 0.8;
    }
    20% {
      transform: translate(2px, -2px);
      opacity: 1;
      text-shadow:
        -2px 0 #4b9e85,
        2px 0 #8c0040;
    }
    25% {
      transform: translate(-2px, 2px);
      opacity: 0.9;
    }
    30% {
      transform: translate(2px, 2px);
      opacity: 1;
      text-shadow:
        2px 0 #4b9e85,
        -2px 0 #8c0040;
    }
    35% {
      transform: translate(2px, -2px);
      opacity: 0.9;
    }
    40% {
      transform: translate(-2px, -2px);
      opacity: 1;
      text-shadow: none;
    }
    45% {
      transform: translate(-2px, 2px);
      opacity: 0.9;
    }
    50% {
      transform: translate(0);
      opacity: 1;
    }
    /* Rest period between glitches */
    55%,
    95% {
      transform: translate(0);
      opacity: 1;
      text-shadow: none;
    }
  }
</style>
