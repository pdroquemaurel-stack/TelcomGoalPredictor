'use client';

import { useMemo, useState } from 'react';

type ActivityPoint = {
  date: string;
  label: string;
  logins: number;
  uniqueUsers: number;
  newPredictions: number;
  apiRequests: number;
};

type MetricKey = 'logins' | 'uniqueUsers' | 'newPredictions' | 'apiRequests';

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'logins', label: 'Connexions', color: '#f97316' },
  { key: 'uniqueUsers', label: 'Joueurs uniques', color: '#10b981' },
  { key: 'newPredictions', label: 'Nouveaux pronostics', color: '#38bdf8' },
  { key: 'apiRequests', label: 'Requêtes API', color: '#a855f7' },
];

function buildPath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function AdminAnalyticsChart({ activity }: { activity: ActivityPoint[] }) {
  const [enabled, setEnabled] = useState<Record<MetricKey, boolean>>({
    logins: true,
    uniqueUsers: true,
    newPredictions: true,
    apiRequests: true,
  });
  const [hovered, setHovered] = useState<{ x: number; y: number; label: string } | null>(null);

  const chart = useMemo(() => {
    const width = 760;
    const height = 260;
    const paddingX = 44;
    const paddingY = 18;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;
    const activeKeys = METRICS.filter((metric) => enabled[metric.key]).map((metric) => metric.key);
    const maxValue = Math.max(
      ...activity.flatMap((point) => activeKeys.map((key) => point[key])),
      1,
    );

    return {
      width,
      height,
      paddingX,
      paddingY,
      plotWidth,
      plotHeight,
      maxValue,
      pointsByMetric: METRICS.map((metric) => {
        const points = activity.map((point, index) => {
          const x = paddingX + (activity.length <= 1 ? 0 : (index / (activity.length - 1)) * plotWidth);
          const value = point[metric.key];
          const y = paddingY + plotHeight - (value / maxValue) * plotHeight;
          return { x, y, value, dateLabel: point.label, key: metric.key, metricLabel: metric.label };
        });

        return { ...metric, points, enabled: enabled[metric.key] };
      }),
    };
  }, [activity, enabled]);

  return (
    <section className="rounded-2xl bg-white p-4">
      <h2 className="text-lg font-bold">Analytics activité</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {METRICS.map((metric) => (
          <button
            key={metric.key}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${enabled[metric.key] ? 'border-slate-900 text-slate-900' : 'border-slate-300 text-slate-400'}`}
            onClick={() => setEnabled((previous) => ({ ...previous, [metric.key]: !previous[metric.key] }))}
          >
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: metric.color }} />
            {metric.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 overflow-x-auto" data-testid="admin-analytics-chart">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="min-w-[760px]" role="img" aria-label="Graphique analytics admin">
          <line x1={chart.paddingX} y1={chart.paddingY + chart.plotHeight} x2={chart.paddingX + chart.plotWidth} y2={chart.paddingY + chart.plotHeight} stroke="#d1d5db" />
          <line x1={chart.paddingX} y1={chart.paddingY} x2={chart.paddingX} y2={chart.paddingY + chart.plotHeight} stroke="#d1d5db" />

          {chart.pointsByMetric.map((metric) => (
            metric.enabled ? (
              <g key={metric.key}>
                <path d={buildPath(metric.points)} fill="none" stroke={metric.color} strokeWidth={2.5} />
                {metric.points.map((point) => (
                  <circle
                    key={`${metric.key}-${point.x}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill={metric.color}
                    onMouseEnter={() => setHovered({ x: point.x, y: point.y, label: `${point.dateLabel} • ${point.metricLabel} = ${point.value}` })}
                    onMouseLeave={() => setHovered(null)}
                    data-testid="admin-analytics-point"
                  />
                ))}
              </g>
            ) : null
          ))}

          {activity.map((point, index) => {
            const x = chart.paddingX + (activity.length <= 1 ? 0 : (index / (activity.length - 1)) * chart.plotWidth);
            return (
              <text key={point.date} x={x} y={chart.height - 4} textAnchor="middle" fontSize="10" fill="#475569">
                {point.label}
              </text>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute rounded bg-black/90 px-2 py-1 text-xs font-semibold text-white"
            style={{ left: Math.max(12, hovered.x - 100), top: Math.max(8, hovered.y - 34) }}
            data-testid="admin-analytics-tooltip"
          >
            {hovered.label}
          </div>
        )}
      </div>
    </section>
  );
}
