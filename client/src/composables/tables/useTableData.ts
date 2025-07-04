import { ref, computed, watch, Ref, ComputedRef } from 'vue';
import Dexie from 'dexie';
import type { DexieDBBase } from '@/composables/useDexieDB';
import useDexieDB from '@/composables/useDexieDB';
import type { DBNameType } from '@/types/app-types';

// Configuration interface for the composable
export interface UseTableDataConfig<T> {
  dbName: DBNameType;
  tableName: string;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  debounceMs?: number;
  tableHeaders?: {
    key: string;
    label: string;
    sortable: boolean;
    textAlign?: string;
    getValue?: (record: T) => any;
  }[];
}

// Filter function type
export type FilterFunction<T> = (record: T) => boolean;

// Return type for the composable
export interface UseTableDataReturn<T> {
  // Data
  displayedData: Ref<T[]>;
  totalFilteredItems: Ref<number>;

  // Loading states
  isDataLoading: Ref<boolean>;
  isFiltering: Ref<boolean>;
  isPageLoading: Ref<boolean>;

  // Error handling
  dataError: Ref<string | null>;

  // Pagination
  currentPage: Ref<number>;
  itemsPerPage: Ref<number>;
  itemsPerPageOptions: Ref<number[]>;
  totalPages: ComputedRef<number>;
  canGoToPreviousPage: ComputedRef<boolean>;
  canGoToNextPage: ComputedRef<boolean>;
  directPageInput: Ref<string | number>;

  // Sorting
  currentSortKey: Ref<string>;
  currentSortDirection: Ref<'asc' | 'desc'>;

  // Methods
  initializeDB: () => Promise<boolean>;
  fetchPageData: (
    pageNumber: number,
    filters?: FilterFunction<T>[]
  ) => Promise<{ data: T[]; totalMatchingRecords: number }>;
  resetPaginationAndLoad: (filters?: FilterFunction<T>[]) => Promise<void>;
  goToPage: (page: number, filters?: FilterFunction<T>[]) => Promise<void>;
  goToFirstPage: (filters?: FilterFunction<T>[]) => Promise<void>;
  goToPreviousPage: (filters?: FilterFunction<T>[]) => Promise<void>;
  goToNextPage: (filters?: FilterFunction<T>[]) => Promise<void>;
  goToLastPage: (filters?: FilterFunction<T>[]) => Promise<void>;
  handleDirectPageInput: (filters?: FilterFunction<T>[]) => Promise<void>;
  applySort: (data: T[], sortKey: string, sortDirection: 'asc' | 'desc') => T[];

  // DB instance (exposed for advanced use cases)
  dbInstance: Ref<DexieDBBase | null>;
}

// Minimum time (in ms) the filtering overlay should be displayed
const MIN_FILTER_DISPLAY_TIME = 400;

