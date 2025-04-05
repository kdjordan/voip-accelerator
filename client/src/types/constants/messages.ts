// messages.ts - Refactored version

export const JOURNEY_STATE = {
  INITIAL: 'INITIAL',
  ONE_FILE: 'ONE_FILE',
  ONE_FILE_REPORT: 'ONE_FILE_REPORT',
  TWO_FILES: 'TWO_FILES',
  REPORTS_READY: 'REPORTS_READY',
} as const;

export type JourneyState = keyof typeof JOURNEY_STATE;

// Define product types
export type ProductType = 'AZ' | 'US';

export interface JourneyMessage {
  title: string;
  message: string;
}

// Base message templates with placeholders
const BASE_JOURNEY_MESSAGES: Record<
  JourneyState,
  {
    title: string;
    message: string;
    titleVariants?: Partial<Record<ProductType, string>>;
    messageVariants?: Partial<Record<ProductType, string>>;
  }
> = {
  INITIAL: {
    title: '{product} Rate Deck Analyzer',
    message: "Let's analyze some {product} decks, shall we?<br> Upload a rate deck to get started!",
    messageVariants: {
      US: "Let's analyze some NPANXX decks, shall we?<br> Upload a rate deck to get started!",
    },
  },
  ONE_FILE: {
    title: 'Great start!',
    message:
      'Your file has been analyzed!<br> You can see the individual code report below.<br>Upload a second file to compare and find opportunities.',
    messageVariants: {
      US: 'Now upload your second rate deck to compare rates and codes to find opportunities.',
    },
  },
  ONE_FILE_REPORT: {
    title: 'Single File Analysis',
    message:
      'Your file has been analyzed!<br> You can see the code report below.<br>Upload a second file to compare and find buy/sell opportunities.',
    messageVariants: {
      US: 'Your file has been analyzed! View the code report to see details about your rate deck.<br />Upload a second file to get a full comparison and find buying/selling opportunities.',
    },
  },
  TWO_FILES: {
    title: 'Ready for comparison',
    message:
      'Both files are uploaded.<br>Click "Get Reports" to generate pricing and code comparison reports.',
    titleVariants: {
      US: 'Ready for analysis',
    },
    messageVariants: {
      US: 'Click "Get Reports" below to see your detailed rate and code analyses.',
    },
  },
  REPORTS_READY: {
    title: 'Analysis complete',
    message: 'Use the report tabs to explore your opportunities.',
    messageVariants: {
      US: 'Use the report tabs above to explore your opportunities.',
    },
  },
};

/**
 * Create journey messages for a specific product type
 * @param productType - The product type ('AZ' or 'US')
 * @returns Record of journey messages customized for the product
 */
export function createJourneyMessages(
  productType: ProductType
): Record<JourneyState, JourneyMessage> {
  const result: Record<JourneyState, JourneyMessage> = {} as Record<JourneyState, JourneyMessage>;

  for (const [state, baseMessage] of Object.entries(BASE_JOURNEY_MESSAGES)) {
    const title =
      baseMessage.titleVariants?.[productType] ||
      baseMessage.title.replace('{product}', productType);

    const message =
      baseMessage.messageVariants?.[productType] ||
      baseMessage.message.replace('{product}', productType);

    result[state as JourneyState] = { title, message };
  }

  return result;
}

// Generate the specific message sets
export const AZ_JOURNEY_MESSAGES = createJourneyMessages('AZ');
export const US_JOURNEY_MESSAGES = createJourneyMessages('US');

// Define a type for the different parent components that use PreviewModal
export type PreviewModalSource = 'AZ' | 'US' | 'AZ_RATE_DECK' | 'US_RATE_DECK' | 'LERG';

// Messages for PreviewModal based on the parent component
export const PREVIEW_MODAL_MESSAGES: Record<PreviewModalSource, JourneyMessage> = {
  AZ: {
    title: 'AZ File Column Mapping',
    message:
      'Please map the columns from your CSV file to the required fields.<br>For AZ files, you need to identify the Destination, Dialcode, and Rate columns.',
  },
  US: {
    title: 'US File Column Mapping',
    message:
      'Please map the columns from your CSV file to the required fields.<br>For US files, you need to identify either NPANXX or both NPA and NXX columns, plus Interstate and Intrastate rates.',
  },
  AZ_RATE_DECK: {
    title: 'Rate Sheet Column Mapping',
    message:
      'Please map the columns from your CSV file to the required fields.<br>For Rate Sheets, you need to identify the Name, Prefix, and Rate columns.',
  },
  US_RATE_DECK: {
    title: 'US Rate Sheet Column Mapping',
    message:
      'Please map the columns from your CSV file to the required fields.<br>For US Rate Sheets, you need to identify the NPA and NXX columns, OR NPANXX, Interstate and Intrastate rates.',
  },
  LERG: {
    title: 'LERG Data Column Mapping',
    message:
      'Please map the columns from your CSV file to the required LERG fields.<br>Ensure you identify the NPA, NXX, STATE, and COUNTRY.',
  },
};
