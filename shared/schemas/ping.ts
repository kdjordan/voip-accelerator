import { z } from 'zod';

export const pingResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  hasLergTable: z.boolean(),
  lergCount: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export type PingResponse = z.infer<typeof pingResponseSchema>;
