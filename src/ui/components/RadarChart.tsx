export interface RadarChartProps {
  labels: string[];
  values: number[];
  maxValue: number;
  name: string;
  date?: string;
  size?: number;
  onClick?: () => void;
}

export function RadarChart({
  labels,
  values,
  maxValue,
  name,
  date,
  size = 280,
  onClick,
}: RadarChartProps): JSX.Element {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.3;
  const labelRadius = radius + 45;
  const n = labels.length;

  function pointOnAxis(index: number, value: number, r: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = (value / maxValue) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  // Grid rings
  const rings = [];
  for (let level = 1; level <= maxValue; level++) {
    const points = Array.from({ length: n }, (_, i) => pointOnAxis(i, level, radius));
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${String(p.x)},${String(p.y)}`).join(' ') + ' Z';
    rings.push(<path key={`ring-${String(level)}`} d={d} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />);
  }

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const outer = pointOnAxis(i, maxValue, radius);
    return (
      <line
        key={`axis-${String(i)}`}
        x1={String(cx)}
        y1={String(cy)}
        x2={String(outer.x)}
        y2={String(outer.y)}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
    );
  });

  // Data polygon
  const dataPoints = values.map((v, i) => pointOnAxis(i, v, radius));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${String(p.x)},${String(p.y)}`).join(' ') + ' Z';

  // Labels + score values
  const labelElements = labels.map((label, i) => {
    const pos = pointOnAxis(i, maxValue, labelRadius);
    const scorePos = pointOnAxis(i, values[i], radius);
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
    const dy = Math.abs(Math.sin(angle)) < 0.1 ? (Math.cos(angle) < -0.5 ? '-0.5em' : '0.8em') : '0.35em';

    return (
      <g key={`label-${String(i)}`}>
        <text
          x={String(pos.x)}
          y={String(pos.y)}
          textAnchor={textAnchor}
          dy={dy}
          fontSize="9"
          fill="currentColor"
          opacity="0.7"
        >
          {label}
        </text>
        {values[i] > 0 && (
          <text
            x={String(scorePos.x)}
            y={String(scorePos.y)}
            textAnchor="middle"
            dy="-0.6em"
            fontSize="10"
            fontWeight="bold"
            fill="var(--primary, #d4a84e)"
          >
            {values[i].toFixed(1)}
          </text>
        )}
      </g>
    );
  });

  return (
    <div
      className="check-radar-card"
      onClick={onClick}
      role={onClick !== undefined ? 'button' : undefined}
      tabIndex={onClick !== undefined ? 0 : undefined}
      onKeyDown={onClick !== undefined ? (e): void => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        aria-label={`Radar chart for ${name}`}
      >
        {rings}
        {axes}
        <path d={dataPath} fill="rgba(94, 196, 200, 0.25)" stroke="#5ec4c8" strokeWidth="2" />
        {dataPoints.map((p, i) => (
          <circle key={`dot-${String(i)}`} cx={String(p.x)} cy={String(p.y)} r="3.5" fill="#5ec4c8" />
        ))}
        {labelElements}
      </svg>
      <div className="check-radar-label">
        <span className="check-radar-name">{name}</span>
        {date !== undefined && date !== '' && <span className="check-radar-date">{date}</span>}
      </div>
    </div>
  );
}
