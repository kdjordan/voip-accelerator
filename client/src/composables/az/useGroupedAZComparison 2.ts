import { ref, computed } from 'vue';
import type { AZDetailedComparisonEntry } from '@/types/domains/az-types';

// Rate distribution entry for grouping identical rates
interface RateGroup {
  rate: number;
  count: number;
  codes: string[];
  percentage: number; // percentage of total codes in this group
}

// Distribution of rates for a destination across both files
interface RateDistribution {
  file1: RateGroup[];
  file2: RateGroup[];
  totalCodes: number;
}

// Summary statistics for a destination group
interface DestinationStats {
  cheaperFile1Count: number;
  cheaperFile2Count: number;
  sameRateCount: number;
  predominantCheaper: 'file1' | 'file2' | 'mixed' | 'same';
  avgDiff: number;
  avgDiffPercent: number;
}

// Main grouped destination interface
export interface GroupedDestination {
  // Identity
  destinationKey: string;
  destName1?: string;
  destName2?: string;
  matchStatus: 'both' | 'file1_only' | 'file2_only';
  
  // Display control
  displayMode: 'inline' | 'grouped';
  isExpanded: boolean;
  expandedView: 'codes' | 'rate-groups';
  
  // Data
  codes: AZDetailedComparisonEntry[];
  codeCount: number;
  
  // Analytics
  rateDistribution: RateDistribution;
  stats: DestinationStats;
}

// Expanded view for rate groups
export interface RateComparisonGroup {
  file1Rate?: number;
  file2Rate?: number;
  diff?: number;
  diffPercent?: number;
  cheaperFile?: 'file1' | 'file2' | 'same';
  codes: string[];
  count: number;
}

