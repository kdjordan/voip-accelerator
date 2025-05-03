<template>
  <div class="w-full relative overflow-hidden">
    <!-- Gradient overlays for edge fade effect -->
    <div
      class="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-fbBlack to-transparent z-10"
    ></div>
    <div
      class="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-fbBlack to-transparent z-10"
    ></div>

    <!-- Scrolling container -->
    <div class="cards-scroll-container py-10">
      <div class="cards-scroll-content">
        <div
          v-for="card in featureCards"
          :key="card.id"
          class="card w-[calc(100vw-40px-16px)] sm:w-5/6 md:w-96"
          :style="{
            transform: `rotate(${card.rotate}deg) translateY(${card.yOffset}px)`,
          }"
        >
          <div
            class="p-5 md:p-8 rounded-xl bg-fbBlack border border-accent/20 hover:border-accent/30 transition-all relative overflow-hidden h-full"
          >
            <!-- Spotlight effect for card -->
            <div
              class="absolute -top-10 -right-20 w-40 h-40 bg-accent/40 rounded-full blur-2xl opacity-70"
            ></div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4 md:mb-6 relative z-10"
            >
              <component :is="card.icon" class="w-5 h-5 md:w-6 md:h-6 text-accent" />
            </div>
            <h3 class="text-lg md:text-xl mb-2 md:mb-3 text-white relative z-10 font-medium">
              {{ card.title }}
            </h3>
            <p class="text-sm md:text-base text-fbWhite/80 relative z-10">
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
  import {
    ChartBarSquareIcon,
    GlobeAltIcon,
    BoltIcon,
    PresentationChartLineIcon,
    SparklesIcon,
    LifebuoyIcon,
    PaperAirplaneIcon,
    LockClosedIcon,
  } from '@heroicons/vue/24/outline';
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
      icon: PaperAirplaneIcon,
      title: 'Handles Massive Volume—No Sweat',
      description:
        'Unlimited comparions each week. Thousands of lines? Bring it on. Our platform processes any size—from a handful of codes to 250,000 lines—without breaking a sweat.',
    },
    {
      icon: LockClosedIcon,
      title: 'Local Data Only',
      description:
        'We store your data locally in your browser. No need to worry about your data being shared with anyone else. When you leave, your pricing data is gone.',
    },
    {
      icon: LifebuoyIcon,
      title: "A-Z or NPANXX? We've Got Your Back",
      description:
        "Whether you're reviewing global A-Z destinations or drilling into US NPANXX codes, we got you covered.",
    },
    {
      icon: BoltIcon,
      title: 'Easy, Actionable Insights—Fast',
      description:
        'Skip the spreadsheet chaos: upload your decks and get a clear side-by-side comparison in under 120 seconds. Identify hidden changes in rates and lock in your margins.',
    },
    {
      icon: PresentationChartLineIcon,
      title: 'Two Decks, One View',
      description:
        'No more flipping sheets in Excel. Stack up codes and rates from carriers in a single interface—perfect for sorting out codes and chasing better deals.',
    },
    // --- New Features from InfoModal --- //
    {
      icon: SparklesIcon, // Reused icon
      title: 'US Rate Sheet Wizard',
      description:
        'Adjust rates precisely by %, fixed amount, individual NPANXX, or all NPAs for a state. Set an effective date, and export your updated rate sheet for use in any switch',
    },
    {
      icon: GlobeAltIcon, // Reused icon
      title: 'A-Z Rate Sheet Wizard',
      description:
        'Quickly identify any rate mismatches within a Destination Breakout, and correct them in seconds. Adjust rates precisely by %, fixed amount, individual Dial Code, or all Codes for a Breakout. Easily configure your effective dates and change codes, we do the rest. Export your updated rate sheet for use in any switch.',
    },
    {
      icon: BoltIcon, // Reused icon
      title: 'US Rate Deck Analyzer',
      description:
        'Compare two US NPANXX decks side by side. View Code Reports showing coverage gaps and LERG Converage. Drill into Pricing Reports to see rate differences by state, NPA, or individual NPANXXs.',
    },
    {
      icon: PresentationChartLineIcon, // Reused icon
      title: 'A-Z Rate Deck Analyzer',
      description:
        'Compare two A-Z decks side by side. Analyze Code Reports showing dial code/destination differences. Also drill into Pricing Reports to see buying and selling opportunities by margin advantage',
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
    /* Adjust gap for mobile vs desktop */
    gap: 16px; /* Corresponds to gap-4 */
    padding: 20px;
    /* Slower animation by default (mobile) */
    animation: scroll 120s linear infinite;
    width: max-content;
  }

  /* Apply larger gap and faster animation on medium screens and up */
  @media (min-width: 768px) {
    .cards-scroll-content {
      gap: 32px; /* Corresponds to gap-8 */
      padding: 20px 40px;
      /* Faster animation for desktop */
      animation-duration: 90s;
    }
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
