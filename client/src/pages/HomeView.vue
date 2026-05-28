<template>
  <!-- Landing is a forced-light peer theme regardless of the global app theme. -->
  <div
    id="hero"
    data-theme="light"
    class="min-h-screen overflow-x-hidden bg-canvas font-sans text-fg antialiased"
  >
    <!-- Top ticker — landing crawl (green/red trading-screen palette) -->
    <TheTicker :items="tickerItems" variant="landing" />

    <div class="mx-auto max-w-[1180px] px-6 md:px-10">
      <!-- Masthead -->
      <header class="flex items-center justify-between pb-[18px] pt-5">
        <RouterLink to="/" class="inline-flex items-center gap-3 text-fg no-underline">
          <span class="brand-chip"><BoltSolidIcon class="h-4 w-4" /></span>
          <span class="font-display text-sm font-semibold uppercase tracking-[0.04em]">
            VoIP Accelerator
          </span>
        </RouterLink>
        <nav class="hidden items-center gap-8 md:flex">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="font-display text-xs uppercase tracking-[0.04em] text-fg-dim no-underline transition-colors hover:text-fg"
            >{{ link.label }}</a
          >
        </nav>
        <div class="flex items-center gap-4">
          <RouterLink
            to="/login"
            class="font-display text-xs uppercase tracking-[0.04em] text-fg-dim no-underline transition-colors hover:text-fg"
            >Sign in</RouterLink
          >
          <RouterLink
            to="/signup"
            class="inline-flex items-center gap-2 border border-line-strong px-[18px] py-[11px] font-display text-xs font-medium uppercase tracking-[0.06em] text-fg no-underline transition-colors hover:bg-row"
          >
            Get started
          </RouterLink>
        </div>
      </header>

      <SlabRule :size="3" />

      <!-- Hero -->
      <section class="pb-8 pt-[60px]">
        <RunningHead
          left="Vol. I · No. 01"
          right="Issue 2026.05 · US NPANXX rate intelligence · free forever"
        />
        <div class="mt-6 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <div>
            <h1
              class="font-display text-[clamp(48px,8vw,84px)] font-semibold leading-[0.92] tracking-[-0.05em] text-fg"
            >
              Buy and sell <span class="text-accent">US</span><br />minutes
              <span
                style="
                  text-decoration: underline;
                  text-decoration-color: var(--accent);
                  text-underline-offset: 12px;
                  text-decoration-thickness: 6px;
                "
                >smarter</span
              >.
            </h1>
            <div class="mt-7 flex flex-wrap items-center gap-3.5">
              <RouterLink to="/signup" :class="ctaPrimary">
                Sign up — free forever <ArrowRightIcon class="h-3.5 w-3.5" />
              </RouterLink>
              <a href="#how" :class="ctaGhost">How it works</a>
            </div>
          </div>
          <div class="border-l border-line pl-8">
            <div class="mb-3 font-display text-[11px] uppercase tracking-[0.16em] text-accent">
              The lede
            </div>
            <p class="m-0 font-sans text-[17px] leading-[1.55] text-fg-dim">
              Compare NPANXX rate decks, catch the margin a partner is quietly cherry-picking, and
              reprice down to the NPA — in minutes, not a day in Excel. LERG-enriched,
              jurisdiction-aware, and free.
            </p>
            <div
              class="mt-[22px] border-l-[3px] border-accent bg-surface px-[18px] py-3.5 font-display text-[12.5px] leading-[1.55] text-fg"
            >
              "Drop in two decks — see where you win and where they beat you, in seconds."
            </div>
          </div>
        </div>
      </section>

      <!-- Product shot — user-driven tabbed view in an editorial frame -->
      <SlabRule :size="2" />
      <section class="py-[22px]">
        <RunningHead
          :left-accent="false"
          :left="`Fig. 1 — ${heroTabs[activeTab].fig}`"
          :right="heroTabs[activeTab].metric"
        />
        <!-- Tab strip — mono uppercase, accent underline on active (no rounding) -->
        <div
          role="tablist"
          aria-label="Product tour"
          class="flex items-stretch overflow-x-auto border-b border-line-strong"
        >
          <button
            v-for="(tab, i) in heroTabs"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="i === activeTab"
            @click="activeTab = i"
            class="relative -mb-px shrink-0 px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.12em] transition-colors focus:outline-none"
            :class="i === activeTab ? 'text-accent' : 'text-fg-faint hover:text-fg'"
          >
            {{ tab.label }}
            <span
              v-if="i === activeTab"
              class="absolute -bottom-px left-0 right-0 h-0.5 bg-accent"
            />
          </button>
        </div>
        <div class="border-x border-b border-line-strong bg-surface">
          <div class="relative aspect-[7/5] overflow-hidden sm:aspect-[16/11]">
            <img
              v-for="(tab, i) in heroTabs"
              :key="tab.key"
              :src="tab.src"
              :alt="tab.alt"
              class="absolute inset-0 h-full w-full object-contain object-top transition-opacity duration-300 ease-in-out"
              :class="i === activeTab ? 'opacity-100' : 'opacity-0'"
            />
          </div>
        </div>
        <Transition name="caption-fade" mode="out-in">
          <p :key="activeTab" class="mt-3 m-0 font-sans text-[13px] text-fg-faint">
            {{ heroTabs[activeTab].caption }}
          </p>
        </Transition>
      </section>
      <SlabRule :size="2" />

      <!-- Trust strip — newspaper columns -->
      <section class="grid grid-cols-1 py-[26px] sm:grid-cols-3">
        <div
          v-for="(t, i) in trust"
          :key="t.label"
          class="px-7"
          :class="i ? 'border-t border-line pt-6 sm:border-l sm:border-t-0 sm:pt-0' : ''"
        >
          <div class="mb-2.5 font-display text-[10px] uppercase tracking-[0.20em] text-accent">
            {{ t.col }}
          </div>
          <div class="flex items-center gap-3">
            <component :is="t.icon" class="h-[22px] w-[22px] text-fg" />
            <div class="font-display text-sm font-semibold text-fg">{{ t.label }}</div>
          </div>
        </div>
      </section>
      <SlabRule :size="1" />

      <!-- Section II — What this replaces -->
      <section class="py-20">
        <div class="mb-14 flex flex-col items-start justify-between gap-10 md:flex-row md:gap-16">
          <div class="max-w-[720px] flex-auto">
            <div class="eyebrow mb-3.5">Section II — What this replaces</div>
            <h2
              class="m-0 font-display text-[clamp(36px,5vw,56px)] font-semibold leading-none tracking-[-0.04em] text-fg"
            >
              Right now, this lives<br />in a spreadsheet.
            </h2>
          </div>
          <p class="m-0 max-w-[320px] pt-2 font-sans text-[15px] leading-[1.55] text-fg-dim">
            A full US NPANXX deck runs 200,000 rows. Here's what that costs you every time a new one
            lands.
          </p>
        </div>
        <div
          class="grid grid-cols-1 border-y border-line-strong md:grid-cols-3"
        >
          <div
            v-for="(p, i) in problems"
            :key="p.title"
            class="px-7 pb-9 pt-8"
            :class="i < 2 ? 'border-b border-line md:border-b-0 md:border-r' : ''"
          >
            <div class="dropcap mb-3.5">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="mb-2.5 text-fg-faint"><component :is="p.icon" class="h-5 w-5" /></div>
            <h3 class="m-0 font-display text-[19px] font-semibold leading-[1.22] tracking-[-0.015em] text-fg">
              {{ p.title }}
            </h3>
            <p class="mt-2.5 font-sans text-sm leading-[1.55] text-fg-dim">{{ p.body }}</p>
          </div>
        </div>
        <p
          class="mx-auto mt-12 max-w-[720px] text-center font-display text-[22px] leading-[1.3] tracking-[-0.015em] text-fg"
        >
          <span class="text-accent">—</span> You don't need a faster spreadsheet. You need to see the
          deck for what it is. <span class="text-accent">—</span>
        </p>
      </section>

      <!-- Section III — Analyze + Adjust -->
      <section id="features" class="pb-[60px]">
        <RunningHead left="Section III — Two sides to every deck" right="Analyze · Adjust" />
        <div
          class="mt-3 grid grid-cols-1 border-y-2 border-line-strong md:grid-cols-2"
        >
          <div
            v-for="(panel, i) in panels"
            :key="panel.title"
            class="px-8 pb-10 pt-9"
            :class="i === 0 ? 'border-b border-line-strong md:border-b-0 md:border-r' : ''"
          >
            <div class="mb-3.5 font-display text-[11px] uppercase tracking-[0.20em] text-accent">
              {{ panel.section }}
            </div>
            <div class="mb-4 flex items-center gap-3.5">
              <span
                class="inline-grid h-11 w-11 place-items-center border border-accent-ring bg-accent-soft text-accent"
              >
                <component :is="panel.icon" class="h-[22px] w-[22px]" />
              </span>
              <h3 class="m-0 font-display text-4xl font-semibold tracking-[-0.03em] text-fg">
                {{ panel.title }}
              </h3>
            </div>
            <p class="mb-6 max-w-[460px] font-sans text-[15px] text-fg-dim">{{ panel.tagline }}</p>
            <div class="flex flex-col gap-[18px]">
              <div v-for="item in panel.items" :key="item.label" class="border-l-2 border-accent pl-3.5">
                <div class="font-display text-[11px] uppercase tracking-[0.12em] text-fg">
                  {{ item.label }}
                </div>
                <p class="mt-1.5 font-sans text-[13.5px] leading-[1.55] text-fg-dim">{{ item.body }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section III-C — Compose (Rate Composition Studio) -->
      <section class="pb-[60px]">
        <RunningHead left="Section III-C — Five decks into one" right="Compose · blend & generate" />
        <div class="mt-3 border-y-2 border-line-strong px-8 pb-10 pt-9">
          <div class="mb-3.5 font-display text-[11px] uppercase tracking-[0.20em] text-accent">
            Section III-C
          </div>
          <div class="mb-4 flex items-center gap-3.5">
            <span
              class="inline-grid h-11 w-11 place-items-center border border-accent-ring bg-accent-soft text-accent"
            >
              <Square3Stack3DIcon class="h-[22px] w-[22px]" />
            </span>
            <h3 class="m-0 font-display text-4xl font-semibold tracking-[-0.03em] text-fg">
              Compose
            </h3>
          </div>
          <p class="mb-6 max-w-[560px] font-sans text-[15px] text-fg-dim">
            Blend up to five carrier decks into one — least-cost and jurisdiction-aware, in seconds.
          </p>
          <div class="grid grid-cols-1 gap-[18px] md:grid-cols-2">
            <div class="border-l-2 border-accent pl-3.5">
              <div class="font-display text-[11px] uppercase tracking-[0.12em] text-fg">
                Least-cost routing
              </div>
              <p class="mt-1.5 font-sans text-[13.5px] leading-[1.55] text-fg-dim">
                Pick the cheapest, the Nth-cheapest, or a blend of the top N — chosen independently
                for interstate, intrastate, and indeterminate.
              </p>
            </div>
            <div class="border-l-2 border-accent pl-3.5">
              <div class="font-display text-[11px] uppercase tracking-[0.12em] text-fg">
                Simulate, then generate
              </div>
              <p class="mt-1.5 font-sans text-[13.5px] leading-[1.55] text-fg-dim">
                Compare strategy scenarios against a sample before you commit, then generate a
                switch-ready deck plus a route-distribution map and a build summary.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section IV — How it works -->
      <section id="how" class="py-[60px]">
        <RunningHead left="Section IV — How it works" right="3 steps · no spreadsheet" />
        <h2
          class="my-8 font-display text-[clamp(32px,4.5vw,44px)] font-semibold leading-[1.05] tracking-[-0.03em] text-fg"
        >
          Three steps. No spreadsheet.
        </h2>
        <div class="grid grid-cols-1 border-y border-line-strong md:grid-cols-3">
          <div
            v-for="(step, i) in steps"
            :key="step.title"
            class="px-6 pb-8 pt-7"
            :class="i < 2 ? 'border-b border-line md:border-b-0 md:border-r' : ''"
          >
            <div class="mb-[18px] flex items-center justify-between">
              <span class="dropcap !text-[44px]">{{ String(i + 1).padStart(2, '0') }}</span>
              <component :is="step.icon" class="h-[22px] w-[22px] text-fg-faint" />
            </div>
            <h3 class="m-0 font-display text-[19px] font-semibold tracking-[-0.015em] text-fg">
              {{ step.title }}
            </h3>
            <p class="mt-2 font-sans text-[13.5px] leading-[1.55] text-fg-dim">{{ step.body }}</p>
          </div>
        </div>
      </section>

      <!-- Section V — Why it exists -->
      <section id="why" class="pb-20 pt-[60px]">
        <RunningHead left="Section V — Why it exists" right="Built by an operator" />
        <div class="mt-6 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div>
            <div class="mb-3 font-display text-[11px] uppercase tracking-[0.20em] text-accent">
              Colophon
            </div>
            <p class="m-0 font-display text-sm leading-[1.55] text-fg-dim">
              One operator. Two evenings. The question Excel couldn't answer in a day.
            </p>
            <hr class="mt-5 border-0 border-t border-line-strong" />
            <p class="mt-4 font-sans text-[13px] leading-[1.5] text-fg-faint">
              There wasn't anything else that did it — so now it's yours too, free. No tiers, no
              upsells, no telemetry.
            </p>
          </div>
          <div class="border-l-4 border-accent pl-7">
            <p
              class="m-0 font-display text-[28px] font-medium leading-[1.25] tracking-[-0.02em] text-fg"
            >
              A partner sends a new rate deck — or quietly cherry-picks the traffic to where your
              margin is thinnest. The answer is buried in <span class="text-accent">+200k rows</span>.
              We surface it in minutes, down to the NPA, so you respond surgically instead of
              rebuilding a deck.
            </p>
          </div>
        </div>
      </section>

      <!-- Closing CTA -->
      <SlabRule :size="2" />
      <section class="pb-20 pt-[70px] text-center">
        <div class="mb-3.5 font-display text-[11px] uppercase tracking-[0.20em] text-accent">
          Your cheat code
        </div>
        <h2
          class="m-0 font-display text-[clamp(36px,5vw,56px)] font-semibold leading-none tracking-[-0.04em] text-fg"
        >
          The cheat code for buying<br />and selling smarter.
        </h2>
        <p class="mx-auto mt-5 max-w-[480px] font-sans text-base text-fg-dim">
          Free forever. Local-first. Your rates never leave your browser.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3.5">
          <RouterLink to="/signup" :class="ctaPrimary">
            Sign up — free forever <ArrowRightIcon class="h-3.5 w-3.5" />
          </RouterLink>
          <a href="#features" :class="ctaGhost">See a sample deck</a>
        </div>
      </section>
    </div>

    <!-- Footer (shared component — reskin deferred to Pass 2) -->
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
  import { ref, type Component } from 'vue';
  import { RouterLink } from 'vue-router';
  import {
    BoltIcon,
    ArrowRightIcon,
    ArrowsRightLeftIcon,
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    ArrowTrendingDownIcon,
    LockClosedIcon,
    MapPinIcon,
    DocumentArrowUpIcon,
    TableCellsIcon,
    Square3Stack3DIcon,
  } from '@heroicons/vue/24/outline';
  import { BoltIcon as BoltSolidIcon } from '@heroicons/vue/24/solid';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import TheTicker, { type TickerItem } from '@/components/shared/TheTicker.vue';
  import RunningHead from '@/components/shared/RunningHead.vue';
  import SlabRule from '@/components/shared/SlabRule.vue';
  import compareShot from '@/assets/screenshots/compare.png';
  import compositionShot from '@/assets/screenshots/composition.png';
  import wizardShot from '@/assets/screenshots/wizard.png';

  // Shared Switchboard CTA classes (primary red fill / outline ghost).
  const ctaPrimary =
    'inline-flex items-center gap-2 bg-accent px-6 py-[15px] font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-ink no-underline';
  const ctaGhost =
    'inline-flex items-center gap-2 border border-line-strong px-[18px] py-[11px] font-display text-xs font-medium uppercase tracking-[0.06em] text-fg no-underline transition-colors hover:bg-row';

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'How it works', href: '#how' },
    { label: 'Why it exists', href: '#why' },
  ];

  // Landing ticker — green/red trading-screen palette (marketing only).
  const tickerItems: TickerItem[] = [
    { sym: 'NY-212', value: '+17.33%', dir: 'up' },
    { sym: 'CA-657', value: '+23.83%', dir: 'up' },
    { sym: 'CA-310', value: '−44.47%', dir: 'down' },
    { sym: 'OH-330', value: '−45.31%', dir: 'down' },
    { sym: 'VA-540', value: '−41.70%', dir: 'down' },
    { sym: 'DC-202', value: '+34.81%', dir: 'up' },
    { sym: 'CO-748', value: '+17.17%', dir: 'up' },
    { sym: 'AVG MARGIN', value: '$0.0041', dir: 'up' },
    { sym: 'COVERAGE', value: '87.02%', dir: 'up' },
    { sym: 'ROWS', value: '223,267', dir: 'up' },
  ];

  // --- Hero product tour — user-driven tabs (no auto-advance) ---
  const heroTabs = [
    {
      key: 'compare',
      label: 'Compare',
      src: compareShot,
      fig: 'Deck Analyzer',
      metric: '87.02% match · 194,281 opportunities surfaced',
      alt: 'Comparing two US NPANXX rate decks — coverage match, margin deltas, and top buy/sell opportunities',
      caption: 'Drop in two decks — see where you win and where they beat you, in seconds.',
    },
    {
      key: 'compose',
      label: 'Compose',
      src: compositionShot,
      fig: 'Rate Composition',
      metric: '225,034 prefixes · LCR scenarios simulated',
      alt: 'Rate Composition Studio simulating sell decks from multiple carrier feeds — LCR depth, markup, and win rate by jurisdiction',
      caption: 'Build a sell deck from up to five carrier feeds — least-cost routed, marked up, and simulated before you commit.',
    },
    {
      key: 'adjust',
      label: 'Adjust',
      src: wizardShot,
      fig: 'Pricing Studio',
      metric: '223,267 rows repriced · effective-dated',
      alt: 'Pricing Studio repricing 223,267 US NPANXX rows by percentage with an effective date, in the browser',
      caption: 'Reprice with a scalpel — by code, NPA, state, or metro. Try that in Excel.',
    },
  ];
  const activeTab = ref(0);

  interface PanelItem {
    label: string;
    body: string;
  }

  interface Panel {
    icon: Component;
    section: string;
    title: string;
    tagline: string;
    items: PanelItem[];
  }

  interface Step {
    icon: Component;
    title: string;
    body: string;
  }

  interface Problem {
    icon: Component;
    title: string;
    body: string;
  }

  interface Trust {
    icon: Component;
    col: string;
    label: string;
  }

  // --- Page content ---
  const trust: Trust[] = [
    { icon: LockClosedIcon, col: 'Column A', label: 'Local-first & ephemeral' },
    { icon: MapPinIcon, col: 'Column B', label: 'LERG-enriched & jurisdiction-aware' },
    { icon: BoltIcon, col: 'Column C', label: 'Built for full-size decks' },
  ];

  const problems: Problem[] = [
    {
      icon: TableCellsIcon,
      title: 'The deck outgrows the spreadsheet',
      body: 'Pivot tables crawl and formulas break long before 200k rows — so you spot-check a few NPAs and trust the rest is fine.',
    },
    {
      icon: ArrowTrendingDownIcon,
      title: 'Margin leaks out of sight',
      body: 'A partner re-routes traffic to the NPANXX where your margin is thinnest. The loss is real, and buried across thousands of rows until the invoice lands.',
    },
    {
      icon: MapPinIcon,
      title: 'Jurisdiction is invisible in a CSV',
      body: 'Interstate, intrastate, indeterminate — every NPANXX prices differently, and none of that context lives in your sheet, so mispricing slips through.',
    },
  ];

  const panels: Panel[] = [
    {
      icon: ArrowsRightLeftIcon,
      section: 'Section III-A',
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
      section: 'Section III-B',
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
  /* Caption crossfade — swaps with the active hero tab (click-driven). */
  .caption-fade-enter-active,
  .caption-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .caption-fade-enter-from,
  .caption-fade-leave-to {
    opacity: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .caption-fade-enter-active,
    .caption-fade-leave-active {
      transition: none;
    }
  }
</style>
