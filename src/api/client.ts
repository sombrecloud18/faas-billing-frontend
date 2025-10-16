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

 // src/api/client.ts (фрагмент adminMetrics в DEMO)
async adminMetrics(): Promise<any> {
  if (DEMO) {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const series = hours.map((ts, i) => ({
      ts,
      invocations: Math.floor(80 + 50 * Math.sin(i / 3) + Math.random() * 20),
      durationP95ms: Math.floor(140 + 60 * Math.sin(i / 4) + Math.random() * 10),
      coldStarts: Math.max(0, Math.floor(2 + Math.sin(i / 6))),
      cpuCoreMs: Math.floor(600 + 200 * Math.sin(i / 5) + Math.random() * 100), 
      ramMbSec: Math.floor(5000 + 1500 * Math.sin(i / 5) + Math.random() * 300), 
      cost: Math.max(0, 5 + 2 * Math.sin(i / 4) + Math.random()),
    }));

    const sum = <K extends keyof typeof series[number]>(k: K) => series.reduce((s, p) => s + (p[k] as number), 0);
    const avg = (v: number) => v / series.length;
    const byFunction = ['image-resize', 'etl-transform', 'thumb-gen', 'pdf-parse'].map((name, idx) => {
      const fSeries = hours.map((ts, i) => ({
        ts,
        invocations: Math.floor(20 + 15 * Math.sin((i + idx) / 3) + Math.random() * 8),
        durationP95ms: Math.floor(120 + 40 * Math.sin((i + idx) / 5) + Math.random() * 10),
        coldStarts: Math.max(0, Math.floor(1 + Math.sin((i + idx) / 6))),
        cpuCoreMs: Math.floor(150 + 80 * Math.sin((i + idx) / 4) + Math.random() * 30),
        ramMbSec: Math.floor(1200 + 400 * Math.sin((i + idx) / 4) + Math.random() * 50),
      }));
      const sumF = <K extends keyof typeof fSeries[number]>(k: K) => fSeries.reduce((s, p) => s + (p[k] as number), 0);
      const cost = +(sumF('invocations') * 0.01 + sumF('durationP95ms') * 0.00001 + sumF('ramMbSec') * 0.000001 + sumF('coldStarts') * 0.1).toFixed(2);
      return {
        name,
        totals: {
          invocations: sumF('invocations'),
          durationP95ms: Math.round(sumF('durationP95ms') / fSeries.length),
          coldStarts: sumF('coldStarts'),
          cpuCoreMs: sumF('cpuCoreMs'),
          ramMbSec: sumF('ramMbSec'),
          cost,
        },
        series: fSeries,
      };
    });

    return {
      summary: {
        period: 'last_24h',
        avgRamMbSec: Math.round(avg(sum('ramMbSec'))),
        avgCpuCoreMs: Math.round(avg(sum('cpuCoreMs'))),
        avgInvocations: Math.round(avg(sum('invocations'))),
        avgDurationP95ms: Math.round(avg(sum('durationP95ms'))),
        avgColdStarts: Math.round(avg(sum('coldStarts'))),
      },
      hourly: series,
      byFunction,
    };
  }
  const { data } = await http.get('/admin/metrics');
  return data;
    },

  // src/api/client.ts (фрагмент clientUsage в DEMO)
