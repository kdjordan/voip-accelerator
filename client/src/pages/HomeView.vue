<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const heroSection = ref<HTMLElement | null>(null)
const isHeroVisible = ref(false)

useIntersectionObserver(
  heroSection,
  ([{ isIntersecting }]) => {
    isHeroVisible.value = isIntersecting
  },
  { threshold: 0.5 }
)

const features = [
  { title: 'Dynamic Pricing', description: 'Automatically adjust prices based on market demand and competition' },
  { title: 'Data-Driven Insights', description: 'Make informed decisions with real-time analytics and reporting' },
  { title: 'Customizable Strategies', description: 'Tailor pricing rules to fit your unique business needs' },
]
</script>

<template>
  <main class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
    <!-- Hero Section -->
    <section 
      ref="heroSection"
      class="relative min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden"
    >
      <div class="absolute inset-0 bg-[url('/path-to-pattern.svg')] opacity-10"></div>
      <div class="container mx-auto px-4 text-center relative z-10">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Optimize Your Pricing<br>Maximize Your Profits
        </h1>
        <p class="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Our intelligent pricing tool helps you stay competitive and boost revenue with data-driven pricing strategies.
        </p>
        <button class="bg-white text-blue-600 font-semibold py-3 px-8 rounded-full hover:bg-blue-50 transition duration-300 shadow-lg">
          Start Free Trial
        </button>
      </div>
      <div 
        class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent"
        :class="{ 'opacity-100': isHeroVisible, 'opacity-0': !isHeroVisible }"
        style="transition: opacity 0.5s ease-in-out;"
      ></div>
    </section>

    <!-- Features Section -->
    <section class="py-20">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose Our Pricing Tool?</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div 
            v-for="feature in features" 
            :key="feature.title"
            class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300"
          >
            <h3 class="text-xl font-semibold mb-4 text-blue-600">{{ feature.title }}</h3>
            <p class="text-gray-600">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gradient-to-r from-indigo-600 to-blue-600 py-20 text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">Ready to optimize your pricing?</h2>
        <p class="text-xl mb-8 max-w-2xl mx-auto">Join thousands of businesses that are increasing their revenue with our intelligent pricing tool.</p>
        <button class="bg-white text-blue-600 font-semibold py-3 px-8 rounded-full hover:bg-blue-50 transition duration-300 shadow-lg">
          Get started now
        </button>
      </div>
    </section>

    <!-- Testimonial Section -->
    <section class="py-20 bg-gray-50">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-12 text-gray-800">What Our Customers Say</h2>
        <blockquote class="text-xl italic text-gray-600 max-w-3xl mx-auto">
          "This pricing tool has revolutionized our business. We've seen a 30% increase in revenue since implementing it. The insights and automation are game-changers!"
        </blockquote>
        <p class="mt-4 font-semibold text-blue-600">Jane Doe, CEO of TechCorp</p>
      </div>
    </section>
  </main>
</template>