export function useGroupedAZComparison() {
  // Threshold for switching to grouped display
  const GROUPING_THRESHOLD = 20;
  
  // Expansion state tracking
  const expandedDestinations = ref<Set<string>>(new Set());
  const expandedViews = ref<Map<string, 'codes' | 'rate-groups'>>(new Map());

  /**
   * Groups comparison entries by destination name
   */
  function groupByDestination(entries: AZDetailedComparisonEntry[]): GroupedDestination[] {
    const destinationMap = new Map<string, AZDetailedComparisonEntry[]>();
    
    // Group entries by destination name (prefer file1 name, fallback to file2)
    entries.forEach(entry => {
      const destName = entry.destName1 || entry.destName2 || 'Unknown Destination';
      const key = destName.toLowerCase().trim();
      
      if (!destinationMap.has(key)) {
        destinationMap.set(key, []);
      }
      destinationMap.get(key)!.push(entry);
    });
    
    // Transform groups into GroupedDestination objects
    return Array.from(destinationMap.entries()).map(([key, codes]) => {
      const firstEntry = codes[0];
      const codeCount = codes.length;
      const displayMode = 'grouped'; // All destinations now use grouped mode
      
      return {
        destinationKey: key,
        destName1: firstEntry.destName1,
        destName2: firstEntry.destName2,
        matchStatus: firstEntry.matchStatus,
        displayMode,
        isExpanded: false, // Start collapsed by default
        expandedView: expandedViews.value.get(key) || 'codes',
        codes: codes.sort((a, b) => a.dialCode.localeCompare(b.dialCode)),
        codeCount,
        rateDistribution: calculateRateDistribution(codes),
        stats: calculateDestinationStats(codes),
      };
    }).sort((a, b) => a.destinationKey.localeCompare(b.destinationKey));
  }

  /**
   * Calculates rate distribution for a destination
   */
  function calculateRateDistribution(codes: AZDetailedComparisonEntry[]): RateDistribution {
    const file1Rates = new Map<number, { count: number; codes: string[] }>();
    const file2Rates = new Map<number, { count: number; codes: string[] }>();
    
    codes.forEach(code => {
      // File 1 rates
      if (code.rate1 !== null && code.rate1 !== undefined) {
        const rate = Number(code.rate1.toFixed(6)); // Normalize to 6 decimals
        if (!file1Rates.has(rate)) {
          file1Rates.set(rate, { count: 0, codes: [] });
        }
        const group = file1Rates.get(rate)!;
        group.count++;
        group.codes.push(code.dialCode);
      }
      
      // File 2 rates
      if (code.rate2 !== null && code.rate2 !== undefined) {
        const rate = Number(code.rate2.toFixed(6)); // Normalize to 6 decimals
        if (!file2Rates.has(rate)) {
          file2Rates.set(rate, { count: 0, codes: [] });
        }
        const group = file2Rates.get(rate)!;
        group.count++;
        group.codes.push(code.dialCode);
      }
    });
    
    const totalCodes = codes.length;
    
    // Convert to RateGroup arrays, sorted by count (most common first)
    const file1Groups: RateGroup[] = Array.from(file1Rates.entries())
      .map(([rate, data]) => ({
        rate,
        count: data.count,
        codes: data.codes.sort(),
        percentage: (data.count / totalCodes) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    
    const file2Groups: RateGroup[] = Array.from(file2Rates.entries())
      .map(([rate, data]) => ({
        rate,
        count: data.count,
        codes: data.codes.sort(),
        percentage: (data.count / totalCodes) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    
    return {
      file1: file1Groups,
      file2: file2Groups,
      totalCodes,
    };
  }

  /**
   * Calculates summary statistics for a destination
   */
  function calculateDestinationStats(codes: AZDetailedComparisonEntry[]): DestinationStats {
    let cheaperFile1Count = 0;
    let cheaperFile2Count = 0;
    let sameRateCount = 0;
    let totalDiff = 0;
    let totalDiffPercent = 0;
    let validComparisons = 0;
    
    codes.forEach(code => {
      if (code.cheaperFile === 'file1') {
        cheaperFile1Count++;
      } else if (code.cheaperFile === 'file2') {
        cheaperFile2Count++;
      } else if (code.cheaperFile === 'same') {
        sameRateCount++;
      }
      
      // Calculate averages for valid comparisons
      if (code.diff !== null && code.diff !== undefined) {
        totalDiff += code.diff;
        validComparisons++;
      }
      
      if (code.diffPercent !== null && code.diffPercent !== undefined) {
        totalDiffPercent += code.diffPercent;
      }
    });
    
    // Determine predominant cheaper file
    let predominantCheaper: 'file1' | 'file2' | 'mixed' | 'same';
    const totalComparisons = cheaperFile1Count + cheaperFile2Count + sameRateCount;
    
    if (sameRateCount === totalComparisons) {
      predominantCheaper = 'same';
    } else if (cheaperFile1Count > cheaperFile2Count * 2) {
      predominantCheaper = 'file1';
    } else if (cheaperFile2Count > cheaperFile1Count * 2) {
      predominantCheaper = 'file2';
    } else {
      predominantCheaper = 'mixed';
    }
    
    return {
      cheaperFile1Count,
      cheaperFile2Count,
      sameRateCount,
      predominantCheaper,
      avgDiff: validComparisons > 0 ? totalDiff / validComparisons : 0,
      avgDiffPercent: validComparisons > 0 ? totalDiffPercent / validComparisons : 0,
    };
  }

  /**
   * Generates rate comparison groups for the rate-groups view
   */
  function generateRateComparisonGroups(destination: GroupedDestination): RateComparisonGroup[] {
    const groups: RateComparisonGroup[] = [];
    const processedRatePairs = new Set<string>();
    
    // Create a map of file1 rates to their data
    const file1RateMap = new Map<number, RateGroup>();
    destination.rateDistribution.file1.forEach(group => {
      file1RateMap.set(group.rate, group);
    });
    
    // Process file2 rates and find matches/differences
    destination.rateDistribution.file2.forEach(file2Group => {
      destination.rateDistribution.file1.forEach(file1Group => {
        const ratePairKey = `${file1Group.rate}-${file2Group.rate}`;
        
        if (processedRatePairs.has(ratePairKey)) return;
        processedRatePairs.add(ratePairKey);
        
        // Find codes that have both these rates
        const matchingCodes = destination.codes
          .filter(code => 
            code.rate1 === file1Group.rate && code.rate2 === file2Group.rate
          )
          .map(code => code.dialCode);
        
        if (matchingCodes.length > 0) {
          const diff = file1Group.rate - file2Group.rate;
          const diffPercent = file2Group.rate !== 0 ? (diff / file2Group.rate) * 100 : 0;
          
          let cheaperFile: 'file1' | 'file2' | 'same';
          if (Math.abs(diff) < 0.000001) { // Account for floating point precision
            cheaperFile = 'same';
          } else if (diff < 0) {
            cheaperFile = 'file1';
          } else {
            cheaperFile = 'file2';
          }
          
          groups.push({
            file1Rate: file1Group.rate,
            file2Rate: file2Group.rate,
            diff,
            diffPercent,
            cheaperFile,
            codes: matchingCodes.sort(),
            count: matchingCodes.length,
          });
        }
      });
    });
    
    // Handle file1-only rates
    destination.rateDistribution.file1.forEach(file1Group => {
      const file1OnlyCodes = destination.codes
        .filter(code => 
          code.rate1 === file1Group.rate && 
          (code.rate2 === null || code.rate2 === undefined)
        )
        .map(code => code.dialCode);
      
      if (file1OnlyCodes.length > 0) {
        groups.push({
          file1Rate: file1Group.rate,
          file2Rate: undefined,
          diff: undefined,
          diffPercent: undefined,
          cheaperFile: undefined,
          codes: file1OnlyCodes.sort(),
          count: file1OnlyCodes.length,
        });
      }
    });
    
    // Handle file2-only rates
    destination.rateDistribution.file2.forEach(file2Group => {
      const file2OnlyCodes = destination.codes
        .filter(code => 
          code.rate2 === file2Group.rate && 
          (code.rate1 === null || code.rate1 === undefined)
        )
        .map(code => code.dialCode);
      
      if (file2OnlyCodes.length > 0) {
        groups.push({
          file1Rate: undefined,
          file2Rate: file2Group.rate,
          diff: undefined,
          diffPercent: undefined,
          cheaperFile: undefined,
          codes: file2OnlyCodes.sort(),
          count: file2OnlyCodes.length,
        });
      }
    });
    
    // Sort by count (largest groups first)
    return groups.sort((a, b) => b.count - a.count);
  }

  /**
   * Toggles expansion state for a destination
   */
  function toggleDestinationExpansion(destinationKey: string) {
    if (expandedDestinations.value.has(destinationKey)) {
      expandedDestinations.value.delete(destinationKey);
      expandedViews.value.delete(destinationKey);
    } else {
      expandedDestinations.value.add(destinationKey);
      // Default to codes view
      expandedViews.value.set(destinationKey, 'codes');
    }
  }

  /**
   * Sets the expanded view type for a destination
   */
  function setExpandedView(destinationKey: string, viewType: 'codes' | 'rate-groups') {
    expandedDestinations.value.add(destinationKey);
    expandedViews.value.set(destinationKey, viewType);
  }

  /**
   * Expands all destinations
   */
  function expandAll(destinations: GroupedDestination[]) {
    destinations.forEach(dest => {
      expandedDestinations.value.add(dest.destinationKey);
      if (!expandedViews.value.has(dest.destinationKey)) {
        expandedViews.value.set(dest.destinationKey, 'codes');
      }
    });
  }

  /**
   * Collapses all destinations
   */
  function collapseAll() {
    expandedDestinations.value.clear();
    expandedViews.value.clear();
  }

  return {
    // Main functions
    groupByDestination,
    generateRateComparisonGroups,
    
    // State management
    toggleDestinationExpansion,
    setExpandedView,
    expandAll,
    collapseAll,
    
    // State
    expandedDestinations: computed(() => expandedDestinations.value),
    expandedViews: computed(() => expandedViews.value),
    
    // Constants
    GROUPING_THRESHOLD,
  };
}