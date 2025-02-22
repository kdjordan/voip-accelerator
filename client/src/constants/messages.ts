export const JOURNEY_STATE = {
  INITIAL: 'INITIAL',
  ONE_FILE: 'ONE_FILE',
  TWO_FILES: 'TWO_FILES',
  REPORTS_READY: 'REPORTS_READY',
} as const;

export type JourneyState = keyof typeof JOURNEY_STATE;

interface JourneyMessage {
  title: string;
  message: string;
}

export const AZ_JOURNEY_MESSAGES: Record<JourneyState, JourneyMessage> = {
  INITIAL: {
    title: 'AZ File Upload',
    message: 'Upload <span class="text-white font-medium uppercase">your rates</span> and the rates of your <span class="text-white font-medium uppercase">prospective carrier</span>.<br />We will generate you a report showing the best opportunities for you to buy and sell.',
  },
  ONE_FILE: {
    title: 'Great start!',
    message: 'Now upload your second rate deck to compare rates and codes to find opportunities.',
  },
  TWO_FILES: {
    title: 'FILES UPLOADED',
    message: 'Processing your files. Please wait...',
  },
  REPORTS_READY: {
    title: 'Analysis complete',
    message: 'Use the report tabs below to explore your opportunities.',
  },
};

export const US_JOURNEY_MESSAGES = {
  [JOURNEY_STATE.INITIAL]: {
    title: 'US File Upload',
    message:
      'Upload <span class="text-white font-medium uppercase">your rates</span> and the rates of your <span class="text-white font-medium uppercase">prospective carrier</span>.<br />We will generate you a report showing the best opportunities for you to buy and sell.',
  },
  [JOURNEY_STATE.ONE_FILE]: {
    title: 'Great start!',
    message: 'Now upload your second rate deck to compare rates and codes to find opportunities.',
  },
  [JOURNEY_STATE.TWO_FILES]: {
    title: 'Ready for analysis',
    message: 'Click "Get Reports" below to see your detailed rate and code analyses.',
  },
  // [JOURNEY_STATE.PROCESSING]: {
  //   title: 'Analyzing rates',
  //   message: 'We are processing your rate decks and generating reports.',
  // },
  [JOURNEY_STATE.REPORTS_READY]: {
    title: 'Analysis complete',
    message: 'Use the report tabs above to explore your opportunities.',
  },
} as const;
