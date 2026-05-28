import { defineStore } from 'pinia';
import type { RateDeckHandoff } from '@/types/domains/handoff-types';

// Carrier store for the cross-module rate deck hand-off. Holds a single pending
// snapshot across ONE auto-navigation from source to destination. The destination
// view consumes it on mount (one-shot). See docs/adr/0009-cross-module-rate-deck-handoff.md.

interface HandoffState {
  pending: RateDeckHandoff | null;
}

export const useHandoffStore = defineStore('handoff', {
  state: (): HandoffState => ({
    pending: null,
  }),

  getters: {
    hasPending: (state): boolean => state.pending !== null,
  },

  actions: {
    setPending(h: RateDeckHandoff): void {
      this.pending = h;
    },

    // One-shot: return the pending hand-off and clear it.
    consume(): RateDeckHandoff | null {
      const h = this.pending;
      this.pending = null;
      return h;
    },

    clear(): void {
      this.pending = null;
    },
  },
});
