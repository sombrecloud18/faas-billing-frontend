// src/pages/ClientPage.tsx
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../api/client';
import { KpiCard } from '../components/KpiCard';

type UsagePoint = { ts: string; invocations: number; durationP95ms: number; coldStarts: number };

export function ClientPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientUsage'],
    queryFn: () => api.clientUsage(),
  });

  const usageSeries: UsagePoint[] = data?.usageSeries ?? [];
  const totalInvocations = useMemo(
    () => usageSeries.reduce((s, p) => s + (p.invocations ?? 0), 0),
    [usageSeries]
  );
  const avgP95 = useMemo(
    () => (usageSeries.length ? usageSeries.reduce((s, p) => s + (p.durationP95ms ?? 0), 0) / usageSeries.length : 0),
    [usageSeries]
  );
  const totalCold = useMemo(
    () => usageSeries.reduce((s, p) => s + (p.coldStarts ?? 0), 0),
    [usageSeries]
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Клиент</h2>
        <button onClick={() => refetch()}>Обновить</button>
      </div>

      {isLoading && <div>Загрузка...</div>}
      {error && <div style={{ color: 'crimson' }}>Ошибка загрузки</div>}

      {!isLoading && !error && data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <KpiCard title="Общая стоимость (24h)" value={`₽ ${data.summary?.totalCost?.toFixed(2) ?? '0.00'}`} />
            <KpiCard title="Всего вызовов" value={totalInvocations.toLocaleString()} />
            <KpiCard title="Среднее p95" value={`${Math.round(avgP95)} ms`} />
            <KpiCard title="Холодные старты (24h)" value={totalCold} />
          </div>

          <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>Тренд использования (вызовы)</div>
            <MiniLine data={usageSeries.map(p => p.invocations)} height={120} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', opacity: 0.7, fontSize: 12 }}>
              {usageSeries.map(p => <span key={p.ts}>{p.ts}</span>)}
            </div>
          </div>

          <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>Ваши функции</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Функции</th>
                  <th style={th}>Тариф</th>
                </tr>
              </thead>
              <tbody>
                {(data.functions ?? []).map((f: any, idx: number) => (
                  <tr key={`${f.name}-${idx}`}>
                    <td style={td}>{f.name}</td>
                    <td style={td}>{f.plan}</td>
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

function MiniLine({ data, height = 120 }: { data: number[]; height?: number }) {
  const width = Math.max(320, data.length * 20);
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