export function useTableData<T extends Record<string, any>>(
  config: UseTableDataConfig<T>
): UseTableDataReturn<T> {
  const {
    dbName,
    tableName,
    itemsPerPage: defaultItemsPerPage = 100,
    itemsPerPageOptions: defaultItemsPerPageOptions = [25, 50, 100, 250, 500],
    sortKey: defaultSortKey = '',
    sortDirection: defaultSortDirection = 'asc',
    debounceMs = 300,
  } = config;

  // Get DB utilities
  const { getDB } = useDexieDB();

  // State
  const dbInstance = ref<DexieDBBase | null>(null);
  const displayedData = ref<T[]>([]) as Ref<T[]>;
  const totalFilteredItems = ref(0);

  // Loading states
  const isDataLoading = ref(false);
  const isFiltering = ref(false);
  const isPageLoading = ref(false);

  // Error handling
  const dataError = ref<string | null>(null);

  // Pagination state
  const currentPage = ref(1);
  const itemsPerPage = ref(defaultItemsPerPage);
  const itemsPerPageOptions = ref(defaultItemsPerPageOptions);
  const directPageInput = ref<string | number>(1);

  // Sorting state
  const currentSortKey = ref(defaultSortKey);
  const currentSortDirection = ref<'asc' | 'desc'>(defaultSortDirection);

  // Computed properties
  const totalPages = computed(() => {
    if (totalFilteredItems.value === 0) return 1;
    return Math.ceil(totalFilteredItems.value / itemsPerPage.value);
  });

  const canGoToPreviousPage = computed(() => currentPage.value > 1);
  const canGoToNextPage = computed(() => currentPage.value < totalPages.value);

  // Watch for current page changes to sync direct input
  watch(currentPage, (newPage) => {
    directPageInput.value = newPage;
  });

  // Initialize database connection
  async function initializeDB(): Promise<boolean> {
    if (dbInstance.value) return true;

    try {
      dbInstance.value = await getDB(dbName);
      if (!dbInstance.value || !dbInstance.value.tables.some((t) => t.name === tableName)) {
        dataError.value = `Table '${tableName}' not found in database '${dbName}'.`;
        displayedData.value = [];
        totalFilteredItems.value = 0;
        return false;
      }
      dataError.value = null;
      return true;
    } catch (err: any) {
      dataError.value = err.message || 'Failed to connect to the database';
      displayedData.value = [];
      totalFilteredItems.value = 0;
      return false;
    }
  }

  // Apply client-side sorting
  function applySort(data: T[], sortKey: string, sortDirection: 'asc' | 'desc'): T[] {
    if (!sortKey) return data;

    // Find the header configuration for this sort key
    const header = config.tableHeaders?.find((h) => h.key === sortKey);

    return [...data].sort((a, b) => {
      // Use getValue function if available in header config
      const valA = header?.getValue ? header.getValue(a) : (a as any)[sortKey];
      const valB = header?.getValue ? header.getValue(b) : (b as any)[sortKey];
      let comparison = 0;

      if (valA === null || valA === undefined) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valB === null || valB === undefined) {
        return sortDirection === 'asc' ? 1 : -1;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }

      return sortDirection === 'asc' ? comparison : comparison * -1;
    });
  }

  // Fetch page data with filters
  async function fetchPageData(
    pageNumber: number,
    filters: FilterFunction<T>[] = []
  ): Promise<{ data: T[]; totalMatchingRecords: number }> {
    dataError.value = null;
    isDataLoading.value = true;

    try {
      if (!dbInstance.value) {
        throw new Error('Database not initialized');
      }

      const table = dbInstance.value.table<T>(tableName);
      let query: Dexie.Collection<T, any> = table.toCollection();

      // Apply filters
      if (filters.length > 0) {
        query = query.filter((record) => filters.every((fn) => fn(record)));
      }

      // Get total count before pagination
      const totalMatchingRecords = await query.count();

      // Check if current sort column has a getValue function
      const header = config.tableHeaders?.find((h) => h.key === currentSortKey.value);
      const shouldUseClientSort = header?.getValue !== undefined;

      // Try to apply DB-level sorting if possible and no getValue function exists
      let dbSortApplied = false;
      if (
        currentSortKey.value &&
        !shouldUseClientSort &&
        typeof (query as any).orderBy === 'function'
      ) {
        try {
          query = (query as any).orderBy(currentSortKey.value);
          if (currentSortDirection.value === 'desc') {
            query = query.reverse();
          }
          dbSortApplied = true;
        } catch (sortError) {
          dbSortApplied = false;
        }
      }

      // For getValue columns or if DB sort failed, get all matching records for client-side sort
      let pageData: T[];
      if (shouldUseClientSort) {
        // Get all matching records
        const allMatchingData = await query.toArray();
        // Sort all records
        const sortedData = applySort(
          allMatchingData,
          currentSortKey.value,
          currentSortDirection.value
        );
        // Apply pagination in memory
        const start = (pageNumber - 1) * itemsPerPage.value;
        pageData = sortedData.slice(start, start + itemsPerPage.value);
      } else {
        // Apply regular pagination for DB-sorted data
        const offset = (pageNumber - 1) * itemsPerPage.value;
        pageData = await query.offset(offset).limit(itemsPerPage.value).toArray();

        // Apply client-side sort if DB sort wasn't applied
        if (!dbSortApplied && currentSortKey.value) {
          pageData = applySort(pageData, currentSortKey.value, currentSortDirection.value);
        }
      }

      // Update state
      displayedData.value = pageData;
      totalFilteredItems.value = totalMatchingRecords;

      return { data: pageData, totalMatchingRecords };
    } catch (err: any) {
      dataError.value = err.message || 'Failed to load data';
      totalFilteredItems.value = 0;
      return { data: [], totalMatchingRecords: 0 };
    } finally {
      isDataLoading.value = false;
    }
  }

  // Reset pagination and load data
  async function resetPaginationAndLoad(filters: FilterFunction<T>[] = []): Promise<void> {
    const startTime = performance.now();
    isFiltering.value = true;

    currentPage.value = 1;
    dataError.value = null;

    const dbReady = await initializeDB();
    if (dbReady && dbInstance.value) {
      try {
        await fetchPageData(1, filters);
      } catch (fetchError) {
        dataError.value = (fetchError as Error).message || 'Failed to fetch initial data.';
      }
    } else {
      totalFilteredItems.value = 0;
      displayedData.value = [];
      if (!dbReady && !dataError.value) {
        dataError.value = 'Database not available.';
      }
    }

    // Ensure minimum display time for filtering overlay
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const remainingTime = MIN_FILTER_DISPLAY_TIME - elapsedTime;

    if (remainingTime > 0) {
      setTimeout(() => {
        isFiltering.value = false;
      }, remainingTime);
    } else {
      isFiltering.value = false;
    }
  }

  // Pagination navigation functions
  async function goToPage(page: number, filters: FilterFunction<T>[] = []): Promise<void> {
    const startTime = performance.now();
    isFiltering.value = true;

    const targetPage = Math.max(1, Math.min(page, totalPages.value || 1));
    if (currentPage.value !== targetPage) {
      currentPage.value = targetPage;
      await fetchPageData(currentPage.value, filters);
    }
    directPageInput.value = currentPage.value;

    // Ensure minimum display time for filtering overlay
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const remainingTime = MIN_FILTER_DISPLAY_TIME - elapsedTime;

    if (remainingTime > 0) {
      setTimeout(() => {
        isFiltering.value = false;
      }, remainingTime);
    } else {
      isFiltering.value = false;
    }
  }

  async function goToFirstPage(filters: FilterFunction<T>[] = []): Promise<void> {
    await goToPage(1, filters);
  }

  async function goToPreviousPage(filters: FilterFunction<T>[] = []): Promise<void> {
    if (canGoToPreviousPage.value) {
      await goToPage(currentPage.value - 1, filters);
    }
  }

  async function goToNextPage(filters: FilterFunction<T>[] = []): Promise<void> {
    if (canGoToNextPage.value) {
      await goToPage(currentPage.value + 1, filters);
    }
  }

  async function goToLastPage(filters: FilterFunction<T>[] = []): Promise<void> {
    await goToPage(totalPages.value, filters);
  }

  async function handleDirectPageInput(filters: FilterFunction<T>[] = []): Promise<void> {
    const pageNum = parseInt(String(directPageInput.value), 10);
    if (!isNaN(pageNum)) {
      await goToPage(pageNum, filters);
    } else {
      directPageInput.value = currentPage.value;
    }
  }

  return {
    // Data
    displayedData,
    totalFilteredItems,

    // Loading states
    isDataLoading,
    isFiltering,
    isPageLoading,

    // Error handling
    dataError,

    // Pagination
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    totalPages,
    canGoToPreviousPage,
    canGoToNextPage,
    directPageInput,

    // Sorting
    currentSortKey,
    currentSortDirection,

    // Methods
    initializeDB,
    fetchPageData,
    resetPaginationAndLoad,
    goToPage,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    handleDirectPageInput,
    applySort,

    // DB instance
    dbInstance,
  };
}
