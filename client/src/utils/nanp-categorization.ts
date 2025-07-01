/**
 * Dynamic NANP (North American Numbering Plan) Categorization System
 * 
 * This system provides bulletproof categorization of +1 destinations by:
 * 1. Using LERG data as the primary authoritative source
 * 2. Falling back to constants for gaps
 * 3. Supporting runtime updates via AdminView
 * 4. Handling the "types shitshow" professionally
 */

import { useLergStoreV2, type EnhancedNPARecord } from '@/stores/lerg-store-v2';

export interface NANPCategorization {
  npa: string;
  country: string;
  countryName: string;
  region?: string;
  regionName?: string;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific' | 'unknown';
  source: 'lerg' | 'constants' | 'inferred';
  confidence: 'high' | 'medium' | 'low';
}

export interface NANPRegion {
  code: string;
  name: string;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  npas: string[];
}

export interface NANPSummary {
  totalNPAs: number;
  usDomestic: string[];
  canadian: string[];
  caribbean: string[];
  pacific: string[];
  unknown: string[];
  regions: NANPRegion[];
}

export class NANPCategorizer {
  private static get lergStore() {
    return useLergStoreV2();
  }

  /**
   * Categorize a single NPA using hierarchical data sources
   */
  static categorizeNPA(npa: string | number): NANPCategorization {
    // Convert to string and remove any +1 prefix and validate
    const npaString = npa.toString();
    const cleanNPA = npaString.replace(/^1?(\d{3})$/, '$1');
    if (!/^\d{3}$/.test(cleanNPA)) {
      return this.createUnknownResult(npaString, 'Invalid NPA format');
    }

    // 1. Try LERG data first (most authoritative)
    const lergResult = this.categorizeFromLERG(cleanNPA);
    if (lergResult) {
      return lergResult;
    }

    // 2. Try constants fallback
    const constantsResult = this.categorizeFromConstants(cleanNPA);
    if (constantsResult) return constantsResult;

    // 3. Try intelligent inference based on NPA ranges
    const inferredResult = this.categorizeByInference(cleanNPA);
    if (inferredResult) return inferredResult;

    // 4. Mark as unknown
    return this.createUnknownResult(cleanNPA, 'No categorization found');
  }

  /**
   * Categorize from LERG data (primary source) - now uses enhanced data
   */
  private static categorizeFromLERG(npa: string): NANPCategorization | null {
    // Get enhanced data directly from store
    const enhancedData = this.lergStore.getNPAInfo(npa);
    if (!enhancedData) {
      return null;
    }

    const category = enhancedData.category;
    return {
      npa,
      country: enhancedData.country_code,
      countryName: enhancedData.country_name,
      region: enhancedData.state_province_code,
      regionName: enhancedData.state_province_name,
      category,
      source: 'lerg' as const,
      confidence: 'high' as const
    };
  }

  /**
   * Categorize from constants (fallback)
   */
  private static categorizeFromConstants(npa: string): NANPCategorization | null {
    // Known Caribbean NPAs - check this first since these are most important to detect
    if (this.isKnownCaribbeanNPA(npa)) {
      // Try to get enhanced data first, even in constants fallback
      const enhancedData = this.getEnhancedDataForNPA(npa);
      if (enhancedData) {
        return {
          npa,
          country: enhancedData.country_code,
          countryName: enhancedData.country_name,
          region: enhancedData.state_province_code,
          regionName: enhancedData.state_province_name,
          category: 'caribbean',
          source: 'lerg',
          confidence: 'high'
        };
      }
      
      return {
        npa,
        country: 'CARIBBEAN',
        countryName: 'Caribbean Territory',
        category: 'caribbean',
        source: 'constants',
        confidence: 'medium'
      };
    }

    // Known Pacific NPAs
    if (this.isKnownPacificNPA(npa)) {
      return {
        npa,
        country: 'PACIFIC',
        countryName: 'Pacific Territory',
        category: 'pacific',
        source: 'constants',
        confidence: 'medium'
      };
    }

    // Known US NPAs
    if (this.isKnownUSNPA(npa)) {
      return {
        npa,
        country: 'US',
        countryName: 'United States',
        category: 'us-domestic',
        source: 'constants',
        confidence: 'medium'
      };
    }

    // Known Canadian NPAs
    if (this.isKnownCanadianNPA(npa)) {
      return {
        npa,
        country: 'CA',
        countryName: 'Canada',
        category: 'canadian',
        source: 'constants',
        confidence: 'medium'
      };
    }

    return null;
  }

