const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DonutChart({
  segments,
  size = 72,
}: {
  segments: { label: string; value: number }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + Math.abs(seg.value), 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} className="shrink-0">
        {segments.map((seg, i) => {
          const pct = Math.abs(seg.value) / total;
          const dash = pct * circ;
          const el = (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={4}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="transparent" strokeWidth={4} />
      </svg>
      <div className="text-xs leading-relaxed">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-gray-600 dark:text-slate-300">{seg.label}</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {((Math.abs(seg.value) / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
