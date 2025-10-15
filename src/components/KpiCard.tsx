// src/components/KpiCard.tsx
type KpiCardProps = {
  title: string;
  value: string | number;
  hint?: string;
};
export function KpiCard({ title, value, hint }: KpiCardProps) {
  return (
    <div style={{
      padding: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      display: 'grid',
      gap: 6,
      minWidth: 180
    }}>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      {hint ? <div style={{ opacity: 0.6, fontSize: 12 }}>{hint}</div> : null}
    </div>
  );
}