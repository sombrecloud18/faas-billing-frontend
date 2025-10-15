// src/api/client.ts
import axios from 'axios';
import { getToken } from '../utils/auth';

const DEMO = (import.meta.env.VITE_DEMO_AUTH ?? 'false') === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const http = axios.create({ baseURL: BASE_URL });

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  async login(email: string, password: string): Promise<{ token: string; role: 'admin' | 'client' }> {
    if (DEMO) {
      if (email === 'admin@demo.io' && password === 'admin123') return { token: 'demo-admin-token', role: 'admin' };
      if (email === 'client@demo.io' && password === 'client123') return { token: 'demo-client-token', role: 'client' };
      throw new Error('Invalid demo credentials');
    }
    const { data } = await http.post('/auth/login', { email, password });
    return data;
  },

  async adminMetrics(): Promise<any> {
    if (DEMO) {
      return {
        summary: { totalCost: 123.45, period: 'last_24h' },
        topFunctions: [
          { name: 'image-resize', cost: 45.6, invocations: 3200 },
          { name: 'etl-transform', cost: 31.2, invocations: 1800 },
        ],
        usageSeries: Array.from({ length: 24 }, (_, i) => ({
          ts: `${String(i).padStart(2, '0')}:00`,
          invocations: Math.floor(100 + 60 * Math.sin(i / 3) + Math.random() * 30),
          cost: Math.max(0, 5 + 2 * Math.sin(i / 4) + Math.random()),
        })),
      };
    }
    const { data } = await http.get('/admin/metrics');
    return data;
  },

  async clientUsage(): Promise<any> {
    if (DEMO) {
      return {
        summary: { totalCost: 17.9, period: 'last_24h' },
        functions: [{ name: 'image-resize', plan: 'default' }],
        usageSeries: Array.from({ length: 24 }, (_, i) => ({
          ts: `${String(i).padStart(2, '0')}:00`,
          invocations: Math.floor(40 + 20 * Math.sin(i / 3) + Math.random() * 10),
          durationP95ms: Math.floor(120 + 40 * Math.sin(i / 5)),
          coldStarts: Math.max(0, Math.floor(1 + Math.sin(i / 6))),
        })),
      };
    }
    const { data } = await http.get('/client/usage');
    return data;
  },
};