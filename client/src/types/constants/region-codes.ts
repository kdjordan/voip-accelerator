import { PROVINCE_CODES, ProvinceMapping } from './province-codes';
import { STATE_CODES, StateMapping } from './state-codes';

export type RegionCode = keyof typeof STATE_CODES | keyof typeof PROVINCE_CODES;
export type RegionType = 'US' | 'CA' | 'OTHER';

export interface RegionInfo extends StateMapping, ProvinceMapping {
  code: RegionCode;
  type: RegionType;
}

// Combined array of all region codes for easy iteration
export const US_REGION_CODES = Object.keys(STATE_CODES) as Array<keyof typeof STATE_CODES>;
export const CA_REGION_CODES = Object.keys(PROVINCE_CODES) as Array<keyof typeof PROVINCE_CODES>;

// Utility function to get region info
export function getRegionInfo(code: string, country?: RegionType): RegionInfo | null {
  if (
    country === 'CA' ||
    (!country && CA_REGION_CODES.includes(code as keyof typeof PROVINCE_CODES))
  ) {
    const province = PROVINCE_CODES[code as keyof typeof PROVINCE_CODES];
    return province
      ? {
          code: code as RegionCode,
          type: 'CA',
          ...province,
        }
      : null;
  }

  const state = STATE_CODES[code as keyof typeof STATE_CODES];
  return state
    ? {
        code: code as RegionCode,
        type: 'US',
        ...state,
      }
    : null;
}

// Utility function to get region name
export function getRegionName(code: string, country?: RegionType): string {
  const info = getRegionInfo(code, country);
  return info?.name ?? code;
}

// Utility function to get region type (US or CA)
export function getRegionType(code: string): RegionType | null {
  if (US_REGION_CODES.includes(code as keyof typeof STATE_CODES)) return 'US';
  if (CA_REGION_CODES.includes(code as keyof typeof PROVINCE_CODES)) return 'CA';
  return null;
}

// Utility function to get region codes by type
export function getRegionCodesByType(type: RegionType): string[] {
  return type === 'US' ? US_REGION_CODES : CA_REGION_CODES;
}

// Utility function to group region codes by type
export function groupRegionCodes(codes: string[]): Record<RegionType, string[]> {
  return codes.reduce(
    (acc, code) => {
      let type = getRegionType(code);
      // If not US or CA, classify as OTHER
      if (!type) {
        type = 'OTHER';
      }
      acc[type] = [...(acc[type] || []), code];
      return acc;
    },
    { US: [], CA: [], OTHER: [] } as Record<RegionType, string[]>
  );
}

// Utility function to sort region codes by name within their groups
export function sortRegionCodesByName(codes: string[]): string[] {
  return codes.sort((a, b) => {
    const aInfo = getRegionInfo(a);
    const bInfo = getRegionInfo(b);

    // Sort by type first (US before CA)
    if (aInfo?.type !== bInfo?.type) {
      return aInfo?.type === 'US' ? -1 : 1;
    }

    // Then sort by name within each type
    return (aInfo?.name ?? a).localeCompare(bInfo?.name ?? b);
  });
}

// Export existing constants for backward compatibility
export { STATE_CODES, PROVINCE_CODES };
export type { StateMapping, ProvinceMapping };
