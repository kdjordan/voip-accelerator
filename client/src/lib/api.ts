import { hc } from 'hono/client';
import type { AppType } from '@voip-accelerator/server';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

export const api = hc<AppType>(baseURL);
export type Api = typeof api;
