<template>
  <div
    id="hero"
    class="relative min-h-screen overflow-x-hidden bg-ink text-zinc-300 antialiased selection:bg-emerald-400/30"
  >
    <!-- Ambient emerald glow -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(70%_50%_at_70%_-5%,rgba(16,185,129,0.16),transparent_65%)]"
    ></div>

    <!-- Nav -->
    <header class="relative z-10 mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
      <RouterLink to="/" class="flex items-center gap-2.5">
        <span
          class="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/30"
        >
          <BoltIcon class="h-4 w-4 text-emerald-400" />
        </span>
        <span class="font-semibold leading-none tracking-tight text-white">
          VOIP<span class="block font-secondary text-[9px] tracking-[0.25em] text-zinc-500"
            >ACCELERATOR</span
          >
        </span>
      </RouterLink>
      <nav class="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
        <a href="#features" class="transition-colors hover:text-white">Product</a>
        <a href="#how" class="transition-colors hover:text-white">How it works</a>
        <a href="#why" class="transition-colors hover:text-white">Why it exists</a>
      </nav>
      <div class="flex items-center gap-5 text-sm">
        <RouterLink to="/login" class="text-zinc-300 transition-colors hover:text-white"
          >Sign in</RouterLink
        >
        <RouterLink
          to="/signup"
          class="rounded-full bg-emerald-400 px-4 py-2 font-semibold text-ink transition-colors hover:bg-emerald-300"
        >
          Get started
        </RouterLink>
      </div>
    </header>

    <!-- Split hero -->
    <main
      class="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-2"
    >
      <div class="reveal">
        <div
          class="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-secondary text-xs text-zinc-400"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          US NPANXX rate intelligence · local-first
        </div>
        <h1 class="text-5xl font-bold leading-[1.04] tracking-tighter text-white md:text-6xl">
          See the margin<br />
          hiding in your<br />
          <span class="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"
            >rate decks.</span
          >
        </h1>
        <p class="mt-6 max-w-md text-lg leading-relaxed text-zinc-400">
          VoIP Accelerator turns US NPANXX rate decks into side-by-side insight — compare them,
          reprice them down to the NPA, and export switch-ready sheets. Enriched with LERG, aware of
          every jurisdiction. All in your browser; nothing is ever stored.
        </p>
        <div class="mt-8 flex flex-wrap items-center gap-4">
          <RouterLink
            to="/signup"
            class="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 font-semibold text-ink transition-colors hover:bg-emerald-300"
          >
            Get started — free <ArrowRightIcon class="h-4 w-4" />
          </RouterLink>
          <a
            href="#how"
            class="inline-flex items-center gap-2 font-medium text-zinc-200 transition-colors hover:text-white"
          >
            See how it works <ArrowRightIcon class="h-4 w-4" />
          </a>
        </div>
        <p class="mt-6 text-sm text-zinc-500">
          Load a deck in seconds. A full two-deck analysis in minutes — no formulas, no pivot
          tables.
        </p>
      </div>

      <!-- Product dashboard mock (static, illustrative) -->
      <div class="reveal-delay">
        <div
          class="overflow-hidden rounded-2xl border border-white/10 bg-ink-raised/90 shadow-2xl shadow-emerald-950/40 ring-1 ring-emerald-400/5 backdrop-blur"
        >
          <!-- app top bar -->
          <div class="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div class="flex items-center gap-2 font-secondary text-xs text-zinc-500">
              <BoltIcon class="h-3.5 w-3.5 text-emerald-400" /> Comparison · your deck vs. provider
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded border border-white/10 px-2 py-1 font-secondary text-[10px] text-zinc-500"
                >NPANXX</span
              >
              <span
                class="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-secondary text-[10px] text-emerald-300"
                >Export</span
              >
            </div>
          </div>
          <div class="grid grid-cols-[120px_1fr]">
            <!-- sidebar -->
            <div class="border-r border-white/[0.07] py-3 font-secondary text-[11px]">
              <div
                v-for="(nav, i) in sideNav"
                :key="nav"
                class="flex items-center gap-2 px-3 py-1.5"
                :class="
                  i === 0
                    ? 'border-l-2 border-emerald-400 bg-emerald-400/[0.07] text-emerald-300'
                    : 'border-l-2 border-transparent text-zinc-500'
                "
              >
                <span class="h-1 w-1 rounded-full" :class="i === 0 ? 'bg-emerald-400' : 'bg-zinc-600'"></span
                >{{ nav }}
              </div>
            </div>
            <!-- main -->
            <div class="space-y-3 p-3.5">
              <!-- KPI cards -->
              <div class="grid grid-cols-4 gap-2">
                <div
                  v-for="k in kpis"
                  :key="k.label"
                  class="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5"
                >
                  <div class="text-[9px] uppercase tracking-wider text-zinc-500">{{ k.label }}</div>
                  <div class="mt-1 font-secondary text-sm text-white">{{ k.value }}</div>
                  <div
                    class="font-secondary text-[9px]"
                    :class="k.good ? 'text-emerald-400' : 'text-rose-400'"
                  >
                    {{ k.delta }}
                  </div>
                </div>
              </div>
              <!-- chart -->
              <div class="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                <div class="mb-2 flex items-center justify-between text-[10px] text-zinc-500">
                  <span class="font-medium text-zinc-300">Rate delta by NPA</span>
                  <span class="flex items-center gap-3 font-secondary">
                    <span class="flex items-center gap-1"
                      ><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Provider</span
                    >
                    <span class="flex items-center gap-1"
                      ><span class="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>Yours</span
                    >
                  </span>
                </div>
                <svg viewBox="0 0 400 110" class="h-[110px] w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rateArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="rgba(16,185,129,0.35)" />
                      <stop offset="100%" stop-color="rgba(16,185,129,0)" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points="0,70 57,62 114,75 171,55 228,60 285,42 342,50 400,35"
                    fill="none"
                    stroke="#71717a"
                    stroke-width="2"
                  />
                  <path
                    d="M0,88 57,80 114,86 171,68 228,78 285,58 342,66 400,48 L400,110 L0,110 Z"
                    fill="url(#rateArea)"
                  />
                  <polyline
                    points="0,88 57,80 114,86 171,68 228,78 285,58 342,66 400,48"
                    fill="none"
                    stroke="#34d399"
                    stroke-width="2.5"
                  />
                </svg>
              </div>
              <!-- top opportunities -->
              <div class="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                <div class="mb-2 text-[10px] font-medium text-zinc-300">Top buying opportunities</div>
                <div
                  v-for="o in opps"
                  :key="o.dest"
                  class="flex items-center justify-between py-1 font-secondary text-[11px]"
                >
                  <span class="text-zinc-400">{{ o.dest }}</span>
                  <span :class="o.delta.startsWith('-') ? 'text-emerald-400' : 'text-rose-400'">{{
                    o.delta
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-3 text-center font-secondary text-[11px] text-zinc-600">
          US NPANXX · LERG-enriched · interstate / intrastate / indeterminate
        </p>
      </div>
    </main>

    <!-- Analyze + Adjust: the two halves of NPANXX deck work -->
    <section id="features" class="relative z-10 mx-auto max-w-7xl px-6 py-16">
      <div class="mb-12 text-center">
        <h2 class="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Two sides to every deck.
        </h2>
        <p class="mx-auto mt-3 max-w-xl text-zinc-400">
          Compare a deck against another, or reprice and build one of your own — every NPANXX
          enriched with LERG.
        </p>
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <div
          v-for="panel in panels"
          :key="panel.title"
          class="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-8"
        >
          <div class="mb-1 flex items-center gap-3">
            <span
              class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/30"
            >
              <component :is="panel.icon" class="h-5 w-5 text-emerald-400" />
            </span>
            <h3 class="text-xl font-semibold text-white">{{ panel.title }}</h3>
          </div>
          <p class="mb-6 text-sm text-zinc-500">{{ panel.tagline }}</p>
          <div class="space-y-5">
            <div
              v-for="item in panel.items"
              :key="item.label"
              class="border-l-2 border-emerald-400/30 pl-4"
            >
              <div class="font-secondary text-xs uppercase tracking-wider text-emerald-300/90">
                {{ item.label }}
              </div>
              <p class="mt-1 text-sm leading-relaxed text-zinc-400">{{ item.body }}</p>
            </div>
          </div>
        </div>
      </div>
      <!-- cross-cutting trust badges -->
      <div
        class="mt-6 flex flex-wrap items-center justify-center gap-3 font-secondary text-xs text-zinc-400"
      >
        <span
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5"
        >
          <LockClosedIcon class="h-3.5 w-3.5 text-emerald-400" /> Local-first &amp; ephemeral
        </span>
        <span
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5"
        >
          <MapPinIcon class="h-3.5 w-3.5 text-emerald-400" /> LERG-enriched &amp; jurisdiction-aware
        </span>
        <span
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5"
        >
          <BoltIcon class="h-3.5 w-3.5 text-emerald-400" /> Built for full-size decks
        </span>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="relative z-10 mx-auto max-w-6xl px-6 py-16">
      <h2 class="text-center text-3xl font-bold tracking-tight text-white">
        Three steps. No spreadsheet.
      </h2>
      <div class="mt-10 grid gap-5 md:grid-cols-3">
        <div
          v-for="(step, i) in steps"
          :key="step.title"
          class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
        >
          <div class="flex items-center gap-3">
            <span
              class="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/10 font-secondary text-sm text-emerald-300 ring-1 ring-emerald-400/30"
              >{{ i + 1 }}</span
            >
            <component :is="step.icon" class="h-5 w-5 text-emerald-300" />
          </div>
          <h3 class="mt-4 font-semibold text-white">{{ step.title }}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-zinc-500">{{ step.body }}</p>
        </div>
      </div>
    </section>

    <!-- Why it exists — honest, no fabricated proof -->
    <section id="why" class="relative z-10 mx-auto max-w-4xl px-6 py-16">
      <div class="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-8 md:p-10">
        <p class="mb-4 font-secondary text-xs tracking-[0.2em] text-emerald-400/80">
          BUILT BY AN OPERATOR
        </p>
        <p class="text-xl leading-relaxed text-zinc-200 md:text-2xl">
          A partner sends a new rate deck — or quietly cherry-picks the traffic to where your margin
          is thinnest. The answer is buried in 200,000 rows. VoIP Accelerator surfaces it in
          minutes, down to the NPA, so you can respond surgically instead of rebuilding a deck.
        </p>
        <p class="mt-5 text-sm text-zinc-500">
          It started as a tool one operator built to answer that exact question. There wasn't
          anything else that did it — so now it's yours too, free.
        </p>
      </div>
    </section>

    <!-- Closing CTA — cheat-code accent -->
    <section class="relative z-10 mx-auto max-w-4xl px-6 py-20 text-center">
      <p class="mb-4 font-secondary text-xs tracking-[0.2em] text-emerald-400/80">YOUR CHEAT CODE</p>
      <h2 class="text-3xl font-bold tracking-tight text-white md:text-4xl">
        The cheat code for buying and selling smarter.
      </h2>
      <p class="mt-4 text-zinc-400">
        Free forever. Local-first. Your rates never leave your browser.
      </p>
      <RouterLink
        to="/signup"
        class="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-7 py-3.5 font-semibold text-ink transition-colors hover:bg-emerald-300"
      >
        Get started — free <ArrowRightIcon class="h-4 w-4" />
      </RouterLink>
    </section>

    <!-- Footer (shared component) -->
    <div class="relative z-10 border-t border-white/[0.06]">
      <TheFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Component } from 'vue';
  import { RouterLink } from 'vue-router';
  import {
    BoltIcon,
    ArrowRightIcon,
    ArrowsRightLeftIcon,
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    LockClosedIcon,
    MapPinIcon,
    DocumentArrowUpIcon,
    TableCellsIcon,
  } from '@heroicons/vue/24/outline';
  import TheFooter from '@/components/shared/TheFooter.vue';

  interface Kpi {
    label: string;
    value: string;
    delta: string;
    good: boolean;
  }

  interface Opportunity {
    dest: string;
    delta: string;
  }

  interface PanelItem {
    label: string;
    body: string;
  }

  interface Panel {
    icon: Component;
    title: string;
    tagline: string;
    items: PanelItem[];
  }

  interface Step {
    icon: Component;
    title: string;
    body: string;
  }

  // --- Static, illustrative content for the dashboard mock ---
  const sideNav = ['Compare', 'NPANXX', 'Jurisdiction', 'Adjust', 'LERG', 'Export'];

  const kpis: Kpi[] = [
    { label: 'Matched', value: '1,204', delta: 'codes', good: true },
    { label: 'Buying ops', value: '12', delta: '↑ >10%', good: true },
    { label: 'Gaps', value: '47', delta: 'your deck', good: false },
    { label: 'Avg Δ', value: '-9.4%', delta: '↓ cheaper', good: true },
  ];

  // US NPANXX opportunities are by metro / NPA, not country.
  const opps: Opportunity[] = [
    { dest: 'Los Angeles · 213', delta: '-16.9%' },
    { dest: 'Dallas · 469', delta: '-11.5%' },
    { dest: 'Miami · 305', delta: '-7.6%' },
    { dest: 'New York · 917', delta: '+21.4%' },
  ];

  // --- Page content ---
  const panels: Panel[] = [
    {
      icon: ArrowsRightLeftIcon,
      title: 'Analyze',
      tagline: 'Compare two NPANXX decks side-by-side and see what is hiding between them.',
      items: [
        {
          label: 'Code Reports',
          body: 'Coverage gaps and LERG coverage — see exactly which NPANXX a deck is missing, and where the other one has you covered.',
        },
        {
          label: 'Pricing Reports',
          body: 'Rate differences by state, NPA, or individual NPANXX — split by interstate, intrastate, and indeterminate jurisdiction.',
        },
      ],
    },
    {
      icon: AdjustmentsHorizontalIcon,
      title: 'Adjust',
      tagline: 'Reprice or build a deck, down to the code — without the spreadsheet gymnastics.',
      items: [
        {
          label: 'Granular reprice',
          body: 'Adjust by %, fixed amount, a single NPANXX, every NPA in a state, or a metro area by population.',
        },
        {
          label: 'Effective dates & export',
          body: 'Build a new deck, set effective dates, and export switch-ready — plus downloadable comparison reports.',
        },
      ],
    },
  ];

  const steps: Step[] = [
    {
      icon: DocumentArrowUpIcon,
      title: 'Drop in your decks',
      body: 'CSV or Excel NPANXX decks. Parsing runs in your browser — no server, no upload.',
    },
    {
      icon: TableCellsIcon,
      title: 'See what is hidden',
      body: 'Every NPANXX is enriched with LERG and split by jurisdiction — interstate, intrastate, and indeterminate.',
    },
    {
      icon: ArrowDownTrayIcon,
      title: 'Adjust & export',
      body: 'Reprice by NPA, state, metro, or NXX, set an effective date, and export a switch-ready sheet plus a report.',
    },
  ];
</script>

<style scoped>
  /* Subtle entrance fade — disabled for reduced-motion users. */
  .reveal {
    animation: hv-fade 0.7s ease-out both;
  }
  .reveal-delay {
    animation: hv-fade 0.7s ease-out 0.15s both;
  }
  @keyframes hv-fade {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal,
    .reveal-delay {
      animation: none;
    }
  }
</style>
