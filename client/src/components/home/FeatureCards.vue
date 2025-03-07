<template>
  <div class="w-full relative overflow-hidden">
    <!-- Gradient overlays for edge fade effect -->
    <div class="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-fbBlack to-transparent z-10"></div>
    <div class="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-fbBlack to-transparent z-10"></div>

    <!-- Scrolling container -->
    <div class="cards-scroll-container py-10">
      <div class="cards-scroll-content">
        <div
          v-for="card in featureCards"
          :key="card.id"
          class="card"
          :style="{
            transform: `rotate(${card.rotate}deg) translateY(${card.yOffset}px)`,
          }"
        >
          <div
            class="p-8 rounded-xl bg-fbBlack border border-accent/20 hover:border-accent/30 transition-all relative overflow-hidden w-96"
          >
            <!-- Spotlight effect for card -->
            <div class="absolute -top-10 -right-20 w-40 h-40 bg-accent/40 rounded-full blur-2xl opacity-70"></div>
            <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-6 relative z-10">
              <component
                :is="card.icon"
                class="w-6 h-6 text-accent"
              />
            </div>
            <h3 class="text-xl mb-3 text-white relative z-10 font-medium">{{ card.title }}</h3>
            <p class="text-fbWhite/80 relative z-10">
              {{ card.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { type Component } from 'vue';
  import { ChartBarSquareIcon, GlobeAltIcon, BoltIcon, PresentationChartLineIcon } from '@heroicons/vue/24/outline';
  import { ref } from 'vue';

  // Define the interface for our feature card objects
  interface FeatureCard {
    id: number;
    icon: Component;
    title: string;
    description: string;
    rotate: string;
    yOffset: string;
  }

  // Define feature data
  const featureData = [
    {
      icon: ChartBarSquareIcon,
      title: 'Handles Massive Volume—No Sweat',
      description:
        'Unlimited comparions each week. Thousands of lines? Bring it on. Our platform processes any size—from a handful of codes to 215,000 lines—without breaking a sweat.',
    },
    {
      icon: GlobeAltIcon,
      title: "A-Z or NPANXX? We've Got Your Back",
      description:
        "Whether you're reviewing global A-Z destinations or drilling into US NPANXX codes, instantly see where rates align, where margins grow, and where mismatches are eating your profits.",
    },
    {
      icon: BoltIcon,
      title: 'Easy, Actionable Insights—Fast',
      description:
        'Skip the spreadsheet chaos: upload your decks and get a clear side-by-side comparison in under 120 seconds. Identify hidden cost leaks and lock in your advantage.',
    },
    {
      icon: PresentationChartLineIcon,
      title: 'Multiple Carriers, One View',
      description:
        'No more flipping between half a dozen files. Stack up rates from any carrier or jurisdiction in a single interface—perfect for sorting out code breaks or chasing better deals.',
    },
  ];

  // Generate random values for card transforms
  const generateRandomValues = (): FeatureCard[] => {
    const cards: FeatureCard[] = [];

    // Create two sets of cards to ensure continuous scrolling
    const allFeatures = [...featureData, ...featureData];

    allFeatures.forEach((feature, index) => {
      // Random rotate between -3 and 3 degrees
      const rotate = (Math.random() * 6 - 3).toFixed(1);
      // Random Y offset between -10px and 10px
      const yOffset = (Math.random() * 20 - 10).toFixed(1);

      cards.push({
        ...feature,
        id: index,
        rotate,
        yOffset,
      });
    });

    return cards;
  };

  const featureCards = ref<FeatureCard[]>(generateRandomValues());
</script>

<style scoped>
  /* Infinite scroll animation */
  .cards-scroll-container {
    width: 100%;
    overflow: hidden;
  }

  .cards-scroll-content {
    display: flex;
    gap: 32px;
    padding: 20px 40px;
    animation: scroll 60s linear infinite;
    width: max-content;
  }

  .card {
    flex: 0 0 auto;
    transition: transform 0.3s ease;
  }

  .card:hover {
    transform: translateY(-10px) scale(1.02) !important;
    z-index: 20;
  }

  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(calc(-50% - 16px)); /* Half width plus half of a gap */
    }
  }
</style>
