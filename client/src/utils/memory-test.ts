/**
 * Memory usage monitoring utility for testing Phase 1 optimizations
 */

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  label: string;
}

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];

  /**
   * Take a memory snapshot with a label
   */
  takeSnapshot(label: string): MemorySnapshot | null {
    if (!performance.memory) {
      console.warn(
        'performance.memory is not available. Run Chrome with --enable-precise-memory-info flag'
      );
      return null;
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      label,
    };

    this.snapshots.push(snapshot);
    console.log(`Memory Snapshot - ${label}:`, {
      usedHeap: `${(snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      totalHeap: `${(snapshot.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      heapLimit: `${(snapshot.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });

    return snapshot;
  }

  /**
   * Compare two snapshots and return the difference
   */
  compareSnapshots(label1: string, label2: string): void {
    const snapshot1 = this.snapshots.find((s) => s.label === label1);
    const snapshot2 = this.snapshots.find((s) => s.label === label2);

    if (!snapshot1 || !snapshot2) {
      console.error('One or both snapshots not found');
      return;
    }

    const heapDiff = snapshot2.usedJSHeapSize - snapshot1.usedJSHeapSize;
    const heapDiffMB = heapDiff / 1024 / 1024;

    console.log(`Memory Difference (${label1} → ${label2}):`, {
      heapDifference: `${heapDiffMB > 0 ? '+' : ''}${heapDiffMB.toFixed(2)} MB`,
      percentChange: `${((heapDiff / snapshot1.usedJSHeapSize) * 100).toFixed(2)}%`,
    });
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Log a summary of all snapshots
   */
  logSummary(): void {
    console.log('=== Memory Usage Summary ===');
    this.snapshots.forEach((snapshot, index) => {
      console.log(
        `${index + 1}. ${snapshot.label}: ${(snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      );
    });

    if (this.snapshots.length >= 2) {
      const first = this.snapshots[0];
      const last = this.snapshots[this.snapshots.length - 1];
      const totalDiff = last.usedJSHeapSize - first.usedJSHeapSize;
      console.log(
        `Total Change: ${totalDiff > 0 ? '+' : ''}${(totalDiff / 1024 / 1024).toFixed(2)} MB`
      );
    }
  }
}

// Export a singleton instance
export const memoryMonitor = new MemoryMonitor();

// Helper to check if an object is reactive
export function isReactive(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  // Vue 3 reactive objects have special symbols
  const reactiveFlags = ['__v_isReactive', '__v_isReadonly', '__v_isShallow', '__v_raw'];

  return reactiveFlags.some((flag) => flag in obj);
}

// Helper to log reactivity status
export function logReactivityStatus(label: string, obj: any): void {
  console.log(`${label} - Reactivity Status:`, {
    isReactive: isReactive(obj),
    isArray: Array.isArray(obj),
    length: Array.isArray(obj) ? obj.length : 'N/A',
    firstItemReactive: Array.isArray(obj) && obj.length > 0 ? isReactive(obj[0]) : 'N/A',
  });
}
