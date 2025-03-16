export const JOURNEY_STATE = {
  INITIAL: 'INITIAL',
  ONE_FILE: 'ONE_FILE',
  ONE_FILE_REPORT: 'ONE_FILE_REPORT',
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
    title: 'AZ Rate Deck Analyzer',
    message: "Let's analyze some AZ decks, shall we?<br> Upload a rate deck to get started!",
  },
  ONE_FILE: {
    title: 'Great start!',
    message: 'Your file has been analyzed!<br> You can see the code report below.<br>Upload a second file to compare and find opportunities.',
  },
  ONE_FILE_REPORT: {
    title: 'Single File Analysis',
    message: 'Your file has been analyzed!<br> You can see the code report below.<br>Upload a second file to compare and find buy/sell opportunities.',
  },
  TWO_FILES: {
    title: 'Ready for comparison',
    message: 'Both files are uploaded. Click "Get Reports" to see a detailed comparison and find opportunities.',
  },
  REPORTS_READY: {
    title: 'Analysis complete',
    message: 'Use the report tabs to explore your opportunities.',
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
  [JOURNEY_STATE.ONE_FILE_REPORT]: {
    title: 'Single File Analysis',
    message: 'Your file has been analyzed! View the code report to see details about your rate deck.<br />Upload a second file to get a full comparison and find buying/selling opportunities.',
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

// Define a type for the different parent components that use PreviewModal2
export type PreviewModalSource = 
  | 'AZ' 
  | 'US' 
  | 'AZ_RATE_DECK' 
  | 'US_RATE_DECK' 
  | 'LERG';

// Messages for PreviewModal2 based on the parent component
export const PREVIEW_MODAL_MESSAGES: Record<PreviewModalSource, JourneyMessage> = {
  AZ: {
    title: 'AZ File Column Mapping',
    message: 'Please map the columns from your CSV file to the required fields.<br>For AZ files, you need to identify the Destination, Dialcode, and Rate columns.'
  },
  US: {
    title: 'US File Column Mapping',
    message: 'Please map the columns from your CSV file to the required fields.<br>For US files, you need to identify either NPANXX or both NPA and NXX columns, plus Interstate and Intrastate rates.'
  },
  AZ_RATE_DECK: {
    title: 'Rate Sheet Column Mapping',
    message: 'Please map the columns from your CSV file to the required fields.<br>For Rate Sheets, you need to identify the Name, Prefix, and Rate columns.'
  },
  US_RATE_DECK: {
    title: 'US Rate Sheet Column Mapping',
    message: 'Please map the columns from your CSV file to the required fields.<br>For US Rate Sheets, you need to identify the NPA and NXX columns, OR NPANXX, Interstate and Intrastate rates.'
  },
  LERG: {
    title: 'LERG Data Column Mapping',
    message: 'Please map the columns from your CSV file to the required LERG fields.<br>Ensure you identify the NPA, NXX, STATE, and COUNTRY.'
  }
};