  /**
   * Categorize by intelligent inference
   */
  private static categorizeByInference(npa: string): NANPCategorization | null {
    const npaNum = parseInt(npa);

    // Caribbean inference (many 8xx codes)
    if (npa.startsWith('8')) {
      return {
        npa,
        country: 'UNKNOWN_CARIBBEAN',
        countryName: 'Caribbean (Unknown)',
        category: 'caribbean',
        source: 'inferred',
        confidence: 'low'
      };
    }

    // Pacific territories inference (some 6xx codes)
    if (npa === '671' || npa === '670') {
      return {
        npa,
        country: 'PACIFIC',
        countryName: 'Pacific Territory',
        category: 'pacific',
        source: 'inferred',
        confidence: 'low'
      };
    }

    return null;
  }

  /**
   * Categorize multiple NPAs and return summary
   */
  static categorizeNPAs(npas: (string | number)[]): NANPSummary {
    const results = npas.map(npa => this.categorizeNPA(npa));
    
    const summary: NANPSummary = {
      totalNPAs: npas.length,
      usDomestic: [],
      canadian: [],
      caribbean: [],
      pacific: [],
      unknown: [],
      regions: []
    };

    // Group by category
    results.forEach(result => {
      switch (result.category) {
        case 'us-domestic':
          summary.usDomestic.push(result.npa);
          break;
        case 'canadian':
          summary.canadian.push(result.npa);
          break;
        case 'caribbean':
          summary.caribbean.push(result.npa);
          break;
        case 'pacific':
          summary.pacific.push(result.npa);
          break;
        default:
          summary.unknown.push(result.npa);
      }
    });

    // Build regions summary
    summary.regions = this.buildRegionsSummary(results);

    return summary;
  }

