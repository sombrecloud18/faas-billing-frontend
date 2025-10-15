// src/components/UserDetailView.tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { KpiCard } from './KpiCard';

type HourPoint = {
  ts: string;
  invocations: number;
  durationP95ms: number;
  coldStarts: number;
  cpuCoreMs: number;
  ramMbSec: number;
  cost: number;
};

type FnRow = {
  name: string;
  plan: string;
  totals: {
    invocations: number;
    durationP95ms: number;
    coldStarts: number;
    cpuCoreMs: number;
    ramMbSec: number;
    cost: number;
  };
  series: Array<Omit<HourPoint, 'cost'> & { ts: string }>;
};

const METRICS = [
  { key: 'ramMbSec', title: 'RAM (MB·сек)' },
  { key: 'cpuCoreMs', title: 'CPU (ядро·мс)' },
  { key: 'invocations', title: 'Вызовы' },
  { key: 'durationP95ms', title: 'Длительность p95 (мс)' },
  { key: 'coldStarts', title: 'Холодные старты' },
] as const;

type MetricKey = typeof METRICS[number]['key'];

const PERIODS = [
  { key: 'last5', label: 'последние 5 точек' },
  { key: '1h', label: 'за последний час' },
  { key: '24h', label: 'за последние сутки' },
] as const;

type PeriodKey = typeof PERIODS[number]['key'];

interface UserDetailViewProps {
  userId: string;
  userEmail: string;
  onBack: () => void;
}

