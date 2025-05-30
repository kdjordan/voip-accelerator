// Table Sorter Worker
interface SerializableRate {
  rate: number;
  count: number;
  percentage: number;
  isCommon: boolean;
}

interface SerializableGroupData {
  destinationName: string;
  codes: string[];
  rates: SerializableRate[];
  hasDiscrepancy: boolean;
  changeCode: string;
  effectiveDate: string;
  minDuration?: string;
  increments?: string;
}

interface SortMessage {
  data: SerializableGroupData[];
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  selectedRates: Record<string, number>;
}

self.onmessage = (e: MessageEvent) => {
  try {
    const { data, sortKey, sortDirection, selectedRates } = e.data as SortMessage;
    const direction = sortDirection === 'asc' ? 1 : -1;

    // Create a new array to avoid mutating the original
    const sortedData = [...data];

    // Sort function
    sortedData.sort((a, b) => {
      try {
        let valA: any, valB: any;

        // Special handling for display rate
        if (sortKey === 'displayRate') {
          if (a.hasDiscrepancy) {
            valA =
              selectedRates[a.destinationName] ??
              a.rates.find((r) => r.isCommon)?.rate ??
              a.rates[0]?.rate ??
              -Infinity;
          } else {
            valA = a.rates[0]?.rate ?? -Infinity;
          }

          if (b.hasDiscrepancy) {
            valB =
              selectedRates[b.destinationName] ??
              b.rates.find((r) => r.isCommon)?.rate ??
              b.rates[0]?.rate ??
              -Infinity;
          } else {
            valB = b.rates[0]?.rate ?? -Infinity;
          }
        } else if (sortKey === 'codesCount') {
          valA = a.codes.length;
          valB = b.codes.length;
        } else {
          valA = (a as any)[sortKey];
          valB = (b as any)[sortKey];
        }

        // Handle invalid values
        if (valA === null || valA === undefined) valA = -Infinity;
        if (valB === null || valB === undefined) valB = -Infinity;

        // Type-specific comparisons
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * direction;
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * direction;
        }
        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
      } catch (error) {
        console.error('Error in sort comparison:', error);
        return 0;
      }
    });

    // Post sorted data back
    self.postMessage(sortedData);
  } catch (error) {
    console.error('Error in worker:', error);
    self.postMessage(data); // Send back original data if sort fails
  }
};