async clientUsage(): Promise<any> {
  if (DEMO) {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const series = hours.map((ts, i) => ({
      ts,
      invocations: Math.floor(60 + 40 * Math.sin(i / 3) + Math.random() * 15),
      durationP95ms: Math.floor(130 + 50 * Math.sin(i / 4) + Math.random() * 10),
      coldStarts: Math.max(0, Math.floor(1 + Math.sin(i / 6))),
      cpuCoreMs: Math.floor(450 + 180 * Math.sin(i / 5) + Math.random() * 80),
      ramMbSec: Math.floor(3800 + 1200 * Math.sin(i / 5) + Math.random() * 250),
      cost: Math.max(0, 3 + 1.5 * Math.sin(i / 4) + Math.random()),
    }));
    const sum = <K extends keyof typeof series[number]>(k: K) => series.reduce((s, p) => s + (p[k] as number), 0);
    const avg = (v: number) => v / series.length;

    const byFunction = ['image-resize', 'etl-transform'].map((name, idx) => {
      const fSeries = hours.map((ts, i) => ({
        ts,
        invocations: Math.floor(15 + 12 * Math.sin((i + idx) / 3) + Math.random() * 6),
        durationP95ms: Math.floor(110 + 35 * Math.sin((i + idx) / 5) + Math.random() * 8),
        coldStarts: Math.max(0, Math.floor(1 + Math.sin((i + idx) / 6))),
        cpuCoreMs: Math.floor(120 + 60 * Math.sin((i + idx) / 4) + Math.random() * 25),
        ramMbSec: Math.floor(900 + 350 * Math.sin((i + idx) / 4) + Math.random() * 40),
      }));
      const sumF = <K extends keyof typeof fSeries[number]>(k: K) => fSeries.reduce((s, p) => s + (p[k] as number), 0);
      const cost = +(sumF('invocations') * 0.01 + sumF('durationP95ms') * 0.00001 + sumF('ramMbSec') * 0.000001 + sumF('coldStarts') * 0.1).toFixed(2);
      return {
        name,
        plan: idx ? 'default' : 'gold',
        totals: {
          invocations: sumF('invocations'),
          durationP95ms: Math.round(sumF('durationP95ms') / fSeries.length),
          coldStarts: sumF('coldStarts'),
          cpuCoreMs: sumF('cpuCoreMs'),
          ramMbSec: sumF('ramMbSec'),
          cost,
        },
        series: fSeries,
      };
    });

    return {
      summary: {
        period: 'last_24h',
        avgRamMbSec: Math.round(avg(sum('ramMbSec'))),
        avgCpuCoreMs: Math.round(avg(sum('cpuCoreMs'))),
        avgInvocations: Math.round(avg(sum('invocations'))),
        avgDurationP95ms: Math.round(avg(sum('durationP95ms'))),
        avgColdStarts: Math.round(avg(sum('coldStarts'))),
        debtRub: 256.70,
        // Новые поля для детализации долга
        yesterdayCost: 125.40, // тариф за вчера
        todayCost: 45.80,      // тариф на данный момент (с 00:00 до нынешнего времени)
        totalDebt: 427.90      // общий долг
      },
      hourly: series,
      byFunction,
    };
  }
  const { data } = await http.get('/client/usage');
  return data;
},

  async requestDetailization(startDate: string, endDate: string): Promise<{ success: boolean; message: string }> {
    if (DEMO) {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Запрос на детализацию отправлен' };
    }
    const { data } = await http.post('/client/detailization', { startDate, endDate });
    return data;
  },

  // Админские API методы
  async getUsers(): Promise<{ users: Array<{ id: string; email: string; role: 'admin' | 'client' }> }> {
    if (DEMO) {
      return {
        users: [
          { id: '1', email: 'client1@example.com', role: 'client' },
          { id: '2', email: 'client2@example.com', role: 'client' },
          { id: '3', email: 'client3@example.com', role: 'client' },
          { id: '4', email: 'admin@demo.io', role: 'admin' }
        ]
      };
    }
    const { data } = await http.get('/admin/users');
    return data;
  },

  async getUserUsage(userId: string): Promise<any> {
    if (DEMO) {
      // Возвращаем данные пользователя (аналогично clientUsage, но с разными данными)
      const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
      const series = hours.map((ts, i) => ({
        ts,
        invocations: Math.floor(40 + 30 * Math.sin(i / 3) + Math.random() * 10),
        durationP95ms: Math.floor(120 + 40 * Math.sin(i / 4) + Math.random() * 8),
        coldStarts: Math.max(0, Math.floor(Math.sin(i / 6))),
        cpuCoreMs: Math.floor(300 + 120 * Math.sin(i / 5) + Math.random() * 50),
        ramMbSec: Math.floor(2500 + 800 * Math.sin(i / 5) + Math.random() * 150),
        cost: Math.max(0, 2 + 1 * Math.sin(i / 4) + Math.random() * 0.5),
      }));

      const sum = <K extends keyof typeof series[number]>(k: K) => series.reduce((s, p) => s + (p[k] as number), 0);
      const avg = (v: number) => v / series.length;

      const byFunction = ['user-function-1', 'user-function-2'].map((name, idx) => {
        const fSeries = hours.map((ts, i) => ({
          ts,
          invocations: Math.floor(10 + 8 * Math.sin((i + idx) / 3) + Math.random() * 4),
          durationP95ms: Math.floor(100 + 25 * Math.sin((i + idx) / 5) + Math.random() * 6),
          coldStarts: Math.max(0, Math.floor(Math.sin((i + idx) / 6))),
          cpuCoreMs: Math.floor(80 + 40 * Math.sin((i + idx) / 4) + Math.random() * 15),
          ramMbSec: Math.floor(600 + 200 * Math.sin((i + idx) / 4) + Math.random() * 30),
        }));
        const sumF = <K extends keyof typeof fSeries[number]>(k: K) => fSeries.reduce((s, p) => s + (p[k] as number), 0);
        const cost = +(sumF('invocations') * 0.01 + sumF('durationP95ms') * 0.00001 + sumF('ramMbSec') * 0.000001 + sumF('coldStarts') * 0.1).toFixed(2);
        return {
          name,
          plan: idx ? 'default' : 'silver',
          totals: {
            invocations: sumF('invocations'),
            durationP95ms: Math.round(sumF('durationP95ms') / fSeries.length),
            coldStarts: sumF('coldStarts'),
            cpuCoreMs: sumF('cpuCoreMs'),
            ramMbSec: sumF('ramMbSec'),
            cost,
          },
          series: fSeries,
        };
      });

      return {
        summary: {
          period: 'last_24h',
          avgRamMbSec: Math.round(avg(sum('ramMbSec'))),
          avgCpuCoreMs: Math.round(avg(sum('cpuCoreMs'))),
          avgInvocations: Math.round(avg(sum('invocations'))),
          avgDurationP95ms: Math.round(avg(sum('durationP95ms'))),
          avgColdStarts: Math.round(avg(sum('coldStarts'))),
          debtRub: 128.35,
          yesterdayCost: 62.70,
          todayCost: 22.90,
          totalDebt: 213.95
        },
        hourly: series,
        byFunction,
      };
    }
    const { data } = await http.get(`/admin/users/${userId}/usage`);
    return data;
  },

  async getUserTariff(userId: string): Promise<{ 
    tariff: { 
      id: string; 
      name: string; 
      invocationsPrice: number; 
      durationPrice: number; 
      cpuPrice: number; 
      ramPrice: number; 
      coldStartPrice: number; 
      isDefault: boolean; 
    } 
  }> {
    if (DEMO) {
      // Разные тарифы для разных пользователей
      const tariffs = [
        {
          id: 'default',
          name: 'Стандартный тариф',
          invocationsPrice: 0.01,
          durationPrice: 0.00001,
          cpuPrice: 0.000001,
          ramPrice: 0.000001,
          coldStartPrice: 0.1,
          isDefault: true
        },
        {
          id: 'premium',
          name: 'Премиум тариф',
          invocationsPrice: 0.008,
          durationPrice: 0.000008,
          cpuPrice: 0.0000008,
          ramPrice: 0.0000005,
          coldStartPrice: 0.08,
          isDefault: false
        },
        {
          id: 'basic',
          name: 'Базовый тариф',
          invocationsPrice: 0.012,
          durationPrice: 0.000012,
          cpuPrice: 0.0000012,
          ramPrice: 0.0000015,
          coldStartPrice: 0.12,
          isDefault: false
        }
      ];
      
      // Выбираем тариф в зависимости от userId
      const tariffIndex = parseInt(userId) % tariffs.length;
      return { tariff: tariffs[tariffIndex] };
    }
    const { data } = await http.get(`/admin/users/${userId}/tariff`);
    return data;
  },

  async getDetailizationRequests(): Promise<{ requests: Array<{ id: string; userId: string; userEmail: string; startDate: string; endDate: string; status: 'pending' | 'processing' | 'completed'; createdAt: string }> }> {
    if (DEMO) {
      return {
        requests: [
          {
            id: '1',
            userId: '1',
            userEmail: 'client1@example.com',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            status: 'pending',
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            userId: '2',
            userEmail: 'client2@example.com',
            startDate: '2024-01-10',
            endDate: '2024-01-20',
            status: 'processing',
            createdAt: '2024-01-16T14:15:00Z'
          },
          {
            id: '3',
            userId: '3',
            userEmail: 'client3@example.com',
            startDate: '2024-01-05',
            endDate: '2024-01-25',
            status: 'completed',
            createdAt: '2024-01-14T09:45:00Z'
          }
        ]
      };
    }
    const { data } = await http.get('/admin/detailization-requests');
    return data;
  },

  // API методы для тарифов
  async getCurrentTariff(): Promise<{ 
    tariff: { 
      id: string; 
      name: string; 
      invocationsPrice: number; 
      durationPrice: number; 
      cpuPrice: number; 
      ramPrice: number; 
      coldStartPrice: number; 
      isDefault: boolean; 
    } 
  }> {
    if (DEMO) {
      return {
        tariff: {
          id: 'default',
          name: 'Стандартный тариф',
          invocationsPrice: 0.01,
          durationPrice: 0.00001,
          cpuPrice: 0.000001,
          ramPrice: 0.000001,
          coldStartPrice: 0.1,
          isDefault: true
        }
      };
    }
    const { data } = await http.get('/client/tariff');
    return data;
  },

  async requestTariffChange(description: string): Promise<{ success: boolean; message: string }> {
    if (DEMO) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Заявка на изменение тарифа отправлена' };
    }
    const { data } = await http.post('/client/tariff-request', { description });
    return data;
  },

  async getTariffRequests(): Promise<{ requests: Array<{ 
    id: string; 
    userId: string; 
    userEmail: string; 
    description: string; 
    status: 'pending' | 'approved' | 'rejected'; 
    createdAt: string;
    adminResponse?: string;
    proposedTariff?: {
      invocationsPrice: number;
      durationPrice: number;
      cpuPrice: number;
      ramPrice: number;
      coldStartPrice: number;
    };
  }> }> {
    if (DEMO) {
      return {
        requests: [
          {
            id: '1',
            userId: '1',
            userEmail: 'client1@example.com',
            description: 'Нужно увеличить лимиты на CPU для обработки больших данных',
            status: 'pending',
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            userId: '2',
            userEmail: 'client2@example.com',
            description: 'Требуется снижение стоимости RAM для наших функций',
            status: 'approved',
            createdAt: '2024-01-14T14:15:00Z',
            adminResponse: 'Тариф одобрен. Новые цены будут применены с 1 февраля.',
            proposedTariff: {
              invocationsPrice: 0.008,
              durationPrice: 0.000008,
              cpuPrice: 0.0000008,
              ramPrice: 0.0000005,
              coldStartPrice: 0.08
            }
          },
          {
            id: '3',
            userId: '3',
            userEmail: 'client3@example.com',
            description: 'Просим персональный тариф для корпоративного клиента',
            status: 'rejected',
            createdAt: '2024-01-13T09:45:00Z',
            adminResponse: 'К сожалению, мы не можем предоставить персональный тариф. Рассмотрите наши стандартные предложения.'
          }
        ]
      };
    }
    const { data } = await http.get('/admin/tariff-requests');
    return data;
  },

  async approveTariffRequest(
    requestId: string, 
    proposedTariff: {
      invocationsPrice: number;
      durationPrice: number;
      cpuPrice: number;
      ramPrice: number;
      coldStartPrice: number;
    },
    adminResponse: string
  ): Promise<{ success: boolean; message: string }> {
    if (DEMO) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Тариф одобрен и отправлен клиенту' };
    }
    const { data } = await http.post(`/admin/tariff-requests/${requestId}/approve`, {
      proposedTariff,
      adminResponse
    });
    return data;
  },

  async rejectTariffRequest(
    requestId: string, 
    adminResponse: string
  ): Promise<{ success: boolean; message: string }> {
    if (DEMO) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Заявка отклонена' };
    }
    const { data } = await http.post(`/admin/tariff-requests/${requestId}/reject`, {
      adminResponse
    });
    return data;
  }
};