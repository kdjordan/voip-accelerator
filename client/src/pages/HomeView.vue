<template>
  <div class="min-h-screen bg-fbBlack text-white overflow-x-hidden">
    <!-- Hero Section -->
    <!-- Mobile Nav and Desktop Nav are now both placed inside the section -->
    <!-- Added pt-0 to section as inner components now handle padding -->
    <section
      class="mt-4 rounded-3xl mx-4 pb-32 pt-0 bg-gradient-to-br from-accent/80 via-accent/30 to-fbBlack relative overflow-hidden"
      id="hero"
    >
      <!-- Mobile Navigation (shows on mobile, positioned inside) -->
      <MarketingMobileNav :items="marketingNavigationItems" class="md:hidden" />

      <!-- Desktop Navigation (shows on desktop, positioned inside) -->
      <TopNav class="hidden md:flex" />

      <!-- Content container -->
      <!-- Adjusted padding/margin if needed based on nav component changes -->
      <div class="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div class="space-y-8">
          <!-- Main headline - Large and prominent -->
          <h1
            ref="mainHeadline"
            class="text-4xl md:text-7xl lg:text-7xl font-medium tracking-tighter opacity-0"
          >
            Instant Rate Deck Insights
          </h1>
          <!-- Subheading - Clean and focused -->
          <p ref="subheading" class="text-base md:text-2xl text-fbWhite/80 max-w-2xl opacity-0">
            Compare your rates against theirs, leverage LERG lookups, keep everything safe in your
            browser, and export your reports.
            <span class="text-white block mt-4 font-secondary text-xl">Simplify your data.</span>
            <span class="text-white block font-secondary text-xl">Accelerate your decisions.</span>
          </p>

          <!-- Call to action buttons -->
          <div ref="ctaButtons" class="flex flex-wrap gap-4 pt-4 opacity-0">
            <RouterLink
              to="/dashboard"
              class="bg-accent/20 text-accent font-medium px-8 py-3 rounded-3xl hover:bg-accent/30 transition-colors text-center border border-accent/50"
            >
              Find My Margin
            </RouterLink>

            <a
              href="#pricing"
              @click.prevent="scrollToPricing"
              class="bg-transparent border border-fbWhite/20 text-fbWhite font-medium px-8 py-3 rounded-3xl hover:bg-fbWhite/10 transition-colors text-center"
            >
              See pricing
            </a>
          </div>
        </div>
      </div>
    </section>
    <!--Pain Points Section-->
    <section ref="painPointsSection" class="pt-4 px-4 pb-32 w-full z-10 bg-fbBlack">
      <div class="flex flex-col md:flex-row gap-4">
        <div
          ref="crushBox"
          class="w-full md:w-1/3 bg-accent/70 rounded-3xl p-8 flex items-center justify-center opacity-0 translate-x-[-50px]"
        >
          <div class="text-4xl md:text-5xl lg:text-6xl text-center text-fbBlack leading-none">
            <span
              ref="crushTextLine1"
              class="font-secondary block font-bold opacity-0 translate-y-[20px]"
              >CRUSH</span
            >
            <span
              ref="crushTextLine2"
              class="font-secondary block font-bold opacity-0 translate-y-[20px]"
              >YOUR</span
            >
            <span
              ref="crushTextLine3"
              class="font-secondary block font-bold opacity-0 translate-y-[20px]"
              >BUSINESS</span
            >
            <span
              ref="crushTextLine4"
              class="font-secondary block font-bold opacity-0 translate-y-[20px]"
              >CASES</span
            >
          </div>
        </div>
        <div
          ref="painPointsText"
          class="w-full md:w-2/3 bg-fbWhite rounded-3xl p-8 opacity-0 translate-x-[50px]"
        >
          <p
            ref="painPointsParagraph"
            class="text-4xl max-w-4xl text-center md:text-right mx-auto text-fbBlack leading-normal uppercase opacity-0 translate-y-[30px]"
          >
            No more wasted time staring at Excel only to learn nothing actionable. Upload your
            decks, get pricing and code insights, and find your opportunities - all before your
            coffee cools.
          </p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="pt-8 pb-8 relative z-10 bg-fbBlack">
      <div
        ref="featuresHeading"
        class="container mx-auto mb-2 font-secondary w-full opacity-0 translate-y-[50px]"
      >
        <h2 class="text-3xl md:text-5xl text-center mx-auto mb-4 text-accent uppercase font-">
          Why You'll Love VOIP Accelerator
        </h2>
        <h3 class="text-xl md:text-3xl text-fbWhite max-w-3xl text-center mx-auto mb-2">
          Efficiency. Accuracy. Insight.
        </h3>
        <h3 class="text-xl md:text-3xl mb-12 text-fbWhite max-w-3xl text-center mx-auto">
          All Without Excel...
        </h3>
      </div>

      <FeatureCards />
    </section>

    <!-- Pricing Section 
    <section id="pricing">
      <div ref="pricingSection" class="opacity-0 translate-y-[50px]">
        <PricingSection />
      </div>
    </section>
