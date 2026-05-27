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

    <!-- Centered hero -->
    <main class="relative z-10 mx-auto max-w-3xl px-6 pb-10 pt-16 text-center">
      <div class="reveal">
        <div
          class="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-secondary text-xs text-zinc-400"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Built for US wholesale VoIP · free forever
        </div>
        <h1 class="text-5xl font-bold leading-[1.04] tracking-tighter text-white md:text-6xl">
          Buy and sell<br />
          <span class="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"
            >US minutes smarter.</span
          >
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Compare NPANXX rate decks, catch the margin a partner is quietly cherry-picking, and
          reprice down to the NPA — in minutes, not a day in Excel. LERG-enriched, jurisdiction-aware,
          and free. Nothing ever leaves your browser.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <RouterLink
            to="/signup"
            class="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 font-semibold text-ink transition-colors hover:bg-emerald-300"
          >
            Sign Up — Free Forever
          </RouterLink>
          <a
            href="#how"
            class="inline-flex items-center gap-2 font-medium text-zinc-200 transition-colors hover:text-white"
          >
            See how it works <ArrowRightIcon class="h-4 w-4" />
          </a>
        </div>
        <Transition name="caption-fade" mode="out-in">
          <p :key="activeShot" class="mt-6 text-sm text-zinc-500">
            {{ heroShots[activeShot].caption }}
          </p>
        </Transition>
      </div>

    </main>

    <!-- Hero product shot — auto-crossfading screenshots -->
    <div class="reveal-delay relative z-10 mx-auto max-w-6xl px-6">
      <div
        class="relative aspect-[7/5] overflow-hidden rounded-2xl border border-white/10 bg-ink-raised shadow-2xl shadow-emerald-950/40 ring-1 ring-emerald-400/5 sm:aspect-[16/11]"
      >
        <img
          v-for="(shot, i) in heroShots"
          :key="i"
          :src="shot.src"
          :alt="shot.alt"
          class="absolute inset-0 h-full w-full object-contain object-top transition-opacity duration-1000 ease-in-out"
          :class="i === activeShot ? 'opacity-100' : 'opacity-0'"
        />
      </div>
      <!-- slide indicators -->
      <div class="mt-4 flex items-center justify-center gap-2">
        <button
          v-for="(shot, i) in heroShots"
          :key="i"
          type="button"
          @click="selectShot(i)"
          :aria-label="shot.alt"
          class="h-1.5 rounded-full transition-all"
          :class="i === activeShot ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/20 hover:bg-white/40'"
        />
      </div>
    </div>

    <!-- Trust strip — replaces a logo wall (we don't fabricate proof) -->
    <div
      class="relative z-10 mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-3 px-6 font-secondary text-xs text-zinc-400"
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

    <!-- What this replaces: the spreadsheet status quo, agitated before the pitch -->
    <section class="relative z-10 mx-auto max-w-7xl px-6 py-16">
      <div class="mb-12 text-center">
        <p class="mb-3 font-secondary text-xs uppercase tracking-wider text-zinc-500">
          What this replaces
        </p>
        <h2 class="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Right now, this lives in a spreadsheet.
        </h2>
        <p class="mx-auto mt-3 max-w-xl text-zinc-400">
          A full US NPANXX deck runs 200,000 rows. Here's what that costs you every time a new one
          lands.
        </p>
      </div>
      <div class="grid gap-5 md:grid-cols-3">
        <div
          v-for="problem in problems"
          :key="problem.title"
          class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
        >
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.03] ring-1 ring-white/10"
          >
            <component :is="problem.icon" class="h-5 w-5 text-zinc-400" />
          </span>
          <h3 class="mt-4 font-semibold text-white">{{ problem.title }}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-zinc-500">{{ problem.body }}</p>
        </div>
      </div>
      <p class="mx-auto mt-10 max-w-xl text-center text-zinc-300">
        You don't need a faster spreadsheet. You need to see the deck for what it is.
      </p>
    </section>

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
          is thinnest. The answer is buried in +200k rows. VoIP Accelerator surfaces it in
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
        Sign Up — Free Forever
      </RouterLink>
    </section>

    <!-- Footer (shared component) -->
    <div class="relative z-10 border-t border-white/[0.06]">
      <TheFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, type Component } from 'vue';
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
  } from '@heroicons/vue/24/outline';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import compareShot from '@/assets/screenshots/compare.png';
  import explorerShot from '@/assets/screenshots/explorer.png';
  import wizardShot from '@/assets/screenshots/wizard.png';

  // --- Hero screenshot carousel (auto-crossfade) ---
  const heroShots = [
    {
      src: compareShot,
      alt: 'Comparing two US NPANXX rate decks — coverage match, margin deltas, and top buy/sell opportunities',
      caption: 'Drop in two decks — see where you win and where they beat you, in seconds.',
    },
    {
      src: explorerShot,
      alt: 'Per-NPANXX pricing comparison between two US rate decks — interstate, intrastate, and indeterminate deltas',
      caption: 'Drill to the exact NPANXX. Nothing stays buried.',
    },
    {
      src: wizardShot,
      alt: 'Pricing Studio repricing 223,267 US NPANXX rows by percentage with an effective date, in the browser',
      caption: 'Reprice with a scalpel — by code, NPA, state, or metro. Try that in Excel.',
    },
  ];
  const activeShot = ref(0);
  let shotTimer: ReturnType<typeof setInterval> | undefined;

  function startShotRotation() {
    if (heroShots.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    shotTimer = setInterval(() => {
      activeShot.value = (activeShot.value + 1) % heroShots.length;
    }, 5000);
  }

  function selectShot(i: number) {
    activeShot.value = i;
    if (shotTimer) clearInterval(shotTimer);
    startShotRotation();
  }

  onMounted(startShotRotation);
  onBeforeUnmount(() => {
    if (shotTimer) clearInterval(shotTimer);
  });

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

  interface Problem {
    icon: Component;
    title: string;
    body: string;
  }

  // --- Page content ---
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
  /* Caption crossfade — synced with the hero carousel. */
  .caption-fade-enter-active,
  .caption-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .caption-fade-enter-from,
  .caption-fade-leave-to {
    opacity: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal,
    .reveal-delay {
      animation: none;
    }
    .caption-fade-enter-active,
    .caption-fade-leave-active {
      transition: none;
    }
  }
</style>
