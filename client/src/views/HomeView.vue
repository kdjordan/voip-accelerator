<script setup lang="ts">
  import HeroSection from '@/components/home/HeroSection.vue';
  import PainPoints from '@/components/home/PainPoints.vue';
  import FeatureCards from '@/components/home/FeatureCards.vue';
  import PricingSection from '@/components/home/PricingSection.vue';
  import CallToAction from '@/components/home/CallToAction.vue';
  import FooterSection from '@/components/layout/FooterSection.vue';
</script>

<template>
  <div class="bg-fbBlack text-fbWhite">
    <HeroSection />
    <PainPoints />
    <FeatureCards />
    <PricingSection />
    <CallToAction />
    <FooterSection />
  </div>
</template>