-->
    <!-- Footer Section -->
    <section class="py-24 bg-fbBlack">
      <div class="container mx-auto px-4">
        <div class="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          <div class="mb-12">
            <p class="text-accent text-sm mx-auto mb-12 tracking-wider font-secondary">
              GET STARTED
            </p>
            <h2 class="text-3xl mb-8 text-gray-300">Ready to optimize your VOIP operations?</h2>
            <p class="text-xl mx-auto w-2/3 font-secondary text-accent">
              Get the cheat code for buying and selling in the VOIP market.
            </p>
          </div>
          <RouterLink
            to="/signup"
            class="bg-accent/20 text-accent border border-accent/50 font-medium px-8 py-3 rounded-3xl hover:bg-accent/30 transition-colors whitespace-nowrap"
          >
            Get Started — It's Free
          </RouterLink>
        </div>
      </div>
      <div class="pt-12">
        <TheFooter />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink, useRouter } from 'vue-router';
  import { onMounted, ref } from 'vue';
  import { useGsap } from '@/composables/useGsap';
  import TopNav from '@/components/shared/TopNav.vue';
  import MarketingMobileNav from '@/components/shared/MarketingMobileNav.vue';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import FeatureCards from '@/components/home/FeatureCards.vue';
  import PricingSection from '@/components/home/PricingSection.vue';
  import { marketingNavigationItems } from '@/constants/navigation';

  // GSAP animations setup
  const { gsap, ScrollTrigger, createAnimation } = useGsap();

  // Get router instance
  const router = useRouter();

  // Function to handle smooth scroll
  function scrollToPricing(event: MouseEvent) {
    // While .prevent should handle this, adding an extra check
    if (event) {
      event.preventDefault();
    }
    router.push({ hash: '#pricing' });
  }

  // Reference elements for animations
  const mainHeadline = ref<HTMLElement | null>(null);
  const subheading = ref<HTMLElement | null>(null);
  const ctaButtons = ref<HTMLElement | null>(null);

  const painPointsSection = ref<HTMLElement | null>(null); // Ref for the parent section
  const crushBox = ref<HTMLElement | null>(null);
  const crushTextLine1 = ref<HTMLElement | null>(null);
  const crushTextLine2 = ref<HTMLElement | null>(null);
  const crushTextLine3 = ref<HTMLElement | null>(null);
  const crushTextLine4 = ref<HTMLElement | null>(null);
  const painPointsText = ref<HTMLElement | null>(null);
  const painPointsParagraph = ref<HTMLElement | null>(null); // Ref for the text paragraph

  const featuresHeading = ref<HTMLElement | null>(null);
  const pricingSection = ref<HTMLElement | null>(null);

  onMounted(() => {
    // Hero section animations - Animate from initial state
    const heroTl = gsap.timeline();
    const headlineText = mainHeadline.value?.textContent || 'Instant Rate Deck Insights'; // Get original text

    heroTl
      .fromTo(
        mainHeadline.value,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        }
      )
      // Add scramble text animation slightly after the fade-in starts
      .to(
        mainHeadline.value,
        {
          duration: 1.2, // Duration of the overall tween
          scrambleText: {
            text: headlineText, // Scramble towards the final text
            chars: 'upperCase', // Characters to use for scrambling
            revealDelay: 0.2, // Delay before characters start revealing
            speed: 0.5, // Speed of scrambling
          },
          ease: 'none', // Apply ease to the overall tween
        },
        '-=0.6'
      ) // Start scramble shortly after the fade/slide begins
      .fromTo(
        subheading.value,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=1.0'
      ) // Adjust timing relative to scramble
      .fromTo(
        ctaButtons.value,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.6'
      ); // Adjust timing relative to scramble

    // --- Pain points section animations ---
    if (painPointsSection.value) {
      const painPointsTl = gsap.timeline({
        scrollTrigger: {
          trigger: painPointsSection.value, // Trigger based on parent section
          start: 'top 70%',
          toggleActions: 'play none none none', // Keep animations played once
        },
      });

      // 1. Animate crushBox container
      painPointsTl.fromTo(
        crushBox.value,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7, // Slightly faster
          ease: 'power2.out',
        },
        0 // Start at the beginning of the timeline
      );

      // 2. Animate crushTextElements slightly after crushBox starts
      const crushTextElements = [
        crushTextLine1.value,
        crushTextLine2.value,
        crushTextLine3.value,
        crushTextLine4.value,
      ].filter((el) => el);
      if (crushTextElements.length > 0) {
        painPointsTl.fromTo(
          crushTextElements,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
          },
          '>-0.4' // Start 0.4s before the previous animation ends
        );
      }

      // 3. Animate painPointsText container (concurrently or slightly after crushBox)
      painPointsTl.fromTo(
        painPointsText.value,
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7, // Slightly faster
          ease: 'power2.out',
        },
        0.1 // Start 0.1s after the timeline begins
      );

      // 4. Animate painPointsParagraph after its container starts
      painPointsTl.fromTo(
        painPointsParagraph.value,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        '>-0.4' // Start 0.4s before the previous animation (painPointsText) ends
      );
    }
    // --- End Pain points section ---

    // --- Features section heading animation ---
    if (featuresHeading.value) {
      gsap.fromTo(
        featuresHeading.value,
        { opacity: 0, y: 50 }, // Initial state handled by CSS, but good to define here too
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: featuresHeading.value,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
    // --- End Features section ---

    // --- Pricing section animation ---
    if (pricingSection.value) {
      gsap.fromTo(
        pricingSection.value,
        { opacity: 0, y: 50 }, // Initial state handled by CSS
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: pricingSection.value, // Trigger based on the wrapper div itself
            start: 'top 85%', // Start when top is 85% down viewport
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
    // --- End Pricing section ---

    // --- Footer Section (currently has CTA content, might need renaming/refactoring later) ---
    // Note: No animation applied to this section currently
  });
</script>
