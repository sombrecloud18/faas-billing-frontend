// src/pages/ClientPage.tsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { KpiCard } from '../components/KpiCard';

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

export function ClientPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientUsageV2'],
    queryFn: () => api.clientUsage(),
  });

  const { data: tariffData } = useQuery({
    queryKey: ['clientTariff'],
    queryFn: () => api.getCurrentTariff(),
  });

  const hourly: HourPoint[] = data?.hourly ?? [];
  const byFunction: FnRow[] = data?.byFunction ?? [];
  const currentTariff = tariffData?.tariff;

  const [activeMetric, setActiveMetric] = useState<MetricKey>('invocations');
  const [period, setPeriod] = useState<PeriodKey>('24h');
  const [isDetailizationModalOpen, setIsDetailizationModalOpen] = useState(false);
  const [detailizationStartDate, setDetailizationStartDate] = useState('');
  const [detailizationEndDate, setDetailizationEndDate] = useState('');
  const [detailizationSuccess, setDetailizationSuccess] = useState<string | null>(null);

  // Состояния для заявки на изменение тарифа
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffDescription, setTariffDescription] = useState('');
  const [tariffSuccess, setTariffSuccess] = useState<string | null>(null);

  const detailizationMutation = useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      api.requestDetailization(startDate, endDate),
    onSuccess: (result) => {
      setDetailizationSuccess(result.message);
      setIsDetailizationModalOpen(false);
      // Скрываем сообщение через 3 секунды
      setTimeout(() => setDetailizationSuccess(null), 3000);
    },
    onError: (error) => {
      console.error('Ошибка при запросе детализации:', error);
    },
  });

  const tariffMutation = useMutation({
    mutationFn: (description: string) => api.requestTariffChange(description),
    onSuccess: (result) => {
      setTariffSuccess(result.message);
      setIsTariffModalOpen(false);
      setTariffDescription('');
      // Скрываем сообщение через 3 секунды
      setTimeout(() => setTariffSuccess(null), 3000);
    },
    onError: (error) => {
      console.error('Ошибка при запросе изменения тарифа:', error);
    },
  });

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
        <h2 style={{ margin: 0 }}>Клиент</h2>
        <button onClick={() => refetch()}>Обновить</button>
      </div>

      {isLoading && <div>Загрузка…</div>}
      {error && <div style={{ color: 'crimson' }}>Ошибка загрузки</div>}

      {/* Текущий тариф */}
      {currentTariff && (
        <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Текущий тариф: {currentTariff.name}</h3>
            <button 
              onClick={() => setIsTariffModalOpen(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Запросить изменение тарифа
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Вызовы</div>
              <div style={{ fontSize: 16, fontWeight: '500' }}>₽ {currentTariff.invocationsPrice.toFixed(4)}</div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Длительность (мс)</div>
              <div style={{ fontSize: 16, fontWeight: '500' }}>₽ {currentTariff.durationPrice.toFixed(6)}</div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>CPU (ядро·мс)</div>
              <div style={{ fontSize: 16, fontWeight: '500' }}>₽ {currentTariff.cpuPrice.toFixed(7)}</div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>RAM (MB·сек)</div>
              <div style={{ fontSize: 16, fontWeight: '500' }}>₽ {currentTariff.ramPrice.toFixed(7)}</div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Холодные старты</div>
              <div style={{ fontSize: 16, fontWeight: '500' }}>₽ {currentTariff.coldStartPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Сообщение об успешной отправке заявки на тариф */}
      {tariffSuccess && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: 8
        }}>
          {tariffSuccess}
        </div>
      )}

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

          {/* Кнопка детализации */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button 
              onClick={() => setIsDetailizationModalOpen(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6ea8fe',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: '500'
              }}
            >
              Заказать детализацию
            </button>
          </div>

          {/* Сообщение об успешной отправке */}
          {detailizationSuccess && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#d4edda',
              color: '#155724',
              border: '1px solid #c3e6cb',
              borderRadius: 8,
              marginTop: 12
            }}>
              {detailizationSuccess}
            </div>
          )}
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

      {/* Модальное окно для детализации */}
      {isDetailizationModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: 24,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 400,
            maxWidth: 500
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'white' }}>Заказ детализации</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'white', fontSize: 14 }}>
                Дата начала:
              </label>
              <input
                type="date"
                value={detailizationStartDate}
                onChange={(e) => setDetailizationStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'white', fontSize: 14 }}>
                Дата окончания:
              </label>
              <input
                type="date"
                value={detailizationEndDate}
                onChange={(e) => setDetailizationEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsDetailizationModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (detailizationStartDate && detailizationEndDate) {
                    detailizationMutation.mutate({
                      startDate: detailizationStartDate,
                      endDate: detailizationEndDate
                    });
                  }
                }}
                disabled={!detailizationStartDate || !detailizationEndDate || detailizationMutation.isPending}
                style={{
                  padding: '10px 20px',
                  backgroundColor: detailizationStartDate && detailizationEndDate ? '#6ea8fe' : 'rgba(110, 168, 254, 0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: detailizationStartDate && detailizationEndDate ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                {detailizationMutation.isPending ? 'Отправка...' : 'Отправить запрос на детализацию'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для заявки на изменение тарифа */}
      {isTariffModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: 24,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 500,
            maxWidth: 600
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'white' }}>Заявка на изменение тарифа</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'white', fontSize: 14 }}>
                Опишите, какие изменения в тарифе вам нужны:
              </label>
              <textarea
                value={tariffDescription}
                onChange={(e) => setTariffDescription(e.target.value)}
                placeholder="Например: нужно снизить стоимость RAM для наших функций, так как мы используем много памяти..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsTariffModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (tariffDescription.trim()) {
                    tariffMutation.mutate(tariffDescription.trim());
                  }
                }}
                disabled={!tariffDescription.trim() || tariffMutation.isPending}
                style={{
                  padding: '10px 20px',
                  backgroundColor: tariffDescription.trim() ? '#28a745' : 'rgba(40, 167, 69, 0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: tariffDescription.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                {tariffMutation.isPending ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </div>
          </div>
        </div>
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