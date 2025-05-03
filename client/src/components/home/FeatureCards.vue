<template>
  <div class="w-full relative overflow-hidden py-10 px-4 md:px-8">
    <!-- Responsive Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
      <div v-for="card in featureCards" :key="card.id" class="card">
        <div
          class="p-5 md:p-8 rounded-xl bg-fbBlack border border-accent/20 hover:border-accent/30 transition-all relative overflow-hidden h-full group hover:scale-[1.02] hover:z-10"
        >
          <!-- Spotlight effect for card -->
          <div
            class="absolute -top-10 -right-20 w-40 h-40 bg-accent/40 rounded-full blur-2xl opacity-70 group-hover:opacity-90 transition-opacity duration-300"
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
    priority: number;
  }

  // Define feature data with priorities
  const featureData = [
    {
      priority: 8,
      icon: BoltIcon,
      title: 'Easy, Actionable Insights—Fast',
      description:
        'Skip the spreadsheet chaos: upload your decks and get a clear side-by-side comparison in under 120 seconds. Identify hidden changes in rates and lock in your margins.',
    },
    {
      priority: 9,
      icon: PresentationChartLineIcon,
      title: 'Two Decks, One View',
      description:
        'No more flipping sheets in Excel. Stack up codes and rates from carriers in a single interface—perfect for sorting out codes and chasing better deals.',
    },
    {
      priority: 3,
      icon: LifebuoyIcon,
      title: "A-Z or NPANXX? We've Got Your Back",
      description:
        "Whether you're reviewing global A-Z destinations or drilling into US NPANXX codes, we got you covered.",
    },
    {
      priority: 4,
      icon: SparklesIcon,
      title: 'US Rate Sheet Wizard',
      description:
        'Adjust rates precisely by %, fixed amount, individual NPANXX, or all NPAs for a state. Set an effective date, and export your updated rate sheet for use in any switch',
    },
    {
      priority: 5,
      icon: GlobeAltIcon,
      title: 'A-Z Rate Sheet Wizard',
      description:
        'Quickly identify any rate mismatches within a Destination Breakout, and correct them in seconds. Adjust rates precisely by %, fixed amount, individual Dial Code, or all Codes for a Breakout. Easily configure your effective dates and change codes, we do the rest. Export your updated rate sheet for use in any switch.',
    },
    {
      priority: 6,
      icon: BoltIcon,
      title: 'US Rate Deck Analyzer',
      description:
        'Compare two US NPANXX decks side by side. View Code Reports showing coverage gaps and LERG Converage. Drill into Pricing Reports to see rate differences by state, NPA, or individual NPANXXs.',
    },
    {
      priority: 7,
      icon: PresentationChartLineIcon,
      title: 'A-Z Rate Deck Analyzer',
      description:
        'Compare two A-Z decks side by side. Analyze Code Reports showing dial code/destination differences. Also drill into Pricing Reports to see buying and selling opportunities by margin advantage',
    },
    {
      priority: 2,
      icon: PaperAirplaneIcon,
      title: 'Handles Massive Volume—No Sweat',
      description:
        'Unlimited comparions each week. Thousands of lines? Bring it on. Our platform processes any size—from a handful of codes to 250,000 lines—without breaking a sweat.',
    },
    {
      priority: 1,
      icon: LockClosedIcon,
      title: 'Local Data Only',
      description:
        'We store your data locally in your browser. No need to worry about your data being shared with anyone else. When you leave, your pricing data is gone.',
    },
  ];

  // Generate sorted cards based on priority
  const generateSortedCards = (): FeatureCard[] => {
    // Sort features by priority
    const sortedFeatures = [...featureData].sort((a, b) => a.priority - b.priority);

    // Map to the FeatureCard interface
    return sortedFeatures.map((feature, index) => ({
      ...feature,
      id: index,
    }));
  };

  const featureCards = ref<FeatureCard[]>(generateSortedCards());
</script>