  /**
   * Check if NPAs are properly categorized (diagnostic tool)
   */
  static validateCategorization(npas: string[]): {
    total: number;
    properly_categorized: number;
    needs_attention: string[];
    confidence_breakdown: Record<string, number>;
  } {
    const results = npas.map(npa => this.categorizeNPA(npa));
    
    const needsAttention = results
      .filter(r => r.confidence === 'low' || r.category === 'unknown')
      .map(r => r.npa);

    const confidenceBreakdown = results.reduce((acc, r) => {
      acc[r.confidence] = (acc[r.confidence] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: npas.length,
      properly_categorized: results.length - needsAttention.length,
      needs_attention: needsAttention,
      confidence_breakdown: confidenceBreakdown
    };
  }

  /**
   * Get all NPAs that need manual addition to LERG
   */
  static getUnknownNPAs(npas: string[]): string[] {
    return npas
      .map(npa => this.categorizeNPA(npa))
      .filter(result => result.source === 'inferred' || result.category === 'unknown')
      .map(result => result.npa);
  }

  // Private helper methods
  private static createUnknownResult(npa: string, reason: string): NANPCategorization {
    return {
      npa,
      country: 'UNKNOWN',
      countryName: `Unknown (${reason})`,
      category: 'unknown',
      source: 'inferred',
      confidence: 'low'
    };
  }

  private static determineCategory(countryCode: string): NANPCategorization['category'] {
    switch (countryCode.toUpperCase()) {
      case 'US':
        return 'us-domestic';
      case 'CA':
        return 'canadian';
      case 'AS': case 'GU': case 'MP': // Pacific territories
        return 'pacific';
      default:
        // Most other NANP countries are Caribbean
        return 'caribbean';
    }
  }

  /**
   * Get enhanced data for an NPA directly from the store
   */
  private static getEnhancedDataForNPA(npa: string): EnhancedNPARecord | null {
    return this.lergStore.getNPAInfo(npa);
  }

  /**
   * Get country display name from enhanced store data
   */
  private static getCountryDisplayNameFromStore(countryCode: string): string {
    return this.lergStore.getCountryName(countryCode);
  }

  /**
   * Get region display name from enhanced store data
   */
  private static getRegionDisplayNameFromStore(regionCode: string, countryCode: string): string {
    return this.lergStore.getStateName(regionCode);
  }

  private static isKnownUSNPA(npa: string): boolean {
    // Basic US NPA patterns - primary data should come from Supabase
    // This is only for emergency fallback when LERG/Supabase data is unavailable
    const basicUSPatterns = ['201', '212', '213', '214', '215', '216', '217', '305', '310', '312', '313', '404', '415', '510', '718', '773', '917'];
    return basicUSPatterns.includes(npa);
  }

  private static isKnownCanadianNPA(npa: string): boolean {
    // Basic Canadian NPA patterns - primary data should come from Supabase
    const basicCanadianPatterns = ['204', '403', '416', '418', '450', '514', '604', '613', '705', '780', '902', '905'];
    return basicCanadianPatterns.includes(npa);
  }

  private static isKnownCaribbeanNPA(npa: string): boolean {
    // Basic Caribbean patterns - primary data should come from Supabase
    const basicCaribbeanPatterns = ['242', '246', '264', '268', '284', '340', '441', '649', '664', '721', '758', '767', '784', '787', '809', '829', '849', '868', '869', '876', '939', '987'];
    return basicCaribbeanPatterns.includes(npa);
  }

  private static isKnownPacificNPA(npa: string): boolean {
    // Pacific territory NPAs
    const pacificNPAs = ['670', '671', '684'];
    return pacificNPAs.includes(npa);
  }

  private static buildRegionsSummary(results: NANPCategorization[]): NANPRegion[] {
    const regionMap = new Map<string, NANPRegion>();

    results.forEach(result => {
      if (result.country === 'UNKNOWN') {
        return;
      }

      const key = `${result.country}-${result.category}`;
      if (!regionMap.has(key)) {
        regionMap.set(key, {
          code: result.country,
          name: result.countryName,
          category: result.category,
          npas: []
        });
      }
      regionMap.get(key)!.npas.push(result.npa);
    });

    return Array.from(regionMap.values());
  }
}

/**
 * Integration with existing +1 detection
 */
export function enhancePlusOneDetection(analysisResult: any): any {
  // Enhance existing detection with better categorization
  const enhancedBreakdown = {
    usNPAs: [] as string[],
    canadianNPAs: [] as string[],
    caribbeanNPAs: [] as string[],
    pacificNPAs: [] as string[],
    unknownNPAs: [] as string[]
  };

  // Re-categorize using our bulletproof system
  const allNPAs = [
    ...analysisResult.plusOneBreakdown.usNPAs,
    ...analysisResult.plusOneBreakdown.canadianNPAs,
    ...analysisResult.plusOneBreakdown.caribbeanNPAs,
    ...analysisResult.plusOneBreakdown.unknownNPAs
  ];

  allNPAs.forEach(npa => {
    const categorization = NANPCategorizer.categorizeNPA(npa);
    switch (categorization.category) {
      case 'us-domestic':
        enhancedBreakdown.usNPAs.push(npa);
        break;
      case 'canadian':
        enhancedBreakdown.canadianNPAs.push(npa);
        break;
      case 'caribbean':
        enhancedBreakdown.caribbeanNPAs.push(npa);
        break;
      case 'pacific':
        enhancedBreakdown.pacificNPAs.push(npa);
        break;
      default:
        enhancedBreakdown.unknownNPAs.push(npa);
    }
  });

  return {
    ...analysisResult,
    enhancedBreakdown,
    categorizationQuality: NANPCategorizer.validateCategorization(allNPAs)
  };
}