/**
 * Utility for detecting and analyzing +1 (North American) destinations in rate decks
 */

import { useLergStoreV2 } from '@/stores/lerg-store-v2';
import { NANPCategorizer } from '@/utils/nanp-categorization';

export interface PlusOneAnalysis {
  hasPlusOne: boolean;
  totalDestinations: number;
  plusOneBreakdown: {
    usNPAs: string[];
    canadianNPAs: string[];
    caribbeanNPAs: string[];
    unknownNPAs: string[];
  };
  suggestedAction: 'proceed-normal' | 'show-modal';
}

/**
 * Extract potential dial code from a data row
 * Handles various formats: "1809", "+1809", "1-809-555-1234", etc.
 */
function extractDialCode(row: any[]): string {
  // Check common column positions and formats
  for (const cell of row) {
    if (!cell) continue;
    
    const str = cell.toString().trim();
    
    // Remove common formatting
    const cleaned = str.replace(/[\s\-\+\(\)]/g, '');
    
    // Look for patterns that start with 1 followed by 3+ digits
    if (/^1\d{3,}/.test(cleaned)) {
      return cleaned;
    }
  }
  
  return '';
}

/**
 * Extract NPA (area code) from a dial code
 */
function extractNPA(dialCode: string): string {
  if (dialCode.startsWith('1') && dialCode.length >= 4) {
    return dialCode.substring(1, 4);
  }
  return '';
}

/**
 * Detect +1 destinations in rate deck data
 */
export function detectPlusOneDestinations(data: string[][]): PlusOneAnalysis {
  const lergStore = useLergStoreV2();
  const plusOneNPAs = new Set<string>();
  
  // Skip header row, analyze data rows
  const dataRows = data.slice(1);
  
  for (const row of dataRows) {
    const dialCode = extractDialCode(row);
    if (dialCode) {
      const npa = extractNPA(dialCode);
      if (npa) {
        plusOneNPAs.add(npa);
      }
    }
  }
  
  // Classify the NPAs using professional NANP categorization
  const breakdown = {
    usNPAs: [] as string[],
    canadianNPAs: [] as string[],
    caribbeanNPAs: [] as string[],
    unknownNPAs: [] as string[]
  };
  
  // Categorize NPAs using professional NANP system
  
  for (const npa of plusOneNPAs) {
    const categorization = NANPCategorizer.categorizeNPA(npa);
    
    switch (categorization.category) {
      case 'us-domestic':
        breakdown.usNPAs.push(npa);
        break;
      case 'canadian':
        breakdown.canadianNPAs.push(npa);
        break;
      case 'caribbean':
      case 'pacific':
        breakdown.caribbeanNPAs.push(npa);
        break;
      case 'unknown':
      default:
        breakdown.unknownNPAs.push(npa);
        console.log(`Unknown NPA detected: ${npa} - ${categorization.countryName}`);
    }
  }
  
  // Validate categorization quality for diagnostics
  const allNPAs = Array.from(plusOneNPAs);
  const validation = NANPCategorizer.validateCategorization(allNPAs);
  
  const hasPlusOne = plusOneNPAs.size > 0;
  
  // For US rate decks: US + Canada = acceptable, Caribbean/territories = warning needed
  const hasExpensiveDestinations = breakdown.caribbeanNPAs.length > 0 || breakdown.unknownNPAs.length > 0;
  const hasAcceptableOnly = (breakdown.usNPAs.length > 0 || breakdown.canadianNPAs.length > 0) && !hasExpensiveDestinations;
  
  // Show modal only if there are expensive Caribbean/territory destinations
  const suggestedAction = hasPlusOne && hasExpensiveDestinations ? 'show-modal' : 'proceed-normal';
  
  // Production logging for business monitoring
  if (hasPlusOne && hasExpensiveDestinations) {
    console.log('[+1 Detector] Expensive destinations detected - user warning triggered');
  }
  
  return {
    hasPlusOne,
    totalDestinations: dataRows.length,
    plusOneBreakdown: breakdown,
    suggestedAction
  };
}

/**
 * Filter data based on user's +1 handling choice
 */
export function filterByPlusOneChoice(
  data: string[][],
  choice: 'include-all' | 'exclude-us' | 'exclude-all-plus-one' | 'keep-us-canada-only'
): string[][] {
  if (choice === 'include-all') {
    return data;
  }
  
  const lergStore = useLergStoreV2();
  const [headers, ...rows] = data;
  
  const filteredRows = rows.filter(row => {
    const dialCode = extractDialCode(row);
    const npa = extractNPA(dialCode);
    
    if (!npa) {
      // Not a +1 destination, keep it
      return true;
    }
    
    if (choice === 'exclude-all-plus-one') {
      // Exclude all +1 destinations
      return false;
    }
    
    if (choice === 'exclude-us') {
      // Keep everything except US NPAs
      const categorization = NANPCategorizer.categorizeNPA(npa);
      return categorization.category !== 'us-domestic';
    }
    
    if (choice === 'keep-us-canada-only') {
      // For US rate deck protection: keep only US domestic and Canadian NPAs
      const categorization = NANPCategorizer.categorizeNPA(npa);
      return categorization.category === 'us-domestic' || categorization.category === 'canadian';
    }
    
    return true;
  });
  
  return [headers, ...filteredRows];
}

/**
 * Test function for debugging
 */
export function testPlusOneDetection() {
  const sampleData = [
    ['Destination', 'Code', 'Rate'],
    ['United States', '1212', '0.005'],
    ['Dominican Republic', '1809', '0.12'],
    ['Germany', '49', '0.03'],
    ['Jamaica', '1876', '0.15']
  ];
  
  console.log('Testing +1 detection:');
  const result = detectPlusOneDestinations(sampleData);
  console.log(result);
  
  return result;
}