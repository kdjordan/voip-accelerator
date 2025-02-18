export const AZ_JOURNEY_STATE = {
  INITIAL: 'INITIAL',
  ONE_FILE: 'ONE_FILE',
  TWO_FILES: 'TWO_FILES',
  PROCESSING: 'PROCESSING',
  REPORTS_READY: 'REPORTS_READY',
} as const;

export type AZJourneyState = keyof typeof AZ_JOURNEY_STATE;

export const AZ_JOURNEY_MESSAGES = {
  [AZ_JOURNEY_STATE.INITIAL]: {
    title: 'Upload your rate decks',
    message:
      'Upload your <span class="text-white font-medium uppercase">current rates</span> and the rates of your <span class="text-white font-medium uppercase">prospective carrier</span>.<br />We will generate you a report showing the best opportunities for you to buy and sell.',
  },
  [AZ_JOURNEY_STATE.ONE_FILE]: {
    title: 'Great start!',
    message: 'Now upload your second rate deck to compare rates and codes to find opportunities.',
  },
  [AZ_JOURNEY_STATE.TWO_FILES]: {
    title: 'Ready for analysis',
    message: 'Click "Get Reports" below to see your detailed rate and code analyses.',
  },
  [AZ_JOURNEY_STATE.PROCESSING]: {
    title: 'Analyzing rates',
    message: 'We are processing your rate decks and generating reports.',
  },
  [AZ_JOURNEY_STATE.REPORTS_READY]: {
    title: 'Analysis complete',
    message: 'Use the report tabs above to explore your opportunities.',
  },
} as const;
