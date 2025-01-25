import { LERGRecord } from "@/types/lerg-types";


function processLergData(csvText: string): LERGRecord[] {
    const rows = csvText.trim().split('\n');
    return rows.map(row => {
      const [npanxx, state, npa, nxx] = row.split(',');
      return {
        npanxx: npanxx.trim(),
        state: state.trim(),
        npa: npa.trim(),
        nxx: nxx.trim(),
      };
    });
  }