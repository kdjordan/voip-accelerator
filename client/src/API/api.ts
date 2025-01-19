import type { USReportPayload, USReportResponse } from '@/types/us-types';

export async function makeNpanxxReportsApi(payload: USReportPayload): Promise<USReportResponse> {
  try {
    const response = await fetch('/api/npanxx/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to generate NPANXX reports');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in makeNpanxxReportsApi:', error);
    throw error;
  }
}