export function UserDetailView({ userId, userEmail, onBack }: UserDetailViewProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userUsage', userId],
    queryFn: () => api.getUserUsage(userId),
  });

  const hourly: HourPoint[] = data?.hourly ?? [];
  const byFunction: FnRow[] = data?.byFunction ?? [];

  const [activeMetric, setActiveMetric] = useState<MetricKey>('invocations');
  const [period, setPeriod] = useState<PeriodKey>('24h');

  const averages = useMemo(() => ({
    ramMbSec: data?.summary?.avgRamMbSec ?? 0,
    cpuCoreMs: data?.summary?.avgCpuCoreMs ?? 0,
    invocations: data?.summary?.avgInvocations ?? 0,
    durationP95ms: data?.summary?.avgDurationP95ms ?? 0,
    coldStarts: data?.summary?.avgColdStarts ?? 0,
  }), [data]);

  // период для таблицы функций (резать будем серии каждой функции только для агрегатов)
  const sliceCount = period === 'last5' ? 5 : period === '1h' ? 1 : 24;

  const tableRows = useMemo(() => {
    return byFunction.map(f => {
      const s = f.series.slice(-sliceCount);
      const sum = <K extends keyof typeof s[number]>(k: K) => s.reduce((acc, p) => acc + (p[k] as number), 0);
      const inv = sum('invocations');
      const p95 = Math.round(sum('durationP95ms') / (s.length || 1));
      const cs = sum('coldStarts');
      const cpu = sum('cpuCoreMs');
      const ram = sum('ramMbSec');
      const cost = +(inv * 0.01 + p95 * 0.00001 * Math.max(inv, 1) + ram * 0.000001 + cs * 0.1).toFixed(2);
      return {
        name: f.name,
        plan: f.plan,
        totals: { invocations: inv, durationP95ms: p95, coldStarts: cs, cpuCoreMs: cpu, ramMbSec: ram, cost },
      };
    });
  }, [byFunction, sliceCount]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button 
          onClick={onBack}
          style={{
            padding: '8px 12px',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          ← Назад
        </button>
        <h2 style={{ margin: 0 }}>Пользователь: {userEmail}</h2>
        <button onClick={() => refetch()}>Обновить</button>
      </div>

      {isLoading && <div>Загрузка…</div>}
      {error && <div style={{ color: 'crimson' }}>Ошибка загрузки</div>}

      {!isLoading && !error && data && (
        <>
          {/* KPI: среднесуточные */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                style={{
                  textAlign: 'left',
                  background: 'transparent',
                  border: activeMetric === m.key ? '2px solid #6ea8fe' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  padding: 0,
                  cursor: 'pointer'
                }}
              >
                <div style={{ padding: 12 }}>
                  <KpiCard
                    title={`${m.title} — среднесуточно`}
                    value={formatMetric(m.key, averages[m.key as MetricKey])}
                    hint="За последние 24 часа"
                  />
                </div>
              </button>
            ))}
          </div>
          
          {/* График выбранной метрики по часам */}
          <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>
              Почасовой график: {METRICS.find(m => m.key === activeMetric)?.title}
            </div>
            <MiniLine data={hourly.map(p => pickMetric(p, activeMetric))} height={140} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', opacity: 0.7, fontSize: 12 }}>
              {hourly.map(p => <span key={p.ts}>{p.ts}</span>)}
            </div>
          </div>

          {/* Детализация долга */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <KpiCard 
              title="Тариф за вчера" 
              value={`₽ ${(data.summary?.yesterdayCost ?? 0).toFixed(2)}`} 
              hint="суммарно потрачено" 
            />
            <KpiCard 
              title="Тариф на данный момент" 
              value={`₽ ${(data.summary?.todayCost ?? 0).toFixed(2)}`} 
              hint="с 00:00 до нынешнего времени" 
            />
            <KpiCard 
              title="Общий долг" 
              value={`₽ ${(data.summary?.totalDebt ?? 0).toFixed(2)}`} 
              hint="на текущий момент" 
            />
          </div>

          {/* Переключатель периода и таблица функций */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <div style={{ opacity: 0.8 }}>Период для таблицы:</div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {PERIODS.map(p => <option style={{ color: 'black' }} key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>

          <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>Функции</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Функция</th>
                  <th style={th}>Тариф</th>
                  <th style={th}>Вызовы</th>
                  <th style={th}>Длительность p95 (мс)</th>
                  <th style={th}>Холодные старты</th>
                  <th style={th}>CPU (ядро·мс)</th>
                  <th style={th}>RAM (MB·сек)</th>
                  <th style={th}>Стоимость (₽)</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(r => (
                  <tr key={r.name}>
                    <td style={td}>{r.name}</td>
                    <td style={td}>{r.plan}</td>
                    <td style={td}>{formatNumber(r.totals.invocations)}</td>
                    <td style={td}>{formatNumber(r.totals.durationP95ms)}</td>
                    <td style={td}>{formatNumber(r.totals.coldStarts)}</td>
                    <td style={td}>{formatNumber(r.totals.cpuCoreMs)}</td>
                    <td style={td}>{formatNumber(r.totals.ramMbSec)}</td>
                    <td style={td}>₽ {Number(r.totals.cost ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '8px 6px' };
const td: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 6px' };

function pickMetric(p: HourPoint, k: MetricKey): number {
  switch (k) {
    case 'ramMbSec': return p.ramMbSec;
    case 'cpuCoreMs': return p.cpuCoreMs;
    case 'invocations': return p.invocations;
    case 'durationP95ms': return p.durationP95ms;
    case 'coldStarts': return p.coldStarts;
  }
}

function formatNumber(n: number): string {
  return Number(n ?? 0).toLocaleString();
}

function formatMetric(k: MetricKey, v: number): string {
  switch (k) {
    case 'ramMbSec': return `${formatNumber(v)} MB·сек`;
    case 'cpuCoreMs': return `${formatNumber(v)} ядро·мс`;
    case 'invocations': return `${formatNumber(v)}`;
    case 'durationP95ms': return `${formatNumber(v)} мс`;
    case 'coldStarts': return `${formatNumber(v)}`;
  }
}

function MiniLine({ data, height = 120 }: { data: number[]; height?: number }) {
  const width = Math.max(360, data.length * 20);
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pad = 8;

  const points = data.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, data.length - 1);
    const norm = max === min ? 0.5 : (v - min) / (max - min);
    const y = height - pad - norm * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke="#6ea8fe" strokeWidth="2" />
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,255,255,0.2)" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(255,255,255,0.2)" />
    </svg>
  );
}
