import { useLergStore } from '@/stores/lerg-store';

export interface NPACategorization {
  category: 'US' | 'Others' | 'Unidentified';
  country?: string;
  region?: string;
  countryName?: string;
}

export interface NPABreakdown {
  us: {
    npas: number[];
    count: number;
  };
  others: {
    npas: number[];
    count: number;
    countries: Map<string, { npas: number[]; countryName: string }>;
  };
  unidentified: {
    npas: number[];
    count: number;
  };
  total: number;
}

/**
 * Categorizes an NPA into US, Others (non-US +1), or Unidentified
 */
export function categorizeNPA(npa: number): NPACategorization {
  const lergStore = useLergStore();
  
  // Try to get location from LERG data
  const location = lergStore.getOptimizedLocationByNPA(npa.toString());
  
  if (!location) {
    return {
      category: 'Unidentified'
    };
  }
  
  // If country is US, categorize as US
  if (location.country === 'US') {
    return {
      category: 'US',
      country: location.country,
      region: location.region,
      countryName: 'United States'
    };
  }
  
  // All other countries (Canada, Caribbean, Pacific territories, etc.) are "Others"
  return {
    category: 'Others',
    country: location.country,
    region: location.region,
    countryName: getCountryDisplayName(location.country)
  };
}

/**
 * Categorizes a list of NPAs into US, Others, and Unidentified
 */
export function categorizeNPAList(npas: number[]): NPABreakdown {
  const breakdown: NPABreakdown = {
    us: { npas: [], count: 0 },
    others: { npas: [], count: 0, countries: new Map() },
    unidentified: { npas: [], count: 0 },
    total: npas.length
  };
  
  for (const npa of npas) {
    const categorization = categorizeNPA(npa);
    
    switch (categorization.category) {
      case 'US':
        breakdown.us.npas.push(npa);
        breakdown.us.count++;
        break;
        
      case 'Others':
        breakdown.others.npas.push(npa);
        breakdown.others.count++;
        
        // Group by country
        if (categorization.country && categorization.countryName) {
          const countryKey = categorization.country;
          if (!breakdown.others.countries.has(countryKey)) {
            breakdown.others.countries.set(countryKey, {
              npas: [],
              countryName: categorization.countryName
            });
          }
          breakdown.others.countries.get(countryKey)!.npas.push(npa);
        }
        break;
        
      case 'Unidentified':
        breakdown.unidentified.npas.push(npa);
        breakdown.unidentified.count++;
        break;
    }
  }
  
  // Sort NPAs within each category
  breakdown.us.npas.sort((a, b) => a - b);
  breakdown.others.npas.sort((a, b) => a - b);
  breakdown.unidentified.npas.sort((a, b) => a - b);
  
  // Sort NPAs within each country
  breakdown.others.countries.forEach(country => {
    country.npas.sort((a, b) => a - b);
  });
  
  return breakdown;
}

/**
 * Get display name for country code
 */
function getCountryDisplayName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'CA': 'Canada',
    'AG': 'Antigua and Barbuda',
    'AI': 'Anguilla', 
    'AS': 'American Samoa',
    'BB': 'Barbados',
    'BM': 'Bermuda',
    'BS': 'Bahamas',
    'DM': 'Dominica',
    'DO': 'Dominican Republic',
    'GD': 'Grenada',
    'GU': 'Guam',
    'JM': 'Jamaica',
    'KN': 'Saint Kitts and Nevis',
    'KY': 'Cayman Islands',
    'LC': 'Saint Lucia',
    'MP': 'Northern Mariana Islands',
    'MS': 'Montserrat',
    'NN': 'Non-Geographic',
    'PR': 'Puerto Rico',
    'TC': 'Turks and Caicos Islands',
    'TT': 'Trinidad and Tobago',
    'VC': 'Saint Vincent and the Grenadines',
    'VG': 'British Virgin Islands',
    'VI': 'U.S. Virgin Islands'
  };
  
  return countryNames[countryCode] || countryCode;
}

/**
 * Get coverage percentage for a category
 */
export function calculateCoveragePercentage(categoryCount: number, totalLergCount: number): number {
  if (totalLergCount === 0) return 0;
  return Math.round((categoryCount / totalLergCount) * 100 * 100) / 100; // Round to 2 decimal places
}