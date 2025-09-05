import { useMemo } from "react";

type Hotspot = {
  id: string;
  x: number;
  y: number;
  severity: number;
  label: string;
};

export default function Map({ hotspots }: { hotspots: Hotspot[] }) {
  const defs = useMemo(
    () => (
      <defs>
        <radialGradient id="hot" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor="hsl(var(--destructive))"
            stopOpacity={0.85}
          />
          <stop
            offset="100%"
            stopColor="hsl(var(--destructive))"
            stopOpacity={0}
          />
        </radialGradient>
        <radialGradient id="warn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ok" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
        </radialGradient>
      </defs>
    ),
    [],
  );

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border bg-card shadow-soft">
      <svg viewBox="0 0 100 60" className="h-full w-full">
        {defs}
        <rect width="100" height="60" fill="url(#grid)" />
        <defs>
          <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="transparent" />
            <path
              d="M 4 0 L 0 0 0 4"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.25"
            />
          </pattern>
        </defs>
        {hotspots.map((p) => {
          const r = 6 + p.severity * 3;
          const g =
            p.severity >= 0.66
              ? "url(#hot)"
              : p.severity >= 0.33
                ? "url(#warn)"
                : "url(#ok)";
          return (
            <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
              <circle r={r} fill={g} />
              <circle r={1.3} fill="white" stroke="black" strokeWidth={0.15} />
              <text x={2.5} y={-2} fontSize={2.6} fill="hsl(var(--foreground))">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
      <div className="absolute right-2 bottom-2 rounded-md border bg-background/80 p-2 text-[10px] shadow-soft backdrop-blur">
        <div className="mb-1 font-medium text-xs">Legend</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-destructive" /> Critical
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" /> Elevated
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" /> Normal
        </div>
      </div>
    </div>
  );
}
